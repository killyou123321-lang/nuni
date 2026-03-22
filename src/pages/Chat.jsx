import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, addDoc, serverTimestamp,
  doc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function Chat() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // 'direct' | 'group'
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() || 0;
        const tb = b.lastMessageAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setChats(list);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!searchName.trim()) { setSearchResults([]); return; }
    const candidates = [
      ...(userProfile?.followers || []),
      ...(userProfile?.following || []),
    ];
    const unique = [...new Set(candidates)].filter(id => id !== currentUser?.uid);
    if (!unique.length) { setSearchResults([]); return; }
    (async () => {
      const results = [];
      for (const uid of unique) {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name?.toLowerCase().includes(searchName.toLowerCase())) {
            results.push({ id: uid, ...data });
          }
        }
      }
      setSearchResults(results);
    })();
  }, [searchName, userProfile]);

  async function startDirectChat(otherUser) {
    setCreating(true);
    const existing = chats.find(c => c.type === 'direct' && c.members.includes(otherUser.id));
    if (existing) { navigate(`/chat/${existing.id}`); return; }
    const ref = await addDoc(collection(db, 'chats'), {
      type: 'direct',
      members: [currentUser.uid, otherUser.id],
      memberNames: {
        [currentUser.uid]: userProfile?.name || currentUser.email,
        [otherUser.id]: otherUser.name,
      },
      memberPhotos: {
        [currentUser.uid]: userProfile?.photoURL || '',
        [otherUser.id]: otherUser.photoURL || '',
      },
      name: '',
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      pinnedPlanId: null,
    });
    setCreating(false);
    navigate(`/chat/${ref.id}`);
  }

  async function createGroup() {
    if (!groupName.trim() || selectedMembers.length < 1) return;
    setCreating(true);
    const allMembers = [currentUser.uid, ...selectedMembers.map(m => m.id)];
    const memberNames = { [currentUser.uid]: userProfile?.name || currentUser.email };
    const memberPhotos = { [currentUser.uid]: userProfile?.photoURL || '' };
    selectedMembers.forEach(m => {
      memberNames[m.id] = m.name;
      memberPhotos[m.id] = m.photoURL || '';
    });
    const ref = await addDoc(collection(db, 'chats'), {
      type: 'group',
      members: allMembers,
      memberNames,
      memberPhotos,
      name: groupName.trim(),
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      pinnedPlanId: null,
    });
    setCreating(false);
    navigate(`/chat/${ref.id}`);
  }

  function getChatName(chat) {
    if (chat.type === 'group') return chat.name;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    return chat.memberNames?.[otherId] || 'שיחה';
  }

  function getChatInitial(chat) {
    if (chat.type === 'group') return '👥';
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    const photo = chat.memberPhotos?.[otherId];
    if (photo) return photo;
    return chat.memberNames?.[otherId]?.[0] || '?';
  }

  function resetPanel() {
    setMode(null);
    setSearchName('');
    setSearchResults([]);
    setGroupName('');
    setSelectedMembers([]);
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, paddingBottom: '80px', direction: 'rtl' }}>
      <Header />

      {/* Top bar */}
      <div style={{
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ margin: 0, color: colors.text, fontSize: '18px', fontWeight: '700' }}>💬 צ׳אט</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => mode === 'group' ? resetPanel() : (resetPanel(), setMode('group'))}
            style={{ ...pillBtn, ...(mode === 'group' ? { background: colors.peachDeep, color: colors.white } : {}) }}
          >
            👥 קבוצה
          </button>
          <button
            onClick={() => mode === 'direct' ? resetPanel() : (resetPanel(), setMode('direct'))}
            style={{ ...pillBtn, ...(mode === 'direct' ? { background: colors.peachDeep, color: colors.white } : {}) }}
          >
            + שיחה
          </button>
        </div>
      </div>

      {/* Direct chat panel */}
      {mode === 'direct' && (
        <div style={{ background: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '14px 20px' }}>
          <input
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="חפשי לפי שם מהקשרים שלך..."
            style={inputStyle}
            autoFocus
          />
          {searchResults.map(u => (
            <div key={u.id} onClick={() => startDirectChat(u)} style={userRow}>
              <UserAvatar name={u.name} photo={u.photoURL} />
              <span style={{ color: colors.text, fontSize: '15px' }}>{u.name}</span>
            </div>
          ))}
          {!searchResults.length && searchName.trim() && (
            <div style={{ color: colors.textLight, fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
              לא נמצאו משתמשות מהקשרים שלך
            </div>
          )}
        </div>
      )}

      {/* Group panel */}
      {mode === 'group' && (
        <div style={{ background: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '14px 20px' }}>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="שם הקבוצה..."
            style={{ ...inputStyle, marginBottom: '10px' }}
            autoFocus
          />
          <input
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="הוסיפי חברות לקבוצה..."
            style={inputStyle}
          />
          {selectedMembers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {selectedMembers.map(m => (
                <span key={m.id} style={{ background: colors.peachLight, color: colors.peachDeep, borderRadius: '20px', padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {m.name}
                  <button
                    onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.peachDeep, fontSize: '14px', padding: 0 }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          {searchResults.filter(u => !selectedMembers.find(m => m.id === u.id)).map(u => (
            <div key={u.id} onClick={() => { setSelectedMembers(prev => [...prev, u]); setSearchName(''); setSearchResults([]); }} style={userRow}>
              <UserAvatar name={u.name} photo={u.photoURL} />
              <span style={{ color: colors.text, fontSize: '15px' }}>{u.name}</span>
            </div>
          ))}
          <button
            onClick={createGroup}
            disabled={creating || !groupName.trim() || selectedMembers.length < 1}
            style={{
              ...pillBtn,
              background: colors.peachDeep,
              color: colors.white,
              marginTop: '12px',
              width: '100%',
              opacity: (!groupName.trim() || selectedMembers.length < 1) ? 0.5 : 1,
            }}
          >
            {creating ? 'יוצרת...' : 'צרי קבוצה'}
          </button>
        </div>
      )}

      {/* Chat list */}
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: colors.textLight }}>טוענת שיחות...</div>
      ) : chats.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: colors.textLight }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>עדיין אין שיחות</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>התחילי שיחה עם מישהי</div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px' }}>
          {chats.map(chat => {
            const initial = getChatInitial(chat);
            const name = getChatName(chat);
            const isPhoto = typeof initial === 'string' && initial.startsWith('http');
            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                style={{
                  background: colors.white,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 6px rgba(92,64,51,0.07)',
                  border: `1px solid ${colors.border}`,
                }}
              >
                {isPhoto ? (
                  <img src={initial} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: chat.type === 'group' ? '20px' : '18px', color: colors.white, fontWeight: '700',
                  }}>
                    {initial}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', color: colors.text, fontSize: '15px' }}>{name}</div>
                  {chat.lastMessage ? (
                    <div style={{ fontSize: '13px', color: colors.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: colors.textLight }}>אין הודעות עדיין</div>
                  )}
                </div>
                <span style={{ color: colors.textLight, fontSize: '20px' }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function UserAvatar({ name, photo }) {
  if (photo) return <img src={photo} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: colors.white, fontWeight: '700', fontSize: '16px',
    }}>
      {name?.[0] || '?'}
    </div>
  );
}

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

const pillBtn = {
  padding: '8px 16px',
  borderRadius: '20px',
  border: `1.5px solid ${colors.border}`,
  background: colors.white,
  color: colors.text,
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const userRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 0',
  cursor: 'pointer',
  borderBottom: `1px solid ${colors.border}`,
};
