import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import RecipeCard from '../components/RecipeCard';
import SaveToBookModal from '../components/SaveToBookModal';
import { colors } from '../colors';

export default function Feed() {
  const { currentUser, userProfile } = useAuth();
  const [tab, setTab] = useState('discover');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveTarget, setSaveTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    let q;
    if (tab === 'following' && userProfile?.following?.length > 0) {
      q = query(
        collection(db, 'recipes'),
        where('authorId', 'in', userProfile.following.slice(0, 10)),
        where('visibility', 'in', ['public', 'followers']),
      );
    } else if (tab === 'following') {
      setRecipes([]);
      setLoading(false);
      return;
    } else {
      q = query(
        collection(db, 'recipes'),
        where('visibility', '==', 'public'),
      );
    }

    const unsub = onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecipes(list);
      setLoading(false);
    });
    return unsub;
  }, [tab, userProfile?.following?.join(',')]);

  async function handleSaveToBook(recipe) {
    setSaveTarget(recipe);
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, paddingBottom: '80px', direction: 'rtl' }}>
      <Header title="🍽️ מתכונים" />

      {/* Tabs */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: '8px' }}>
        {[
          { key: 'discover', label: '🌍 לגלות' },
          { key: 'following', label: '👥 עוקבים' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              background: tab === t.key ? colors.peachDeep : colors.white,
              color: tab === t.key ? colors.white : colors.text,
              border: `1.5px solid ${tab === t.key ? colors.peachDeep : colors.border}`,
              borderRadius: '14px',
              padding: '11px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: colors.textLight, padding: '40px' }}>טוענת...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {tab === 'following' ? '👥' : '🍽️'}
            </div>
            <p style={{ color: colors.textLight, fontSize: '15px' }}>
              {tab === 'following' ? 'עיקבי אחרי משתמשים כדי לראות את המתכונים שלהם' : 'אין מתכונים עדיין'}
            </p>
          </div>
        ) : (
          recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onSaveToBook={handleSaveToBook} />
          ))
        )}
      </div>

      {saveTarget && (
        <SaveToBookModal
          recipe={saveTarget}
          onClose={() => setSaveTarget(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
