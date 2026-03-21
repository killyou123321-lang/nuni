import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function Settings() {
  const { currentUser, userProfile, logout, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setIsPrivate(userProfile.isPrivate || false);
      setPhotoPreview(userProfile.photoURL || '');
    }
  }, [userProfile]);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let photoURL = userProfile?.photoURL || '';
      if (photoFile) {
        const storageRef = ref(storage, `users/${currentUser.uid}/profile`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', currentUser.uid), { name, bio, isPrivate, photoURL });
      await updateProfile(auth.currentUser, { displayName: name, photoURL });
      await refreshUserProfile(currentUser.uid);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, direction: 'rtl', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: colors.white, fontSize: '18px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: colors.white }}>⚙️ הגדרות</h1>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="פרופיל" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.peach}` }} />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, background: colors.peachDeep, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📷</div>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </label>
          <span style={{ fontSize: '13px', color: colors.textLight }}>לחצי לשינוי תמונת פרופיל</span>
        </div>

        {/* Fields */}
        <Card>
          <FieldLabel>שם תצוגה</FieldLabel>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />

          <FieldLabel style={{ marginTop: '14px' }}>ביו</FieldLabel>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="ספרי קצת על עצמך..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: colors.text }}>חשבון פרטי</div>
              <div style={{ fontSize: '12px', color: colors.textLight }}>רק עוקבים יוכלו לראות את המתכונים שלך</div>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              style={{
                width: '52px', height: '28px',
                borderRadius: '14px',
                background: isPrivate ? colors.greenDeep : colors.border,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s',
              }}
            >
              <div style={{
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: colors.white,
                position: 'absolute',
                top: '3px',
                right: isPrivate ? '27px' : '3px',
                transition: 'right 0.3s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </Card>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saved ? colors.greenDeep : `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
            border: 'none',
            borderRadius: '16px',
            padding: '15px',
            color: colors.white,
            fontWeight: '700',
            fontSize: '16px',
            cursor: saving ? 'default' : 'pointer',
            transition: 'background 0.3s',
          }}
        >
          {saving ? 'שומרת...' : saved ? '✓ נשמר!' : 'שמרי שינויים'}
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: colors.white,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '14px',
            color: colors.text,
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          🚪 התנתקי
        </button>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: colors.white, borderRadius: '16px', padding: '20px', border: `1px solid ${colors.border}` }}>
      {children}
    </div>
  );
}

function FieldLabel({ children, style }) {
  return <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: colors.text, marginBottom: '8px', ...style }}>{children}</label>;
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: '12px',
  fontSize: '14px',
  outline: 'none',
  direction: 'rtl',
  background: colors.peachBg,
  color: colors.text,
  boxSizing: 'border-box',
  display: 'block',
};
