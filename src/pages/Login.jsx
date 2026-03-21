import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
    } catch (err) {
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
      minHeight: '100vh',
      background: colors.peachBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      direction: 'rtl',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>📚</div>
        <h1 style={{ margin: 0, color: colors.text, fontSize: '26px', fontWeight: '800' }}>
          ספר המתכונים שלי
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textLight, fontSize: '14px' }}>
          כל המתכונים האהובים במקום אחד 🍽️
        </p>
      </div>

      <div style={{
        background: colors.white,
        borderRadius: '24px',
        padding: '28px 24px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 24px rgba(92,64,51,0.1)',
      }}>
        <div style={{ display: 'flex', marginBottom: '24px', background: colors.peachBg, borderRadius: '12px', padding: '4px' }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                background: mode === m ? colors.white : 'transparent',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                color: mode === m ? colors.peachDeep : colors.textLight,
                boxShadow: mode === m ? '0 1px 6px rgba(92,64,51,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'כניסה' : 'הרשמה'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <input
              placeholder="שם מלא"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{
              background: '#FFF0F0',
              border: '1px solid #FFB3B3',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#C0392B',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              color: colors.white,
              fontWeight: '700',
              fontSize: '16px',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '16px 0', color: colors.textLight, fontSize: '13px' }}>
          — או —
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            background: colors.white,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '14px',
            color: colors.text,
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          כניסה עם Google
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  border: `1.5px solid #F0D9CF`,
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '15px',
  outline: 'none',
  direction: 'rtl',
  background: '#FFF4EF',
  color: '#5C4033',
  width: '100%',
  boxSizing: 'border-box',
};
