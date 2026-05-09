import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import RecipeCard from '../components/RecipeCard';
import SaveToBookModal from '../components/SaveToBookModal';

export default function Favorites() {
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveTarget, setSaveTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'recipes'), where('favoritedBy', 'array-contains', currentUser.uid));
    return onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [currentUser]);

  return (
    <div style={{ minHeight: '100svh', direction: 'rtl', paddingBottom: '100px' }}>
      <Header />

      <main style={{ padding: '24px 16px 0' }}>
        <h2 style={{ margin: '0 0 20px', fontFamily: 'EB Garamond, serif', fontSize: '32px', color: '#322214', fontWeight: '600' }}>
          מועדפים
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#80756d', padding: '40px' }}>טוענת...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#d2c4bb', display: 'block', marginBottom: '12px' }}>favorite</span>
            <p style={{ color: '#80756d', fontSize: '15px', margin: '0 0 4px' }}>עוד לא סימנת מועדפים</p>
            <p style={{ color: '#80756d', fontSize: '13px', margin: 0, opacity: 0.8 }}>לחצי ❤️ על מתכון שאת אוהבת</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onSaveToBook={r => setSaveTarget(r)} />
            ))}
          </div>
        )}
      </main>

      {saveTarget && <SaveToBookModal recipe={saveTarget} onClose={() => setSaveTarget(null)} />}
      <BottomNav />
    </div>
  );
}
