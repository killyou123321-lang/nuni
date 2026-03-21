import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function LilyChat({ onClose }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'שלום! אני לילי 👩🏽‍🍳 עוזרת המטבח שלך! אני יכולה לעזור לך עם המרות מידות, תחליפי מצרכים, טיפים לבישול ועוד. במה אוכל לעזור? 😊',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      loadUserRecipes();
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadUserRecipes() {
    try {
      const q = query(collection(db, 'recipes'), where('authorId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecipes(list);
    } catch (err) {
      console.error('Failed to load recipes for Lily', err);
    }
  }

  function buildSystemPrompt() {
    let prompt = `אתה לילי, עוזרת מטבח חמה וידידותית. את עונה תמיד בעברית, עם אמוג'י, בסגנון חם וידידותי.
את מתמחה ב: המרות מידות, תחליפי מצרכים, טיפים לבישול, תיאום טמפרטורות, זמני בישול.`;

    if (recipes.length > 0) {
      prompt += `\n\nהמתכונים של המשתמש הם:\n`;
      recipes.forEach((r) => {
        prompt += `\n- ${r.title}`;
        if (r.category) prompt += ` (${r.category})`;
        if (r.ingredients?.length > 0) prompt += `: ${r.ingredients.slice(0, 5).join(', ')}`;
      });
      prompt += `\n\nתוכלי להתייחס למתכונים האלה כשהמשתמשת שואלת שאלות.`;
    }

    return prompt;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'מצטערת, לא הצלחתי להבין. נסי שוב! 😅';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'אוי, משהו השתבש! בדקי את חיבור האינטרנט ונסי שוב 🙈',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      background: colors.greenLight,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.green}, ${colors.greenDeep})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>👩🏽‍🍳</span>
          <div>
            <div style={{ fontWeight: '700', color: colors.white, fontSize: '17px' }}>לילי</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>עוזרת המטבח שלי</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            color: colors.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? colors.white : colors.greenDeep,
              color: msg.role === 'user' ? colors.text : colors.white,
              fontSize: '14px',
              lineHeight: '1.5',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: colors.greenDeep,
              color: colors.white,
              padding: '10px 16px',
              borderRadius: '4px 16px 16px 16px',
              fontSize: '18px',
            }}>
              ✦✦✦
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px env(safe-area-inset-bottom, 12px)',
        background: colors.white,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        gap: '10px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="שאלי אותי משהו..."
          style={{
            flex: 1,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            outline: 'none',
            direction: 'rtl',
            background: colors.peachBg,
            color: colors.text,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? colors.border : colors.greenDeep,
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
