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
    <div style={{ minHeight: '100vh', background: colors.peachBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.textLight }}>טוענת...</span>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.textLight }}>פרופיל לא נמצא</span>
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
        justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: colors.white, fontSize: '18px' }}>←</button>
        {isOwnProfile && (
          <button onClick={() => navigate('/settings')} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: colors.white, fontSize: '14px', fontWeight: '600' }}>
            ⚙️ הגדרות
          </button>
        )}
      </div>

      {/* Profile info */}
      <div style={{ padding: '24px 20px', textAlign: 'center', background: colors.white, borderBottom: `1px solid ${colors.border}` }}>
        {profile.photoURL ? (
          <img src={profile.photoURL} alt={profile.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.peach}`, marginBottom: '12px' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 12px' }}>👤</div>
        )}
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: colors.text }}>{profile.name}</h2>
        {profile.bio && <p style={{ margin: '0 0 12px', fontSize: '14px', color: colors.textLight, lineHeight: '1.4' }}>{profile.bio}</p>}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
          <StatItem label="מתכונים" value={recipes.length} />
          <StatItem label="עוקבים" value={profile.followers?.length || 0} />
          <StatItem label="עוקבת אחרי" value={profile.following?.length || 0} />
        </div>

        {!isOwnProfile && (
          <button
            onClick={toggleFollow}
            style={{
              background: isFollowing ? colors.white : `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
              border: `1.5px solid ${isFollowing ? colors.border : 'transparent'}`,
              borderRadius: '14px',
              padding: '10px 28px',
              color: isFollowing ? colors.text : colors.white,
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {isFollowing ? 'מפסיקה לעקוב' : '+ עוקבת'}
          </button>
        )}
      </div>

      {/* Recipes grid */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
        {recipes.map(r => (
          <div
            key={r.id}
            onClick={() => navigate(`/recipe/${r.id}`)}
            style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: colors.peachLight, borderRadius: '4px' }}
          >
            {r.imageURL ? (
              <img src={r.imageURL} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍽️</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: '700', fontSize: '18px', color: colors.text }}>{value}</div>
      <div style={{ fontSize: '12px', color: colors.textLight }}>{label}</div>
    </div>
  );
}
