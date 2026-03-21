import { useState, useRef, useEffect } from 'react';
import { colors } from '../colors';

// ===== כל המידע מטבלת המידות והמשקלות =====
const MEASUREMENT_DATA = {
  universal: {
    keywords: ['כוס', 'כף', 'כפית', 'מ"ל', 'מיליליטר', 'מידות', 'כמות', 'מדידה', 'כמה מ"ל'],
    answer: `📏 **סט מידות אוניברסלי:**

🥛 **כוסות:**
• 1 כוס = 240 מ"ל
• ¾ כוס = 180 מ"ל
• ⅔ כוס = 160 מ"ל
• ½ כוס = 120 מ"ל
• ⅓ כוס = 80 מ"ל
• ¼ כוס = 60 מ"ל

🥄 **כפות וכפיות:**
• 1 כף = 15 מ"ל
• 1 כפית = 3 מ"ל`,
  },

  pan: {
    keywords: ['תבנית', 'קוטר', 'מקוטר', 'גודל תבנית', 'המרת תבנית', 'תבניות', 'לשנות תבנית', 'להמיר תבנית'],
    answer: `🍰 **המרת גודלי תבניות:**

➕ **להוסיף לכמות:**
• מקוטר 22 → 24: הוסיפי **20%**
• מקוטר 22 → 26: הוסיפי **40%**
• מקוטר 22 → 28: הוסיפי **60%**

➖ **להפחית מהכמות:**
• מקוטר 26 → 24: הפחיתי **15%**
• מקוטר 26 → 22: הפחיתי **30%**
• מקוטר 28 → 22: הפחיתי **40%**

💡 *לדוגמה: מתכון לתבנית 22 עם 3 ביצים → לתבנית 24 צריך 3.6 ביצים (≈ 4)*`,
  },

  gelatin: {
    keywords: ['ג\'לטין', 'ג`לטין', 'עלה ג', 'עלי ג', 'ג׳לטין'],
    answer: `🌿 **ג'לטין:**

• 1 שקית = **14 גרם**
• 1 כף = **10 גרם**
• 1 עלה ג'לטין = **4 גרם**

🔄 **המרה:** 1 שקית ג'לטין אבקה = 3.5 עלי ג'לטין`,
  },

  bakingPowder: {
    keywords: ['אבקת אפייה', 'סודה לשתייה', 'סודה', 'אבקת אפיה', '베이킹'],
    answer: `🧁 **אבקת אפייה וסודה לשתייה:**

• 1 שקית = **10 גרם** = כף גדושה
• 1 כפית = **3 גרם**`,
  },

  yeast: {
    keywords: ['שמרים', 'שמר', 'קוביית שמרים', 'שמרים יבשים', 'שמרים טריים'],
    answer: `🍞 **שמרים:**

כל אלה שוות ערך:
• 1 שקית שמרים יבשים (50 גרם)
• = 1 קוביית שמרים טריים (50 גרם)
• = 2 כפות שמרים יבשים (17 גרם)`,
  },

  eggs: {
    keywords: ['ביצה', 'ביצים', 'מס\' ביצה', 'גודל ביצה', 'ביצה גדולה', 'ביצה קטנה'],
    answer: `🥚 **ביצים לפי מספר:**

• מס' 1 = **65 גרם** ומעלה (גדולה)
• מס' 2 = **60 גרם** (בינונית)
• מס' 3 = **50 גרם** (קטנה)`,
  },

  flour: {
    keywords: ['קמח', 'קקאו', 'קורנפלור', 'קמח תירס', 'אבקת קקאו'],
    answer: `🌾 **חומרים "יבשים" (קמח, קקאו, קורנפלור):**

• 1 כוס = **140 גרם**
• 1 כף = **10 גרם**`,
  },

  whiteSugar: {
    keywords: ['סוכר לבן', 'סוכר רגיל', 'סוכר'],
    answer: `🍬 **סוכר לבן:**

• 1 כוס = **200 גרם**
• 1 כף = **12 גרם**
• 1 כפית = **4 גרם**`,
  },

  brownSugar: {
    keywords: ['סוכר חום', 'סוכר דמררה', 'סוכר כהה'],
    answer: `🟫 **סוכר חום:**

• 1 כוס = **200 גרם**
• 1 כף = **12 גרם**
• 1 כפית = **4 גרם**`,
  },

  powderedSugar: {
    keywords: ['אבקת סוכר', 'סוכר אבקה', 'סוכר דק'],
    answer: `🌨️ **אבקת סוכר:**

• 1 כוס = **120 גרם**
• 1 כף = **8 גרם**`,
  },

  honey: {
    keywords: ['דבש', 'מולסה', 'סירופ תירס', 'סירופ מייפל', 'סירופ', 'מייפל'],
    answer: `🍯 **דבש, מולסה וסירופ תירס:**

• 1 כוס = **320 גרם**
• 1 כף = **20 גרם**
• 1 כפית = **7 גרם**`,
  },

  butter: {
    keywords: ['חמאה', 'חמאה מומסת', 'חמאה רכה'],
    answer: `🧈 **חמאה:**

• 1 כוס = **240 גרם**
• 1 כף = **15 גרם**`,
  },

  nuts: {
    keywords: ['שקדים', 'אגוזים', 'קוקוס', 'שוקולד צ\'יפס', 'שיבולת שועל', 'פירות יבשים', 'צימוקים', 'חמוציות'],
    answer: `🥜 **אגוזים ותוספות (לפי כוס):**

• 1 כוס שקדים = **100 גרם**
• 1 כוס אגוזים = **100 גרם**
• 1 כוס שיבולת שועל = **100 גרם**
• 1 כוס קוקוס = **100 גרם**
• 1 כוס שוקולד צ'יפס = **200 גרם**
• 1 כוס פירות יבשים = **100 גרם**`,
  },
};

