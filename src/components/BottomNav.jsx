import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../colors';

const tabs = [
  { icon: '❤️', label: 'מועדפים', path: '/favorites' },
  { icon: '🍽️', label: 'מתכונים', path: '/feed' },
  { icon: '📚', label: 'הספר שלי', path: '/my-book' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: colors.white,
      borderTop: `2px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      zIndex: 200,
      boxShadow: '0 -4px 16px rgba(92,64,51,0.08)',
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '6px 20px',
              borderRadius: '12px',
              transition: 'all 0.2s',
              background: active ? colors.peachLight : 'transparent',
            }}
          >
            <span style={{ fontSize: '22px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: active ? '700' : '400',
              color: active ? colors.peachDeep : colors.textLight,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
