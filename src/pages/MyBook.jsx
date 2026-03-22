import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const PRESET_CATEGORIES = [
  'ארוחת בוקר', 'מרקים', 'סלטים', 'מנות עיקריות', 'קינוחים',
  'אפייה', 'שתייה', 'חטיפים', 'לחמים', 'פסטות', 'בשר', 'דגים',
];
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { colors } from '../colors';

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
    const unsub = onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, 'userCategories', currentUser.uid, 'categories');
    const unsub = onSnapshot(query(ref), snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await addDoc(collection(db, 'userCategories', currentUser.uid, 'categories'), {
      name: newCategoryName.trim(),
      order: categories.length,
    });
    setNewCategoryName('');
    setShowAddCategory(false);
  }

  async function deleteCategory(catId) {
    if (!confirm('למחוק קטגוריה זו?')) return;
    await deleteDoc(doc(db, 'userCategories', currentUser.uid, 'categories', catId));
  }

  const filtered = recipes.filter(r => {
    const matchCat = selectedCategory === 'הכל' || r.category === selectedCategory;
    const searchLower = search.toLowerCase();
    const matchSearch = !search || r.title?.toLowerCase().includes(searchLower) ||
      r.ingredients?.some(i => i.toLowerCase().includes(searchLower));
    return matchCat && matchSearch;
  });

  const allCategories = ['הכל', ...categories.map(c => c.name)];

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, paddingBottom: '80px', direction: 'rtl' }}>
      <Header title="📚 הספר שלי" />

      <div style={{ padding: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפשי לפי שם או מצרך..."
            style={{
              width: '100%',
              padding: '12px 44px 12px 16px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: '16px',
              fontSize: '14px',
              background: colors.white,
              color: colors.text,
              outline: 'none',
              boxSizing: 'border-box',
              direction: 'rtl',
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? colors.peachDeep : colors.white,
                color: selectedCategory === cat ? colors.white : colors.text,
                border: `1.5px solid ${selectedCategory === cat ? colors.peachDeep : colors.border}`,
                borderRadius: '20px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setShowAddCategory(true)}
            style={{
              background: colors.greenLight,
              color: colors.greenDeep,
              border: `1.5px solid ${colors.green}`,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + קטגוריה
          </button>
        </div>

        {/* Category management */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {categories.map(cat => (
              <span key={cat.id} style={{
                background: colors.peachLight,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '4px 10px 4px 6px',
                fontSize: '12px',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {cat.name}
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: '13px', padding: 0, lineHeight: 1 }}
                >✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Add category modal */}
        {showAddCategory && (
          <div style={{
            background: colors.white,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                autoFocus
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="שם הקטגוריה..."
                style={{
                  width: '100%',
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  direction: 'rtl',
                  color: colors.text,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              {newCategoryName.trim() && (() => {
                const lower = newCategoryName.toLowerCase();
                const suggestions = PRESET_CATEGORIES.filter(
                  s => s.toLowerCase().includes(lower) && !categories.find(c => c.name === s)
                );
                if (!suggestions.length) return null;
                return (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, left: 0,
                    background: colors.white,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    zIndex: 100, overflow: 'hidden', marginTop: '4px',
                  }}>
                    {suggestions.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => setNewCategoryName(s)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'right',
                          padding: '10px 14px', background: 'transparent', border: 'none',
                          borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                          fontSize: '14px', color: colors.text, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={addCategory} style={btnGreen}>הוסיפי</button>
              <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} style={btnGray}>ביטול</button>
            </div>
          </div>
        )}

        {/* Add recipe button */}
        <button
          onClick={() => navigate('/add-recipe')}
          style={{
            width: '100%',
            background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
            border: 'none',
            borderRadius: '16px',
            padding: '15px',
            color: colors.white,
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: '0 3px 12px rgba(244,156,125,0.4)',
          }}
        >
          + הוסיפי מתכון חדש
        </button>

        {/* Recipes grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: colors.textLight, padding: '40px' }}>טוענת...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
            <p style={{ color: colors.textLight, fontSize: '15px' }}>
              {search || selectedCategory !== 'הכל' ? 'לא נמצאו מתכונים' : 'הספר שלך ריק עדיין\nהוסיפי את המתכון הראשון!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            {filtered.map(recipe => (
              <RecipeTile key={recipe.id} recipe={recipe} onEdit={() => navigate(`/edit-recipe/${recipe.id}`)} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function RecipeTile({ recipe, onEdit }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        background: colors.white,
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(92,64,51,0.08)',
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
      }}
    >
      {recipe.imageURL ? (
        <img src={recipe.imageURL} alt={recipe.title} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '80px',
          background: `linear-gradient(135deg, ${colors.peachLight}, ${colors.greenLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
        }}>🍽️</div>
      )}
      <div style={{ padding: '10px' }}>
        <div style={{ fontWeight: '600', fontSize: '13px', color: colors.text, marginBottom: '4px', lineHeight: '1.3' }}>
          {recipe.title}
        </div>
        {recipe.category && (
          <span style={{
            background: colors.peachLight, color: colors.peachDeep,
            fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '8px',
          }}>{recipe.category}</span>
        )}
      </div>
    </div>
  );
}

const btnGreen = {
  background: colors.greenDeep, border: 'none', borderRadius: '10px',
  padding: '10px 14px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px',
};
const btnGray = {
  background: colors.peachLight, border: 'none', borderRadius: '10px',
  padding: '10px 14px', color: colors.text, fontWeight: '600', cursor: 'pointer', fontSize: '13px',
};
