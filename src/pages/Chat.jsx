import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function Chat() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
      setChats(list); setLoading(false);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!searchName.trim()) { setSearchResults([]); return; }
    const candidates = [...new Set([...(userProfile?.followers || []), ...(userProfile?.following || [])])].filter(id => id !== currentUser?.uid);
    if (!candidates.length) { setSearchResults([]); return; }
    (async () => {
      const results = [];
      for (const uid of candidates) {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name?.toLowerCase().includes(searchName.toLowerCase())) results.push({ id: uid, ...data });
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
      type: 'direct', members: [currentUser.uid, otherUser.id],
      memberNames: { [currentUser.uid]: userProfile?.name || currentUser.email, [otherUser.id]: otherUser.name },
      memberPhotos: { [currentUser.uid]: userProfile?.photoURL || '', [otherUser.id]: otherUser.photoURL || '' },
      name: '', createdBy: currentUser.uid, createdAt: serverTimestamp(),
      lastMessage: '', lastMessageAt: serverTimestamp(), pinnedPlanId: null,
    });
    setCreating(false); navigate(`/chat/${ref.id}`);
  }

  async function createGroup() {
    if (!groupName.trim() || selectedMembers.length < 1) return;
    setCreating(true);
    const allMembers = [currentUser.uid, ...selectedMembers.map(m => m.id)];
    const memberNames = { [currentUser.uid]: userProfile?.name || currentUser.email };
    const memberPhotos = { [currentUser.uid]: userProfile?.photoURL || '' };
    selectedMembers.forEach(m => { memberNames[m.id] = m.name; memberPhotos[m.id] = m.photoURL || ''; });
    const ref = await addDoc(collection(db, 'chats'), {
      type: 'group', members: allMembers, memberNames, memberPhotos,
      name: groupName.trim(), createdBy: currentUser.uid, createdAt: serverTimestamp(),
      lastMessage: '', lastMessageAt: serverTimestamp(), pinnedPlanId: null,
    });
    setCreating(false); navigate(`/chat/${ref.id}`);
  }

  function getChatName(chat) {
    if (chat.type === 'group') return chat.name;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    return chat.memberNames?.[otherId] || 'שיחה';
  }

  function getChatAvatar(chat) {
    if (chat.type === 'group') return null;
    const otherId = chat.members?.find(m => m !== currentUser?.uid);
    return chat.memberPhotos?.[otherId] || null;
  }

  function resetPanel() {
    setMode(null); setSearchName(''); setSearchResults([]);
    setGroupName(''); setSelectedMembers([]);
  }

  return (
    <div style={{ minHeight: '100svh', direction: 'rtl', paddingBottom: '100px' }}>
      <Header />

      <main style={{ padding: '24px 16px 0' }}>
        {/* Title + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontFamily: 'EB Garamond, serif', fontSize: '32px', color: '#322214', fontWeight: '600' }}>
            צ׳אט
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => mode === 'group' ? resetPanel() : (resetPanel(), setMode('group'))} style={{
              ...chipBtn,
              background: mode === 'group' ? '#9a4600' : 'rgba(235,232,226,0.7)',
              color: mode === 'group' ? '#ffffff' : '#4e453e',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group_add</span>
              קבוצה
            </button>
            <button onClick={() => mode === 'direct' ? resetPanel() : (resetPanel(), setMode('direct'))} style={{
              ...chipBtn,
              background: mode === 'direct' ? '#9a4600' : 'rgba(235,232,226,0.7)',
              color: mode === 'direct' ? '#ffffff' : '#4e453e',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              שיחה
            </button>
          </div>
        </div>

        {/* New direct chat panel */}
        {mode === 'direct' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(210,196,187,0.3)', boxShadow: '0 4px 16px rgba(74,55,40,0.06)' }}>
            <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="חפשי לפי שם מהקשרים שלך..." style={inputStyle} autoFocus />
            {searchResults.map(u => (
              <div key={u.id} onClick={() => startDirectChat(u)} style={userRow}>
                <UserAvatar name={u.name} photo={u.photoURL} />
                <span style={{ color: '#1c1c18', fontSize: '15px', fontWeight: '500' }}>{u.name}</span>
              </div>
            ))}
            {!searchResults.length && searchName.trim() && (
              <div style={{ color: '#80756d', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>לא נמצאו משתמשות מהקשרים שלך</div>
            )}
          </div>
        )}

        {/* New group panel */}
        {mode === 'group' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(210,196,187,0.3)', boxShadow: '0 4px 16px rgba(74,55,40,0.06)' }}>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="שם הקבוצה..." style={{ ...inputStyle, marginBottom: '10px' }} autoFocus />
            <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="הוסיפי חברות לקבוצה..." style={inputStyle} />
            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {selectedMembers.map(m => (
                  <span key={m.id} style={{ background: 'rgba(154,70,0,0.1)', color: '#9a4600', borderRadius: '20px', padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {m.name}
                    <button onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a4600', fontSize: '14px', padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            {searchResults.filter(u => !selectedMembers.find(m => m.id === u.id)).map(u => (
              <div key={u.id} onClick={() => { setSelectedMembers(prev => [...prev, u]); setSearchName(''); setSearchResults([]); }} style={userRow}>
                <UserAvatar name={u.name} photo={u.photoURL} />
                <span style={{ color: '#1c1c18', fontSize: '15px' }}>{u.name}</span>
              </div>
            ))}
            <button onClick={createGroup} disabled={creating || !groupName.trim() || selectedMembers.length < 1} style={{
              width: '100%', marginTop: '12px', background: '#9a4600', border: 'none', borderRadius: '12px',
              padding: '12px', color: '#ffffff', fontWeight: '600', fontSize: '14px',
              cursor: (!groupName.trim() || selectedMembers.length < 1) ? 'default' : 'pointer',
              opacity: (!groupName.trim() || selectedMembers.length < 1) ? 0.5 : 1,
              fontFamily: 'inherit',
            }}>
              {creating ? 'יוצרת...' : 'צרי קבוצה'}
            </button>
          </div>
        )}

        {/* Chat list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#80756d', padding: '40px' }}>טוענת שיחות...</div>
        ) : chats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#d2c4bb', display: 'block', marginBottom: '12px' }}>chat</span>
            <p style={{ color: '#4e453e', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }}>עדיין אין שיחות</p>
            <p style={{ color: '#80756d', fontSize: '13px', margin: 0 }}>התחילי שיחה עם מישהי</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chats.map(chat => {
              const photo = getChatAvatar(chat);
              const name = getChatName(chat);
              return (
                <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} style={{
                  background: '#ffffff', borderRadius: '16px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(74,55,40,0.05)',
                  border: '1px solid rgba(210,196,187,0.2)',
                }}>
                  {photo ? (
                    <img src={photo} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      background: chat.type === 'group' ? '#f1ede7' : 'rgba(154,70,0,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#9a4600' }}>
                        {chat.type === 'group' ? 'group' : 'person'}
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: '#322214', fontSize: '15px' }}>{name}</div>
                    <div style={{ fontSize: '13px', color: '#80756d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage || 'אין הודעות עדיין'}
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: '#d2c4bb', fontSize: '20px' }}>chevron_left</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function UserAvatar({ name, photo }) {
  if (photo) return <img src={photo} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: 'rgba(154,70,0,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#9a4600', fontWeight: '700', fontSize: '16px',
    }}>{name?.[0] || '?'}</div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1px solid rgba(210,196,187,0.4)', fontSize: '14px',
  color: '#1c1c18', background: '#f7f3ed', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', direction: 'rtl',
};
const chipBtn = {
  display: 'flex', alignItems: 'center', gap: '5px',
  padding: '8px 14px', borderRadius: '20px', border: 'none',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  transition: 'all 0.2s',
};
const userRow = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 0', cursor: 'pointer',
  borderBottom: '1px solid rgba(210,196,187,0.3)',
};
