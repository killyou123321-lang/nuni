import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LilyChat from './LilyChat';

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXhQ5WXRnLOQwXq-a2xkchcU57rvw6KGfMLVTc8KU_cSZEEsZGn0mqO1M766GCU7FaDQIn5Ts8IM8Kjt8xHEob8s94YL7ZvWdsbAfYBSTHpjwL1Iyldvyy8-B0w3Ss-RbGftEqJYKrOxDTz7WyQdcVzp07pNr6tibOzYC3UakJLAsFnapZdjcWG5v-LM3VyaIrbRv_mC4kv9dFxdBUfOll7ffRw-l0s0VwBmBYfNKmIQYUNgC8T0aZpge3EOK93UAXgBgVa-t4gA';

export default function Header() {
  const [lilyOpen, setLilyOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const avatarUrl = userProfile?.photoURL || currentUser?.photoURL;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(253,249,243,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(210,196,187,0.3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '80px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#322214',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '50%',
                transition: 'transform 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
            </button>
            <img
              src={LOGO_URL}
              alt="נוני"
              style={{ height: '48px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>

          <button
            onClick={() => setLilyOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            title="לילי - עוזרת המטבח"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="פרופיל"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid rgba(50,34,20,0.2)',
                  padding: '2px',
                  boxShadow: '0 1px 4px rgba(74,55,40,0.15)',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#f1ede7',
                border: '2px solid rgba(50,34,20,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#80756d' }}>person</span>
              </div>
            )}
          </button>
        </div>
      </header>

      {lilyOpen && <LilyChat onClose={() => setLilyOpen(false)} />}
    </>
  );
}
