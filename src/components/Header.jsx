import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LilyChat from './LilyChat';

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXhQ5WXRnLOQwXq-a2xkchcU57rvw6KGfMLVTc8KU_cSZEEsZGn0mqO1M766GCU7FaDQIn5Ts8IM8Kjt8xHEob8s94YL7ZvWdsbAfYBSTHpjwL1Iyldvyy8-B0w3Ss-RbGftEqJYKrOxDTz7WyQdcVzp07pNr6tibOzYC3UakJLAsFnapZdjcWG5v-LM3VyaIrbRv_mC4kv9dFxdBUfOll7ffRw-l0s0VwBmBYfNKmIQYUNgC8T0aZpge3EOK93UAXgBgVa-t4gA';

export default function Header() {
  const [lilyOpen, setLilyOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const avatarUrl = userProfile?.photoURL || currentUser?.photoURL;

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(253,249,243,0.95)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(210,196,187,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: '72px',
        }}>
          {/* Right: menu + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={iconBtn} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#322214' }}>menu</span>
            </button>
            <img src={LOGO_URL} alt="נוני" style={{ height: '44px', width: 'auto', objectFit: 'contain', maxWidth: '110px' }} onError={e => { e.target.style.display = 'none'; }} />
          </div>

          {/* Left: LilyChat + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* LilyChat button - always visible */}
            <button
              onClick={() => setLilyOpen(true)}
              title="לילי - עוזרת המטבח"
              style={{
                background: 'rgba(154,70,0,0.08)',
                border: '1.5px solid rgba(154,70,0,0.15)',
                borderRadius: '50%',
                width: '42px', height: '42px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
                transition: 'all 0.2s',
              }}
            >
              👩🏽‍🍳
            </button>

            {/* Avatar → settings */}
            <button
              onClick={() => navigate('/settings')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="פרופיל" style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '2px solid rgba(50,34,20,0.15)',
                  padding: '2px', objectFit: 'cover',
                  boxShadow: '0 1px 4px rgba(74,55,40,0.15)',
                }} />
              ) : (
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#f1ede7', border: '2px solid rgba(50,34,20,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#80756d' }}>person</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>
      {lilyOpen && <LilyChat onClose={() => setLilyOpen(false)} />}
    </>
  );
}

const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '6px', borderRadius: '50%', transition: 'transform 0.15s',
};
