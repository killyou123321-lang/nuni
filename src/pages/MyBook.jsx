import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const PRESET_CATEGORIES = [
  'ארוחת בוקר', 'מרקים', 'סלטים', 'מנות עיקריות', 'קינוחים',
  'אפייה', 'שתייה', 'חטיפים', 'לחמים', 'פסטות', 'בשר', 'דגים',
];

export default function MyBook() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [search, setSearch] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'recipes'), where('authorId', '==', currentUser.uid));
    return onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, 'userCategories', currentUser.uid, 'categories');
    return onSnapshot(query(ref), snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentUser]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await addDoc(collection(db, 'userCategories', currentUser.uid, 'categories'), {
      name: newCategoryName.trim(), order: categories.length,
    });
    setNewCategoryName(''); setShowAddCategory(false);
  }

  async function deleteCategory(catId) {
    if (!confirm('למחוק קטגוריה זו?')) return;
    await deleteDoc(doc(db, 'userCategories', currentUser.uid, 'categories', catId));
  }

  const filtered = recipes.filter(r => {
    const matchCat = selectedCategory === 'הכל' || r.category === selectedCategory;
    const s = search.toLowerCase();
    const matchSearch = !search || r.title?.toLowerCase().includes(s) ||
      r.ingredients?.some(i => i.toLowerCase().includes(s));
    return matchCat && matchSearch;
  });

  const allCategories = ['הכל', ...categories.map(c => c.name)];

  return (
    <div style={{ minHeight: '100svh', direction: 'rtl', paddingBottom: '100px' }}>
      <Header />

      <main style={{ padding: '24px 16px 0' }}>
        {/* Title */}
        <h2 style={{ margin: '0 0 20px', fontFamily: 'EB Garamond, serif', fontSize: '32px', color: '#322214', fontWeight: '600' }}>
          הספר שלי
        </h2>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#ffffff', border: '1px solid rgba(210,196,187,0.6)',
          borderRadius: '16px', padding: '11px 16px', marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(74,55,40,0.04)',
        }}>
          <span className="material-symbols-outlined" style={{ color: '#80756d', fontSize: '20px' }}>search</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חפשי לפי שם או מצרך..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1c1c18', direction: 'rtl', textAlign: 'right' }}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              background: selectedCategory === cat ? '#9a4600' : 'rgba(235,232,226,0.7)',
              color: selectedCategory === cat ? '#ffffff' : '#4e453e',
              border: 'none', borderRadius: '20px', padding: '7px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: selectedCategory === cat ? '0 4px 12px rgba(154,70,0,0.25)' : 'none',
              transition: 'all 0.2s', flexShrink: 0,
            }}>{cat}</button>
          ))}
          <button onClick={() => setShowAddCategory(true)} style={{
            background: 'rgba(235,232,226,0.7)', color: '#4e453e',
            border: '1px dashed rgba(128,117,109,0.4)', borderRadius: '20px',
            padding: '7px 14px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}>+ קטגוריה</button>
        </div>

        {/* Existing categories management */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {categories.map(cat => (
              <span key={cat.id} style={{
                background: '#f7f3ed', border: '1px solid rgba(210,196,187,0.5)',
                borderRadius: '12px', padding: '4px 6px 4px 10px',
                fontSize: '12px', color: '#4e453e',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {cat.name}
                <button onClick={() => deleteCategory(cat.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#80756d', fontSize: '14px', padding: 0, lineHeight: 1,
                }}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Add category form */}
        {showAddCategory && (
          <div style={{
            background: '#ffffff', border: '1px solid rgba(210,196,187,0.4)',
            borderRadius: '16px', padding: '16px', marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(74,55,40,0.06)',
          }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                autoFocus value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="שם הקטגוריה..."
                style={inputStyle}
              />
              {newCategoryName.trim() && (() => {
                const suggestions = PRESET_CATEGORIES.filter(
                  s => s.toLowerCase().includes(newCategoryName.toLowerCase()) && !categories.find(c => c.name === s)
                );
                if (!suggestions.length) return null;
                return (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, left: 0,
                    background: '#ffffff', border: '1px solid rgba(210,196,187,0.5)',
                    borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    zIndex: 100, marginTop: '4px',
                  }}>
                    {suggestions.map((s, i) => (
                      <button key={s} type="button" onMouseDown={() => setNewCategoryName(s)} style={{
                        display: 'block', width: '100%', textAlign: 'right',
                        padding: '10px 14px', background: 'transparent',
                        border: 'none', borderTop: i > 0 ? '1px solid rgba(210,196,187,0.3)' : 'none',
                        fontSize: '14px', color: '#1c1c18', cursor: 'pointer', fontFamily: 'inherit',
                      }}>{s}</button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addCategory} style={primaryBtn}>הוסיפי</button>
              <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} style={ghostBtn}>ביטול</button>
            </div>
          </div>
        )}

        {/* Add recipe button */}
        <button onClick={() => navigate('/add-recipe')} style={{
          width: '100%', background: '#9a4600', border: 'none', borderRadius: '16px',
          padding: '15px', color: '#ffffff', fontWeight: '700', fontSize: '15px',
          cursor: 'pointer', marginBottom: '20px',
          boxShadow: '0 4px 14px rgba(154,70,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          הוסיפי מתכון חדש
        </button>

        {/* Recipes grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#80756d', padding: '40px' }}>טוענת...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#d2c4bb', display: 'block', marginBottom: '12px' }}>menu_book</span>
            <p style={{ color: '#80756d', fontSize: '15px', margin: 0 }}>
              {search || selectedCategory !== 'הכל' ? 'לא נמצאו מתכונים' : 'הספר שלך ריק עדיין'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {filtered.map(recipe => (
              <RecipeTile key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function RecipeTile({ recipe }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/recipe/${recipe.id}`)} style={{
      background: '#ffffff', borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(74,55,40,0.06)',
      border: '1px solid rgba(210,196,187,0.25)', cursor: 'pointer',
    }}>
      {recipe.imageURL ? (
        <img src={recipe.imageURL} alt={recipe.title} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '90px', background: '#f1ede7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#d2c4bb' }}>restaurant</span>
        </div>
      )}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontFamily: 'EB Garamond, serif', fontWeight: '500',
          fontSize: '15px', color: '#322214', marginBottom: '4px', lineHeight: '1.3',
        }}>{recipe.title}</div>
        {recipe.category && (
          <span style={{
            background: 'rgba(154,70,0,0.08)', color: '#9a4600',
            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '8px',
          }}>{recipe.category}</span>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1px solid rgba(210,196,187,0.4)', fontSize: '14px',
  outline: 'none', direction: 'rtl', background: '#f7f3ed',
  color: '#1c1c18', boxSizing: 'border-box', fontFamily: 'inherit',
};
const primaryBtn = {
  background: '#9a4600', border: 'none', borderRadius: '10px',
  padding: '10px 16px', color: '#ffffff', fontWeight: '600',
  cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
};
const ghostBtn = {
  background: '#f7f3ed', border: 'none', borderRadius: '10px',
  padding: '10px 16px', color: '#4e453e', fontWeight: '600',
  cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
};