const DEFAULT_MESSAGE = `היי! אני לילי 👩🏽‍🍳 עוזרת המטבח שלך 💕

אני מתמחה ב**טבלת מידות ומשקלות** ויכולה לעזור לך עם:

📏 המרות מידות (כוס, כף, כפית ← מ"ל)
🍰 המרת גודלי תבניות
🌾 משקל של קמח, קקאו, סוכר, חמאה ועוד
🍞 שמרים, ג'לטין, אבקת אפייה
🥚 גדלי ביצים
🥜 אגוזים ותוספות

פשוט שאלי אותי על מצרך או מידה ואני אענה מיד! 😊`;

function findAnswer(text) {
  const lower = text.toLowerCase();

  // Check each category
  for (const [, category] of Object.entries(MEASUREMENT_DATA)) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category.answer;
      }
    }
  }

  return null;
}

export default function LilyChat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `שלום! אני לילי 👩🏽‍🍳 עוזרת המטבח שלך!\n\nאני כאן לעזור עם **המרות מידות ומשקלות** — שאלי אותי על כל מצרך או מידה 😊`,
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    setInput('');

    const answer = findAnswer(text);
    const reply = {
      role: 'assistant',
      content: answer || DEFAULT_MESSAGE,
    };

    setMessages(prev => [...prev, userMsg, reply]);
  }

  function formatMessage(text) {
    // Bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', background: colors.greenLight,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.green}, ${colors.greenDeep})`,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>👩🏽‍🍳</span>
          <div>
            <div style={{ fontWeight: '700', color: colors.white, fontSize: '17px' }}>לילי</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>טבלת מידות ומשקלות</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px',
          color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Quick suggestion chips */}
      <div style={{ padding: '10px 12px 0', display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
        {['כוס בגרמים', 'תבניות', 'שמרים', 'ביצים', 'חמאה', 'סוכר'].map(chip => (
          <button
            key={chip}
            onClick={() => { setInput(chip); }}
            style={{
              background: 'rgba(255,255,255,0.7)', border: `1px solid ${colors.green}`,
              borderRadius: '16px', padding: '5px 12px', fontSize: '12px', fontWeight: '600',
              color: colors.greenDeep, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >{chip}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? colors.white : colors.greenDeep,
              color: msg.role === 'user' ? colors.text : colors.white,
              fontSize: '14px', lineHeight: '1.6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px env(safe-area-inset-bottom, 12px)',
        background: colors.white, borderTop: `1px solid ${colors.border}`,
        display: 'flex', gap: '10px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="שאלי על מידה או מצרך..."
          style={{
            flex: 1, border: `1.5px solid ${colors.border}`, borderRadius: '24px',
            padding: '10px 16px', fontSize: '14px', outline: 'none',
            direction: 'rtl', background: colors.peachBg, color: colors.text,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            background: !input.trim() ? colors.border : colors.greenDeep,
            border: 'none', borderRadius: '50%', width: '44px', height: '44px',
            cursor: !input.trim() ? 'default' : 'pointer', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >➤</button>
      </div>
    </div>
  );
}
