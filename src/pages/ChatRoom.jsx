import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, getDoc, updateDoc, getDocs, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

const PLAN_CATEGORY_SUGGESTIONS = [
  'ארוחת בוקר', 'מרקים', 'סלטים', 'מנות עיקריות', 'קינוחים',
  'אפייה', 'שתייה', 'חטיפים', 'לחמים', 'רטבים',
];

export default function ChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Meal plan state
  const [pinnedPlan, setPinnedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planCategories, setPlanCategories] = useState([]);
  const [catInput, setCatInput] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [assignCatId, setAssignCatId] = useState(null);
  const [assignItem, setAssignItem] = useState('');

  // Recipe picker
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [myRecipes, setMyRecipes] = useState([]);

  const messagesEndRef = useRef(null);

  // Load chat doc
  useEffect(() => {
    getDoc(doc(db, 'chats', chatId)).then(snap => {
      if (snap.exists()) setChat({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [chatId]);

  // Listen for messages
  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [chatId]);

  // Listen for chat updates (pinnedPlanId changes)
  useEffect(() => {
    return onSnapshot(doc(db, 'chats', chatId), snap => {
      if (snap.exists()) setChat({ id: snap.id, ...snap.data() });
    });
  }, [chatId]);

  // Load pinned plan
  useEffect(() => {
    if (!chat?.pinnedPlanId) { setPinnedPlan(null); return; }
    const planRef = doc(db, 'chats', chatId, 'plans', chat.pinnedPlanId);
    return onSnapshot(planRef, snap => {
      if (snap.exists()) setPinnedPlan({ id: snap.id, ...snap.data() });
      else setPinnedPlan(null);
    });
  }, [chat?.pinnedPlanId, chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load my recipes when picker opens
  useEffect(() => {
    if (!showRecipePicker || !currentUser) return;
    getDocs(query(collection(db, 'recipes'), where('authorId', '==', currentUser.uid))).then(snap => {
      setMyRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showRecipePicker, currentUser]);

  async function sendText() {
    if (!text.trim() || sending) return;
    setSending(true);
    const msg = text.trim();
    setText('');
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      type: 'text',
      text: msg,
      senderId: currentUser.uid,
      senderName: userProfile?.name || currentUser.email,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: msg,
      lastMessageAt: serverTimestamp(),
    });
    setSending(false);
  }

  async function sendRecipe(recipe) {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      type: 'recipe',
      senderId: currentUser.uid,
      senderName: userProfile?.name || currentUser.email,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeImage: recipe.imageURL || '',
      text: `📋 ${recipe.title}`,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: `📋 ${recipe.title}`,
      lastMessageAt: serverTimestamp(),
    });
    setShowRecipePicker(false);
  }

  async function createPlan() {
    if (!planTitle.trim() || planCategories.length === 0) return;
    setCreatingPlan(true);
    const planData = {
      title: planTitle.trim(),
      categories: planCategories,
      assignments: [],
      pinned: true,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
    };
    const planRef = await addDoc(collection(db, 'chats', chatId, 'plans'), planData);
    await updateDoc(doc(db, 'chats', chatId), { pinnedPlanId: planRef.id });
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      type: 'text',
      text: `📋 יצרה טבלת שיבוץ: "${planTitle.trim()}"`,
      senderId: currentUser.uid,
      senderName: userProfile?.name || currentUser.email,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: `📋 טבלת שיבוץ: ${planTitle.trim()}`,
      lastMessageAt: serverTimestamp(),
    });
    setPlanTitle('');
    setPlanCategories([]);
    setCreatingPlan(false);
    setShowPlanModal(false);
  }

  async function assignToCategory(catId) {
    if (!assignItem.trim() || !pinnedPlan) return;
    const newAssignment = {
      id: Date.now().toString(),
      categoryId: catId,
      userId: currentUser.uid,
      userName: userProfile?.name || currentUser.email,
      item: assignItem.trim(),
    };
    const updated = [...(pinnedPlan.assignments || []), newAssignment];
    await updateDoc(doc(db, 'chats', chatId, 'plans', pinnedPlan.id), { assignments: updated });
    setAssignItem('');
    setAssignCatId(null);
  }

  async function removeAssignment(assignId) {
    const updated = pinnedPlan.assignments.filter(a => a.id !== assignId);
    await updateDoc(doc(db, 'chats', chatId, 'plans', pinnedPlan.id), { assignments: updated });
  }

  async function unpinPlan() {
    await updateDoc(doc(db, 'chats', chatId), { pinnedPlanId: null });
  }

  function getChatName() {
    if (!chat) return '';
    if (chat.type === 'group') return chat.name;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    return chat.memberNames?.[otherId] || 'שיחה';
  }

  function getChatSubtitle() {
    if (!chat || chat.type !== 'group') return null;
    return Object.values(chat.memberNames || {}).join(', ');
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: colors.peachBg }}>
      <span style={{ color: colors.textLight }}>טוענת...</span>
    </div>
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: colors.peachBg, direction: 'rtl' }}>
      {/* Header */}
      <div style={{
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(92,64,51,0.08)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: colors.peachDeep, padding: '4px', lineHeight: 1 }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', color: colors.text, fontSize: '16px' }}>{getChatName()}</div>
          {getChatSubtitle() && (
            <div style={{ fontSize: '11px', color: colors.textLight, marginTop: '1px' }}>{getChatSubtitle()}</div>
          )}
        </div>
        <button
          onClick={() => setShowPlanModal(true)}
          title="צרי טבלת שיבוץ"
          style={headerIconBtn}
        >📋</button>
        <button
          onClick={() => setShowRecipePicker(true)}
          title="שלחי מתכון"
          style={headerIconBtn}
        >🍽️</button>
      </div>

      {/* Pinned meal plan */}
      {pinnedPlan && (
        <PinnedPlan
          plan={pinnedPlan}
          currentUser={currentUser}
          onAssign={setAssignCatId}
          onRemove={removeAssignment}
          onUnpin={unpinPlan}
        />
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.textLight, marginTop: '40px', fontSize: '14px' }}>
            שלחי הודעה ראשונה 👋
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === currentUser?.uid}
            onRecipeClick={id => navigate(`/recipe/${id}`)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: colors.white,
        borderTop: `1px solid ${colors.border}`,
        padding: '10px 12px env(safe-area-inset-bottom, 10px)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendText()}
          placeholder="הודעה..."
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '24px',
            border: `1.5px solid ${colors.border}`,
            fontSize: '14px',
            color: colors.text,
            background: colors.peachBg,
            outline: 'none',
            fontFamily: 'inherit',
            direction: 'rtl',
          }}
        />
        <button
          onClick={sendText}
          disabled={!text.trim() || sending}
          style={{
            width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
            background: text.trim() ? colors.peachDeep : colors.border,
            border: 'none',
            cursor: text.trim() ? 'pointer' : 'default',
            fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.white,
            transition: 'background 0.2s',
          }}
        >
          ➤
        </button>
      </div>

      {/* Assign item modal */}
      {assignCatId && (
        <Modal onClose={() => { setAssignCatId(null); setAssignItem(''); }}>
          <h3 style={{ margin: '0 0 12px', color: colors.text }}>
            מה תביאי ל{pinnedPlan?.categories?.find(c => c.id === assignCatId)?.name}?
          </h3>
          <input
            value={assignItem}
            onChange={e => setAssignItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && assignToCategory(assignCatId)}
            placeholder="לדוגמה: עוגת דבש"
            style={inputStyle}
            autoFocus
          />
          <button
            onClick={() => assignToCategory(assignCatId)}
            disabled={!assignItem.trim()}
            style={{ ...primaryBtn, opacity: !assignItem.trim() ? 0.5 : 1 }}
          >
            שיבצי אותי
          </button>
        </Modal>
      )}

      {/* Plan creation modal */}
      {showPlanModal && (
        <Modal onClose={() => { setShowPlanModal(false); setPlanTitle(''); setPlanCategories([]); setCatInput(''); }}>
          <h3 style={{ margin: '0 0 16px', color: colors.text }}>📋 טבלת שיבוץ חדשה</h3>
          <input
            value={planTitle}
            onChange={e => setPlanTitle(e.target.value)}
            placeholder="שם המפגש (לדוגמה: ארוחת שישי בצהריים)"
            style={{ ...inputStyle, marginBottom: '14px' }}
            autoFocus
          />
          <label style={{ fontSize: '13px', color: colors.textLight, display: 'block', marginBottom: '8px' }}>
            קטגוריות מה להביא:
          </label>
          {planCategories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {planCategories.map(c => (
                <span key={c.id} style={{
                  background: colors.peachLight, color: colors.peachDeep,
                  borderRadius: '20px', padding: '4px 10px', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {c.name}
                  <button
                    onClick={() => setPlanCategories(prev => prev.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.peachDeep, fontSize: '14px', padding: 0 }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && catInput.trim()) {
                  setPlanCategories(prev => [...prev, { id: Date.now().toString(), name: catInput.trim() }]);
                  setCatInput('');
                }
              }}
              placeholder="הוסיפי קטגוריה (Enter לאישור)..."
              style={inputStyle}
            />
            {catInput.trim() && (() => {
              const lower = catInput.toLowerCase();
              const suggestions = PLAN_CATEGORY_SUGGESTIONS.filter(
                s => s.toLowerCase().includes(lower) && !planCategories.find(p => p.name === s)
              );
              if (!suggestions.length) return null;
              return (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, left: 0,
                  background: colors.white,
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10, overflow: 'hidden', marginTop: '4px',
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => {
                        setPlanCategories(prev => [...prev, { id: Date.now().toString(), name: s }]);
                        setCatInput('');
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'right',
                        padding: '9px 14px', background: 'transparent', border: 'none',
                        borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                        fontSize: '14px', color: colors.text, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
          <button
            onClick={createPlan}
            disabled={creatingPlan || !planTitle.trim() || planCategories.length === 0}
            style={{ ...primaryBtn, opacity: (!planTitle.trim() || planCategories.length === 0) ? 0.5 : 1 }}
          >
            {creatingPlan ? 'יוצרת...' : 'צרי טבלה'}
          </button>
        </Modal>
      )}

      {/* Recipe picker modal */}
      {showRecipePicker && (
        <Modal onClose={() => setShowRecipePicker(false)}>
          <h3 style={{ margin: '0 0 14px', color: colors.text }}>🍽️ שלחי מתכון</h3>
          {myRecipes.length === 0 ? (
            <div style={{ color: colors.textLight, textAlign: 'center', padding: '24px' }}>אין לך מתכונים עדיין</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {myRecipes.map(r => (
                <div
                  key={r.id}
                  onClick={() => sendRecipe(r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px',
                    border: `1px solid ${colors.border}`, cursor: 'pointer',
                    background: colors.peachBg,
                  }}
                >
                  {r.imageURL ? (
                    <img src={r.imageURL} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: colors.peachLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🍽️</div>
                  )}
                  <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>{r.title}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Pinned Meal Plan ─────────────────────────────────────────────────────────
function PinnedPlan({ plan, currentUser, onAssign, onRemove, onUnpin }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: colors.white,
      borderBottom: `2px solid ${colors.peach}`,
      padding: '10px 16px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>📌</span>
          <span style={{ fontWeight: '700', color: colors.text, fontSize: '14px' }}>{plan.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: '16px', padding: '4px' }}
          >
            {collapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={onUnpin}
            title="הסר נעיצה"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: '14px', padding: '4px' }}
          >
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {plan.categories?.map(cat => {
            const catAssignments = (plan.assignments || []).filter(a => a.categoryId === cat.id);
            const myAssignment = catAssignments.find(a => a.userId === currentUser?.uid);
            return (
              <div key={cat.id} style={{ background: colors.peachBg, borderRadius: '10px', padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: colors.text, fontSize: '13px' }}>{cat.name}</span>
                  {!myAssignment && (
                    <button
                      onClick={() => onAssign(cat.id)}
                      style={{
                        background: colors.peachDeep, color: colors.white,
                        border: 'none', borderRadius: '8px',
                        padding: '3px 10px', fontSize: '12px', cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      + שבצי
                    </button>
                  )}
                </div>
                {catAssignments.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: colors.textLight }}>
                      👤 {a.userName}: <strong style={{ color: colors.text }}>{a.item}</strong>
                    </span>
                    {a.userId === currentUser?.uid && (
                      <button
                        onClick={() => onRemove(a.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: '12px', padding: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, onRecipeClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-start' : 'flex-end' }}>
      {!isOwn && (
        <span style={{ fontSize: '11px', color: colors.textLight, marginBottom: '2px', paddingLeft: '4px' }}>
          {msg.senderName}
        </span>
      )}
      {msg.type === 'recipe' ? (
        <div
          onClick={() => onRecipeClick(msg.recipeId)}
          style={{
            background: isOwn ? colors.peachDeep : colors.white,
            borderRadius: isOwn ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
            overflow: 'hidden',
            border: `1px solid ${isOwn ? 'transparent' : colors.border}`,
            maxWidth: '220px',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(92,64,51,0.10)',
          }}
        >
          {msg.recipeImage ? (
            <img src={msg.recipeImage} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '56px', background: colors.peachLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🍽️</div>
          )}
          <div style={{ padding: '8px 10px', color: isOwn ? colors.white : colors.text, fontSize: '13px', fontWeight: '600' }}>
            🍽️ {msg.recipeTitle}
          </div>
        </div>
      ) : (
        <div style={{
          background: isOwn ? colors.peachDeep : colors.white,
          color: isOwn ? colors.white : colors.text,
          borderRadius: isOwn ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
          padding: '10px 14px',
          maxWidth: '72vw',
          fontSize: '14px',
          lineHeight: '1.4',
          boxShadow: '0 1px 4px rgba(92,64,51,0.08)',
          border: isOwn ? 'none' : `1px solid ${colors.border}`,
          direction: 'rtl',
          wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(92,64,51,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: colors.white, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: '480px', maxHeight: '90dvh', overflowY: 'auto', boxSizing: 'border-box', direction: 'rtl' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const headerIconBtn = {
  background: colors.peachLight,
  border: 'none',
  borderRadius: '10px',
  padding: '8px 10px',
  cursor: 'pointer',
  fontSize: '18px',
  lineHeight: 1,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '14px',
  color: colors.text,
  background: colors.peachBg,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  direction: 'rtl',
};

const primaryBtn = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  background: colors.peachDeep,
  color: colors.white,
  border: 'none',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginTop: '8px',
};
