import { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function ShareToChatModal({ recipe, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
      setChats(list);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  async function sendToChat(chat) {
    if (sending) return;
    setSending(chat.id);
    await addDoc(collection(db, 'chats', chat.id, 'messages'), {
      type: 'recipe',
      senderId: currentUser.uid,
      senderName: userProfile?.name || currentUser.email,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeImage: recipe.imageURL || '',
      text: `📋 ${recipe.title}`,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chat.id), {
      lastMessage: `📋 ${recipe.title}`,
      lastMessageAt: serverTimestamp(),
    });
    setSending(null);
    onClose();
  }

  function getChatName(chat) {
    if (chat.type === 'group') return chat.name;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    return chat.memberNames?.[otherId] || 'שיחה';
  }

  function getChatInitial(chat) {
    if (chat.type === 'group') return null;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    const photo = chat.memberPhotos?.[otherId];
    if (photo) return photo;
    return chat.memberNames?.[otherId]?.[0] || '?';
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(50,34,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', width: '100%', maxWidth: '480px', maxHeight: '80dvh', overflowY: 'auto', boxSizing: 'border-box', direction: 'rtl' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: colors.primary, fontSize: '20px', fontWeight: '700', fontFamily: "'EB Garamond', serif" }}>שלחי לצ׳אט</h3>
          <button
            onClick={onClose}
            style={{ background: colors.surfaceContainerLow, border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.onSurfaceVariant }}>close</span>
          </button>
        </div>

        {/* Recipe preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: colors.surfaceContainerLow, borderRadius: '12px', padding: '10px 12px', marginBottom: '16px', border: `1px solid ${colors.outlineVariant}` }}>
          {recipe.imageURL ? (
            <img src={recipe.imageURL} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: colors.peachLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: colors.secondary }}>restaurant</span>
            </div>
          )}
          <span style={{ color: colors.onSurface, fontWeight: '600', fontSize: '14px' }}>{recipe.title}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: colors.onSurfaceVariant, padding: '20px' }}>טוענת...</div>
        ) : chats.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.onSurfaceVariant, padding: '20px', fontSize: '14px' }}>
            אין לך שיחות עדיין.<br />פתחי שיחה בלשונית הצ׳אט.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chats.map(chat => {
              const initial = getChatInitial(chat);
              const isPhoto = typeof initial === 'string' && initial.startsWith('http');
              return (
                <div
                  key={chat.id}
                  onClick={() => sendToChat(chat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    border: `1px solid ${colors.outlineVariant}`,
                    cursor: sending === chat.id ? 'default' : 'pointer',
                    background: sending === chat.id ? colors.peachLight : colors.surfaceContainerLow,
                    transition: 'background 0.15s',
                  }}
                >
                  {isPhoto ? (
                    <img src={initial} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : chat.type === 'group' ? (
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: colors.surfaceContainerLow,
                      border: `1px solid ${colors.outlineVariant}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: colors.secondary }}>group</span>
                    </div>
                  ) : (
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: colors.secondary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', color: '#ffffff', fontWeight: '700',
                    }}>
                      {initial}
                    </div>
                  )}
                  <span style={{ color: colors.onSurface, fontWeight: '600', fontSize: '15px' }}>
                    {sending === chat.id ? 'שולחת...' : getChatName(chat)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
