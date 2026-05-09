import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function SaveToBookModal({ recipe, onClose }) {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'userCategories', currentUser.uid, 'categories')),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [currentUser]);

  async function handleSave() {
    setSaving(true);
    try {
      await addDoc(collection(db, 'recipes'), {
        title: recipe.title,
        category: selected || '',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        imageURL: recipe.imageURL || '',
        visibility: 'private',
        authorId: currentUser.uid,
        authorName: '',
        authorPhoto: '',
        likes: [],
        savedBy: [],
        favoritedBy: [],
        createdAt: serverTimestamp(),
        savedFrom: recipe.id,
      });
      await updateDoc(doc(db, 'recipes', recipe.id), {
        savedBy: arrayUnion(currentUser.uid),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(50,34,20,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          width: '100%',
          direction: 'rtl',
        }}
      >
        <div style={{ width: '40px', height: '4px', background: colors.outlineVariant, borderRadius: '2px', margin: '0 auto 20px' }} />
        <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: colors.primary, fontFamily: "'EB Garamond', serif" }}>
          שמרי &ldquo;{recipe.title}&rdquo;
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: colors.onSurfaceVariant }}>
          בחרי לאיזו קטגוריה לשמור בספר שלך:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setSelected('')}
            style={catBtn(selected === '')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
            ללא קטגוריה
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.name)}
              style={catBtn(selected === cat.name)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
              {cat.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            background: colors.secondary,
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '16px',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_box</span>
          {saving ? 'שומרת...' : 'שמרי לספר שלי'}
        </button>
      </div>
    </div>
  );
}

function catBtn(active) {
  return {
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: active ? colors.secondary : colors.onSurface,
    textAlign: 'right',
    transition: 'all 0.15s',
    background: active ? colors.peachLight : colors.surfaceContainerLow,
    border: `1.5px solid ${active ? colors.secondary : colors.outlineVariant}`,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: 'inherit',
  };
}
