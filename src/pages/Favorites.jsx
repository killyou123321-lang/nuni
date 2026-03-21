import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import RecipeCard from '../components/RecipeCard';
import SaveToBookModal from '../components/SaveToBookModal';
import { colors } from '../colors';

export default function Favorites() {
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveTarget, setSaveTarget] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'recipes'),
      where('favoritedBy', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, paddingBottom: '80px', direction: 'rtl' }}>
      <Header title="❤️ מועדפים" />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: colors.textLight, padding: '40px' }}>טוענת...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
            <p style={{ color: colors.textLight, fontSize: '15px' }}>
              עוד לא סימנת מועדפים<br />לחצי ❤️ על מתכון שאת אוהבת
            </p>
          </div>
        ) : (
          recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onSaveToBook={r => setSaveTarget(r)} />
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
