import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { icon: 'restaurant_menu', label: 'מתכונים', path: '/feed' },
  { icon: 'menu_book', label: 'הספר שלי', path: '/my-book' },
  { icon: 'favorite', label: 'מועדפים', path: '/favorites' },
  { icon: 'chat', label: 'צ׳אט', path: '/chat' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(210,196,187,0.2)',
      borderRadius: '28px 28px 0 0',
      boxShadow: '0 -8px 30px rgba(74,55,40,0.08)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingTop: '10px',
      paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path ||
          (tab.path === '/feed' && location.pathname === '/');
        return (
          <a
            key={tab.path}
            onClick={e => { e.preventDefault(); navigate(tab.path); }}
            href={tab.path}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px', padding: '4px 16px',
              cursor: 'pointer', textDecoration: 'none',
              color: active ? '#9a4600' : 'rgba(78,69,62,0.55)',
              transition: 'color 0.2s',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '26px',
                fontVariationSettings: active
                  ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: active ? '700' : '400', letterSpacing: '0.03em' }}>
              {tab.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
