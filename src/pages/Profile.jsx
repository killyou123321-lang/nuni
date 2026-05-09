import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = userId === currentUser?.uid;

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) setProfile({ id: userId, ...snap.data() });

      const q = query(
        collection(db, 'recipes'),
        where('authorId', '==', userId),
        where('visibility', '==', 'public')
      );
      const rSnap = await getDocs(q);
      setRecipes(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [userId]);

  const isFollowing = userProfile?.following?.includes(userId);

  async function toggleFollow() {
    if (!currentUser) return;
    const myRef = doc(db, 'users', currentUser.uid);
    const theirRef = doc(db, 'users', userId);
    if (isFollowing) {
      await updateDoc(myRef, { following: arrayRemove(userId) });
      await updateDoc(theirRef, { followers: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(myRef, { following: arrayUnion(userId) });
      await updateDoc(theirRef, { followers: arrayUnion(currentUser.uid) });
    }
    await refreshUserProfile(currentUser.uid);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.onSurfaceVariant }}>טוענת...</span>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.onSurfaceVariant }}>פרופיל לא נמצא</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.background, direction: 'rtl', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: `1px solid ${colors.outlineVariant}`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(50,34,20,0.06)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: colors.surfaceContainerLow, border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: colors.primary }}>arrow_forward</span>
        </button>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/settings')}
            style={{ background: colors.surfaceContainerLow, border: 'none', borderRadius: '12px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.secondary }}>settings</span>
            <span style={{ color: colors.onSurface, fontSize: '14px', fontWeight: '600' }}>הגדרות</span>
          </button>
        )}
      </div>

      {/* Profile info */}
      <div style={{ padding: '28px 20px 20px', textAlign: 'center', background: '#ffffff', borderBottom: `1px solid ${colors.outlineVariant}` }}>
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.name}
            style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.secondary}`, marginBottom: '14px' }}
          />
        ) : (
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: colors.surfaceContainerLow,
            border: `3px solid ${colors.outlineVariant}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '44px', color: colors.outline }}>person</span>
          </div>
        )}
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: colors.primary, fontFamily: "'EB Garamond', serif" }}>{profile.name}</h2>
        {profile.bio && <p style={{ margin: '0 0 16px', fontSize: '14px', color: colors.onSurfaceVariant, lineHeight: '1.5' }}>{profile.bio}</p>}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '20px' }}>
          <StatItem label="מתכונים" value={recipes.length} />
          <StatItem label="עוקבים" value={profile.followers?.length || 0} />
          <StatItem label="עוקבת אחרי" value={profile.following?.length || 0} />
        </div>

        {!isOwnProfile && (
          <button
            onClick={toggleFollow}
            style={{
              background: isFollowing ? '#ffffff' : colors.secondary,
              border: `1.5px solid ${isFollowing ? colors.outlineVariant : 'transparent'}`,
              borderRadius: '14px',
              padding: '10px 32px',
              color: isFollowing ? colors.onSurface : '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isFollowing ? 'person_remove' : 'person_add'}</span>
            {isFollowing ? 'מפסיקה לעקוב' : 'עוקבת'}
          </button>
        )}
      </div>

      {/* Recipes grid */}
      {recipes.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: colors.outline, display: 'block', marginBottom: '12px' }}>restaurant_menu</span>
          <p style={{ color: colors.onSurfaceVariant, fontSize: '15px', margin: 0 }}>אין מתכונים ציבוריים עדיין</p>
        </div>
      ) : (
        <div style={{ padding: '2px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {recipes.map(r => (
            <div
              key={r.id}
              onClick={() => navigate(`/recipe/${r.id}`)}
              style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: colors.surfaceContainerLow, position: 'relative' }}
            >
              {r.imageURL ? (
                <img src={r.imageURL} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: colors.outline }}>restaurant</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: '700', fontSize: '20px', color: colors.primary, fontFamily: "'EB Garamond', serif" }}>{value}</div>
      <div style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>{label}</div>
    </div>
  );
}
