import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, onSnapshot, query, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

const PRESET_CATEGORIES = [
  'ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב', 'מרקים', 'סלטים',
  'עוגות', 'קינוחים', 'חטיפים', 'לחמים', 'פסטה', 'אורז',
  'דגים', 'בשר', 'עוף', 'טבעוני', 'צמחוני',
];

async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

export default function AddEditRecipe() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [visibility, setVisibility] = useState('public');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageURL, setExistingImageURL] = useState('');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, 'userCategories', currentUser.uid, 'categories')),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.warn('[categories] onSnapshot error:', err.code, err.message)
    );
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!isEdit) return;
    getDoc(doc(db, 'recipes', id)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || '');
        setCategory(data.category || '');
        setNewCategory(data.category || '');
        setIngredients(data.ingredients?.length ? data.ingredients : ['']);
        setSteps(data.steps?.length ? data.steps : ['']);
        setVisibility(data.visibility || 'public');
        setExistingImageURL(data.imageURL || '');
        setImagePreview(data.imageURL || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, isEdit]);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function updateIngredient(i, val) {
    const arr = [...ingredients];
    arr[i] = val;
    setIngredients(arr);
  }

  function updateStep(i, val) {
    const arr = [...steps];
    arr[i] = val;
    setSteps(arr);
  }

  async function handleSave() {
    console.log('[save] start — user:', currentUser?.uid, 'isEdit:', isEdit);

    if (!title.trim()) return alert('הכניסי שם למתכון');

    // Guard: must be authenticated
    if (!currentUser) {
      alert('את לא מחוברת — אנא התחברי מחדש');
      return;
    }

    setSaving(true);

    const withTimeout = (promise, ms, label) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT:${label}`)), ms)
      ),
    ]);

    try {
      const finalCategory = newCategory.trim();
      let imageURL = existingImageURL;

      if (imageFile) {
        console.log('[save] uploading image...');
        const compressed = await compressImage(imageFile);
        const storageRef = ref(storage, `recipes/${isEdit ? id : Date.now()}/image`);
        await withTimeout(uploadBytes(storageRef, compressed), 20000, 'upload');
        imageURL = await withTimeout(getDownloadURL(storageRef), 10000, 'getDownloadURL');
        console.log('[save] image uploaded OK');
      }

      const data = {
        title: title.trim(),
        category: finalCategory,
        ingredients: ingredients.filter(i => i.trim()),
        steps: steps.filter(s => s.trim()),
        imageURL,
        visibility,
        authorId: currentUser.uid,
        authorName: userProfile?.name || currentUser.displayName || '',
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        updatedAt: serverTimestamp(),
      };

      console.log('[save] writing to Firestore — collection: recipes, isEdit:', isEdit);

      if (isEdit) {
        await withTimeout(updateDoc(doc(db, 'recipes', id), data), 10000, 'updateDoc');
      } else {
        data.createdAt = serverTimestamp();
        data.likes = [];
        data.savedBy = [];
        data.favoritedBy = [];
        await withTimeout(addDoc(collection(db, 'recipes'), data), 10000, 'addDoc');
      }

      console.log('[save] Firestore write OK');

      // Save new category in background — does not block navigation
      if (finalCategory && !categories.some(c => c.name === finalCategory)) {
        const catRef = doc(collection(db, 'userCategories', currentUser.uid, 'categories'));
        setDoc(catRef, { name: finalCategory }).catch(err =>
          console.warn('[save] category write failed (non-blocking):', err.code)
        );
      }

      navigate('/my-book');
    } catch (err) {
      console.error('[save] FAILED — code:', err.code, 'message:', err.message, err);

      const msg = err.message ?? '';
      if (msg.startsWith('TIMEOUT:')) {
        const step = msg.split(':')[1];
        alert(`השמירה נכשלה בשלב "${step}" — בדקי חיבור לאינטרנט ונסי שוב`);
      } else if (err.code === 'permission-denied') {
        alert('אין הרשאת כתיבה. יש לעדכן את חוקי Firebase Console.');
      } else if (err.code === 'unauthenticated') {
        alert('פג תוקף ההתחברות — אנא התחברי מחדש');
      } else {
        alert('שגיאה בשמירה: ' + (err.message || 'שגיאה לא ידועה'));
      }
    } finally {
      // Guarantee loading state always resets, even if navigate() somehow throws
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.textLight }}>טוענת...</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, direction: 'rtl', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: colors.white, fontSize: '18px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: colors.white }}>
          {isEdit ? 'עריכת מתכון' : 'מתכון חדש'}
        </h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Image */}
        <label style={{
          display: 'block',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          border: `2px dashed ${colors.border}`,
          background: imagePreview ? 'transparent' : colors.peachLight,
        }}>
          {imagePreview ? (
            <img src={imagePreview} alt="תמונה" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
              <div style={{ color: colors.textLight, fontSize: '14px' }}>לחצי להוספת תמונה</div>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
        </label>

        {/* Title */}
        <div>
          <label style={labelStyle}>שם המתכון *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="לדוגמה: עוגת שוקולד של סבתא"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>קטגוריה</label>
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onBlur={() => setTimeout(() => setNewCategory(prev => prev), 150)}
            placeholder="הכניסי קטגוריה..."
            style={{ ...inputStyle, fontSize: '14px' }}
          />
          {/* Autocomplete suggestions */}
          {newCategory.trim() && (() => {
            const lower = newCategory.trim().toLowerCase();
            const allOptions = [
              ...PRESET_CATEGORIES,
              ...categories.map(c => c.name).filter(n => !PRESET_CATEGORIES.includes(n)),
            ];
            const suggestions = allOptions.filter(
              c => c.toLowerCase().includes(lower) && c !== newCategory.trim()
            );
            if (!suggestions.length) return null;
            return (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                left: 0,
                background: colors.white,
                border: `1.5px solid ${colors.border}`,
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                zIndex: 100,
                overflow: 'hidden',
                marginTop: '4px',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => setNewCategory(s)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'right',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                      fontSize: '14px',
                      color: colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Visibility */}
        <div>
          <label style={labelStyle}>נראות</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { val: 'public', label: '🌍 כולם' },
              { val: 'followers', label: '👥 עוקבים' },
              { val: 'private', label: '🔒 פרטי' },
            ].map(v => (
              <button
                key={v.val}
                onClick={() => setVisibility(v.val)}
                style={{
                  flex: 1,
                  background: visibility === v.val ? colors.peachDeep : colors.white,
                  color: visibility === v.val ? colors.white : colors.text,
                  border: `1.5px solid ${visibility === v.val ? colors.peachDeep : colors.border}`,
                  borderRadius: '12px',
                  padding: '10px 6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label style={labelStyle}>מצרכים</label>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={ing}
                onChange={e => updateIngredient(i, e.target.value)}
                placeholder={`מצרך ${i + 1}`}
                style={{ ...inputStyle, flex: 1, margin: 0 }}
              />
              {ingredients.length > 1 && (
                <button
                  onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                  style={{ background: colors.peachLight, border: 'none', borderRadius: '10px', padding: '0 12px', cursor: 'pointer', color: colors.peachDeep, fontSize: '16px' }}
                >✕</button>
              )}
            </div>
          ))}
          <button
            onClick={() => setIngredients([...ingredients, ''])}
            style={{ background: colors.greenLight, border: `1px solid ${colors.green}`, borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', color: colors.greenDeep, fontSize: '13px', fontWeight: '600' }}
          >+ הוסיפי מצרך</button>
        </div>

        {/* Steps */}
        <div>
          <label style={labelStyle}>שלבי הכנה</label>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: colors.peachDeep, fontWeight: '700', fontSize: '16px', paddingTop: '12px', minWidth: '20px' }}>{i + 1}.</span>
              <textarea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={`שלב ${i + 1}`}
                rows={2}
                style={{ ...inputStyle, flex: 1, margin: 0, resize: 'vertical', fontFamily: 'inherit' }}
              />
              {steps.length > 1 && (
                <button
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  style={{ background: colors.peachLight, border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: colors.peachDeep, fontSize: '14px', marginTop: '4px' }}
                >✕</button>
              )}
            </div>
          ))}
          <button
            onClick={() => setSteps([...steps, ''])}
            style={{ background: colors.greenLight, border: `1px solid ${colors.green}`, borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', color: colors.greenDeep, fontSize: '13px', fontWeight: '600' }}
          >+ הוסיפי שלב</button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            color: colors.white,
            fontWeight: '700',
            fontSize: '17px',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 3px 12px rgba(244,156,125,0.4)',
          }}
        >
          {saving ? 'שומרת...' : isEdit ? '✓ שמרי שינויים' : '✓ הוסיפי מתכון'}
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontWeight: '600',
  fontSize: '14px',
  color: colors.text,
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: '12px',
  fontSize: '14px',
  outline: 'none',
  direction: 'rtl',
  background: colors.white,
  color: colors.text,
  boxSizing: 'border-box',
  display: 'block',
};
