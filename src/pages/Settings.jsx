import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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
    <div style={{ minHeight: '100svh', direction: 'rtl', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(253,249,243,0.95)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(210,196,187,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', height: '64px' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(154,70,0,0.08)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', cursor: 'pointer', color: '#322214',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_forward</span>
          </button>
          <h1 style={{ margin: 0, fontFamily: 'EB Garamond, serif', fontSize: '24px', color: '#322214', fontWeight: '600' }}>הגדרות</h1>
        </div>
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="פרופיל" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(154,70,0,0.2)' }} />
            ) : (
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: '#f1ede7', border: '3px solid rgba(154,70,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d2c4bb' }}>person</span>
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              background: '#9a4600', borderRadius: '50%',
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(154,70,0,0.3)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffffff' }}>photo_camera</span>
            </div>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </label>
          <span style={{ fontSize: '13px', color: '#80756d' }}>לחצי לשינוי תמונת פרופיל</span>
        </div>

        {/* Fields card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid rgba(210,196,187,0.3)', boxShadow: '0 2px 12px rgba(74,55,40,0.05)' }}>
          <label style={labelStyle}>שם תצוגה</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: '16px' }}>ביו</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="ספרי קצת על עצמך..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

          {/* Private toggle */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#322214' }}>חשבון פרטי</div>
              <div style={{ fontSize: '12px', color: '#80756d', marginTop: '2px' }}>רק עוקבים יוכלו לראות את המתכונים שלך</div>
            </div>
            <button onClick={() => setIsPrivate(!isPrivate)} style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: isPrivate ? '#9a4600' : '#d2c4bb',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff',
                position: 'absolute', top: '3px',
                right: isPrivate ? '27px' : '3px',
                transition: 'right 0.3s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? '#7DBF96' : '#9a4600',
          border: 'none', borderRadius: '16px', padding: '15px',
          color: '#ffffff', fontWeight: '700', fontSize: '15px',
          cursor: saving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 14px rgba(154,70,0,0.3)', transition: 'background 0.3s',
          fontFamily: 'inherit',
        }}>
          {saving ? 'שומרת...' : saved ? (
            <><span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span> נשמר!</>
          ) : (
            <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span> שמרי שינויים</>
          )}
        </button>

        <button onClick={handleLogout} style={{
          background: '#ffffff', border: '1px solid rgba(210,196,187,0.5)',
          borderRadius: '16px', padding: '14px', color: '#4e453e',
          fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontFamily: 'inherit',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          התנתקי
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontWeight: '600', fontSize: '13px',
  color: '#4e453e', marginBottom: '8px', letterSpacing: '0.04em',
};
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  border: '1px solid rgba(210,196,187,0.4)', fontSize: '14px',
  outline: 'none', direction: 'rtl', background: '#f7f3ed',
  color: '#1c1c18', boxSizing: 'border-box', display: 'block',
};
