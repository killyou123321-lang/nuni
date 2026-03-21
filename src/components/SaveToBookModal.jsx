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
      // Add a copy to user's recipes
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

      // Mark as saved on original
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.white,
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          width: '100%',
          direction: 'rtl',
        }}
      >
        <div style={{ width: '40px', height: '4px', background: colors.border, borderRadius: '2px', margin: '0 auto 20px' }} />
        <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: colors.text }}>
          שמרי "{recipe.title}"
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: colors.textLight }}>
          בחרי לאיזו קטגוריה לשמור בספר שלך:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setSelected('')}
            style={{
              ...catBtn,
              background: selected === '' ? colors.peachLight : colors.white,
              border: `1.5px solid ${selected === '' ? colors.peach : colors.border}`,
            }}
          >
            ללא קטגוריה
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.name)}
              style={{
                ...catBtn,
                background: selected === cat.name ? colors.peachLight : colors.white,
                border: `1.5px solid ${selected === cat.name ? colors.peach : colors.border}`,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            color: colors.white,
            fontWeight: '700',
            fontSize: '16px',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'שומרת...' : '📌 שמרי לספר שלי'}
        </button>
      </div>
    </div>
  );
}

const catBtn = {
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  color: '#5C4033',
  textAlign: 'right',
  transition: 'all 0.15s',
};
