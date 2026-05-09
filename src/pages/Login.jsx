import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXhQ5WXRnLOQwXq-a2xkchcU57rvw6KGfMLVTc8KU_cSZEEsZGn0mqO1M766GCU7FaDQIn5Ts8IM8Kjt8xHEob8s94YL7ZvWdsbAfYBSTHpjwL1Iyldvyy8-B0w3Ss-RbGftEqJYKrOxDTz7WyQdcVzp07pNr6tibOzYC3UakJLAsFnapZdjcWG5v-LM3VyaIrbRv_mC4kv9dFxdBUfOll7ffRw-l0s0VwBmBYfNKmIQYUNgC8T0aZpge3EOK93UAXgBgVa-t4gA';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/my-book');
    } catch (err) {
      setError(hebrewError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/my-book');
    } catch {
      setError('כניסה עם Google נכשלה. נסי שוב.');
    } finally {
      setLoading(false);
    }
  }

  function hebrewError(code) {
    const map = {
      'auth/user-not-found': 'לא נמצא משתמש עם האימייל הזה',
      'auth/wrong-password': 'סיסמה שגויה',
      'auth/email-already-in-use': 'האימייל הזה כבר רשום',
      'auth/weak-password': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      'auth/invalid-email': 'כתובת אימייל לא תקינה',
      'auth/invalid-credential': 'פרטי ההתחברות שגויים',
    };
    return map[code] || 'אירעה שגיאה. נסי שוב.';
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 16px',
      direction: 'rtl',
      position: 'relative',
    }}>

      {/* Logo area */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: '#f1ede7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 20px rgba(74,55,40,0.12)',
          border: '2px solid rgba(154,70,0,0.1)',
          overflow: 'hidden',
        }}>
          <img
            src={LOGO_URL}
            alt="נוני"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size:64px">📚</span>'; }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
          <span className="material-symbols-outlined" style={{ color: 'rgba(186,207,128,0.8)', fontSize: '20px' }}>park</span>
        </div>
        <p style={{
          margin: 0,
          color: '#4e453e',
          fontSize: '15px',
          fontStyle: 'italic',
          opacity: 0.9,
        }}>
          שומרים על הטעמים של הבית
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(210,196,187,0.3)',
        boxShadow: '0 4px 6px -1px rgba(112,90,73,0.1), 0 10px 15px -3px rgba(112,90,73,0.1)',
      }}>

        {/* Toggle */}
        <div style={{ display: 'flex', marginBottom: '24px', gap: '8px' }}>
          {[{ key: 'login', label: 'כניסה' }, { key: 'signup', label: 'הרשמה' }].map(m => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setError(''); }}
              style={{
                flex: 1,
                background: mode === m.key ? '#9a4600' : '#f7f3ed',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                letterSpacing: '0.05em',
                color: mode === m.key ? '#ffffff' : '#4e453e',
                transition: 'all 0.2s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>שם מלא</label>
              <input
                placeholder="השם שלך"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle} htmlFor="email">כתובת אימייל</label>
            <input
              id="email"
              type="email"
              placeholder="name@family.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              dir="ltr"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingRight: '4px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="password">סיסמה</label>
              {mode === 'login' && (
                <a href="#" style={{ fontSize: '12px', fontWeight: '600', color: '#9a4600', letterSpacing: '0.05em' }}>
                  שכחת סיסמה?
                </a>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                dir="ltr"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(78,69,62,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffdad6',
              border: '1px solid rgba(186,26,26,0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#93000a',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '56px',
              background: '#9a4600',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '14px',
              letterSpacing: '0.05em',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(154,70,0,0.3)',
              transition: 'all 0.3s',
              marginTop: '4px',
            }}
          >
            <span>{loading ? 'טוענת...' : mode === 'login' ? 'כניסה לספר המתכונים' : 'יצירת חשבון'}</span>
            {!loading && (
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                {mode === 'login' ? 'login' : 'person_add'}
              </span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '28px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid rgba(210,196,187,0.3)' }} />
          </div>
          <span style={{
            position: 'relative',
            background: '#ffffff',
            padding: '0 16px',
            fontSize: '12px',
            color: 'rgba(78,69,62,0.6)',
            fontWeight: '600',
            letterSpacing: '0.05em',
          }}>
            או התחברות באמצעות
          </span>
        </div>

        {/* Social buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={handleGoogle}
            disabled={loading}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '48px',
              borderRadius: '12px',
              background: '#f7f3ed',
              border: '1px solid rgba(210,196,187,0.4)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1c1c18',
              transition: 'background 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            גוגל
          </button>
          <button
            disabled={loading}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '48px',
              borderRadius: '12px',
              background: '#1877F2',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#ffffff',
              boxShadow: '0 1px 4px rgba(24,119,242,0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>facebook</span>
            פייסבוק
          </button>
        </div>
      </div>

      <p style={{ marginTop: '32px', fontSize: '15px', color: '#4e453e', textAlign: 'center' }}>
        {mode === 'login' ? 'עדיין אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#9a4600',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            textDecorationThickness: '2px',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          {mode === 'login' ? 'הרשמי כאן' : 'כניסה'}
        </button>
      </p>

      {/* Decorative corners */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, pointerEvents: 'none', opacity: 0.25 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '80px', color: '#bacf80' }}>eco</span>
      </div>
      <div style={{ position: 'fixed', bottom: 0, right: 0, pointerEvents: 'none', opacity: 0.25 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '80px', color: '#bba08c' }}>spa</span>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#4e453e',
  marginBottom: '4px',
  paddingRight: '4px',
  letterSpacing: '0.05em',
};

const inputStyle = {
  width: '100%',
  height: '48px',
  padding: '0 16px',
  borderRadius: '12px',
  background: '#f7f3ed',
  border: '1px solid rgba(210,196,187,0.4)',
  outline: 'none',
  fontSize: '15px',
  color: '#1c1c18',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
