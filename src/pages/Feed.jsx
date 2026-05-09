import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import SaveToBookModal from '../components/SaveToBookModal';

const CATEGORIES = [
  { icon: 'restaurant', label: 'הכל', key: 'all' },
  { icon: 'groups', label: 'מסורת משפחתית', key: 'family' },
  { icon: 'speed', label: 'ארוחות זריזות', key: 'quick' },
  { icon: 'bakery_dining', label: 'מתוקים', key: 'sweet' },
  { icon: 'eco', label: 'צמחוני', key: 'veggie' },
];

export default function Feed() {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState('discover');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveTarget, setSaveTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

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
      q = query(collection(db, 'recipes'), where('visibility', '==', 'public'));
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

  const filteredRecipes = recipes.filter(r => {
    if (search && !r.title?.includes(search) && !r.description?.includes(search)) return false;
    return true;
  });

  const featured = filteredRecipes[0];
  const rest = filteredRecipes.slice(1);

  return (
    <div style={{ minHeight: '100svh', direction: 'rtl', paddingBottom: '100px' }}>
      <Header />

      <main style={{ padding: '32px 16px 0' }}>
        {/* Welcome */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{
            margin: 0,
            fontFamily: 'EB Garamond, serif',
            fontSize: '36px',
            lineHeight: '1.2',
            color: '#322214',
            fontWeight: '600',
          }}>
            שלום, שף!
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: '17px',
            lineHeight: '1.6',
            color: '#4e453e',
            fontStyle: 'italic',
            opacity: 0.8,
          }}>
            מה נבשל היום למשפחה?
          </p>
        </section>

        {/* Search */}
        <section style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid rgba(210,196,187,0.6)',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(74,55,40,0.04)',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#80756d', fontSize: '22px' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חפש מתכון, מרכיב או זיכרון..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                textAlign: 'right',
                fontSize: '15px',
                color: '#1c1c18',
                direction: 'rtl',
              }}
            />
            <span className="material-symbols-outlined" style={{ color: '#80756d', fontSize: '22px', cursor: 'pointer' }}>tune</span>
          </div>
        </section>

        {/* Tabs */}
        <section style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[{ key: 'discover', label: 'לגלות' }, { key: 'following', label: 'עוקבים' }].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                height: '40px',
                background: tab === t.key ? '#9a4600' : 'rgba(235,232,226,0.7)',
                color: tab === t.key ? '#ffffff' : '#4e453e',
                border: 'none',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
                boxShadow: tab === t.key ? '0 4px 12px rgba(154,70,0,0.3)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </section>

        {/* Category chips */}
        <section style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: active ? '#9a4600' : 'rgba(235,232,226,0.7)',
                  color: active ? '#ffffff' : '#4e453e',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: active ? '0 4px 12px rgba(154,70,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </section>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#80756d', fontSize: '15px' }}>
            טוענת מתכונים...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#d2c4bb', display: 'block', marginBottom: '16px' }}>
              {tab === 'following' ? 'group' : 'restaurant'}
            </span>
            <p style={{ color: '#80756d', fontSize: '15px', margin: 0 }}>
              {tab === 'following' ? 'עיקבי אחרי משתמשים כדי לראות את המתכונים שלהם' : 'אין מתכונים עדיין'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {featured && (
              <FeaturedCard
                recipe={featured}
                onSave={() => setSaveTarget(featured)}
                onNavigate={() => navigate(`/recipe/${featured.id}`)}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {rest.map(recipe => (
                <SmallCard
                  key={recipe.id}
                  recipe={recipe}
                  onNavigate={() => navigate(`/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/add-recipe')}
        style={{
          position: 'fixed',
          bottom: '110px',
          left: '16px',
          zIndex: 150,
          background: '#9a4600',
          color: '#ffffff',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(154,70,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add</span>
      </button>

      {saveTarget && (
        <SaveToBookModal recipe={saveTarget} onClose={() => setSaveTarget(null)} />
      )}

      <BottomNav />
    </div>
  );
}

function FeaturedCard({ recipe, onNavigate, onSave }) {
  return (
    <div
      onClick={onNavigate}
      style={{
        background: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(74,55,40,0.06)',
        border: '1px solid rgba(210,196,187,0.2)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: '260px', overflow: 'hidden', background: '#f1ede7' }}>
        {recipe.imageURL ? (
          <img src={recipe.imageURL} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '72px', color: '#d2c4bb' }}>restaurant</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
          borderRadius: '20px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '6px',
          border: '1px solid rgba(210,196,187,0.3)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9a4600', fontVariationSettings: "'FILL' 1" }}>star</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#322214', letterSpacing: '0.08em' }}>מתכון היום</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSave(); }}
          style={{
            position: 'absolute', top: '16px', left: '16px',
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9a4600',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>favorite</span>
        </button>
      </div>
      <div style={{ padding: '24px' }}>
        <h3 style={{
          margin: '0 0 16px',
          fontFamily: 'EB Garamond, serif',
          fontSize: '28px',
          fontWeight: '600',
          color: '#322214',
          lineHeight: '1.2',
        }}>
          {recipe.title}
        </h3>
        <div style={{ display: 'flex', gap: '20px', color: 'rgba(78,69,62,0.8)', borderTop: '1px solid rgba(210,196,187,0.2)', paddingTop: '16px' }}>
          {recipe.cookTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
              <span style={{ fontSize: '13px' }}>{recipe.cookTime}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>skillet</span>
              <span style={{ fontSize: '13px' }}>רמת קושי: {recipe.difficulty}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallCard({ recipe, onNavigate }) {
  return (
    <div
      onClick={onNavigate}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(74,55,40,0.05)',
        border: '1px solid rgba(210,196,187,0.2)',
        cursor: 'pointer',
      }}
    >
      <div style={{ height: '130px', overflow: 'hidden', background: '#f1ede7' }}>
        {recipe.imageURL ? (
          <img src={recipe.imageURL} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d2c4bb' }}>restaurant</span>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <h3 style={{
          margin: '0 0 6px',
          fontFamily: 'EB Garamond, serif',
          fontSize: '17px',
          fontWeight: '500',
          color: '#322214',
          lineHeight: '1.3',
        }}>
          {recipe.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(78,69,62,0.7)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restaurant</span>
          <span style={{ fontSize: '12px' }}>{recipe.category || 'מתכון'}</span>
        </div>
      </div>
    </div>
  );
}
