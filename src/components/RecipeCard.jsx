import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { colors } from '../colors';
import ShareToChatModal from './ShareToChatModal';

export default function RecipeCard({ recipe, onSaveToBook }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isLiked = recipe.likes?.includes(currentUser?.uid);
  const isFavorited = recipe.favoritedBy?.includes(currentUser?.uid);
  const isSaved = recipe.savedBy?.includes(currentUser?.uid);
  const isOwn = recipe.authorId === currentUser?.uid;

  async function toggleLike(e) {
    e.stopPropagation();
    if (!currentUser) return;
    const ref = doc(db, 'recipes', recipe.id);
    await updateDoc(ref, {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  }

  async function toggleFavorite(e) {
    e.stopPropagation();
    if (!currentUser) return;
    const ref = doc(db, 'recipes', recipe.id);
    await updateDoc(ref, {
      favoritedBy: isFavorited ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  }

  async function handleSave(e) {
    e.stopPropagation();
    if (!currentUser || saving) return;
    setSaving(true);
    if (!isOwn && onSaveToBook) {
      await onSaveToBook(recipe);
    } else {
      const ref = doc(db, 'recipes', recipe.id);
      await updateDoc(ref, {
        savedBy: isSaved ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });
    }
    setSaving(false);
  }

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        background: colors.white,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(92,64,51,0.08)',
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {recipe.imageURL ? (
        <img
          src={recipe.imageURL}
          alt={recipe.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '120px',
          background: `linear-gradient(135deg, ${colors.peachLight}, ${colors.greenLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px',
        }}>🍽️</div>
      )}

      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: colors.text, flex: 1 }}>
            {recipe.title}
          </h3>
          {recipe.category && (
            <span style={{
              background: colors.peachLight,
              color: colors.peachDeep,
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              marginRight: '6px',
              whiteSpace: 'nowrap',
            }}>
              {recipe.category}
            </span>
          )}
        </div>

        {recipe.authorName && !isOwn && (
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${recipe.authorId}`); }}
            style={{ fontSize: '12px', color: colors.textLight, marginBottom: '8px', cursor: 'pointer' }}
          >
            👤 {recipe.authorName}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <ActionBtn
            icon={isLiked ? '💗' : '🤍'}
            count={recipe.likes?.length || 0}
            onClick={toggleLike}
            active={isLiked}
          />
          <ActionBtn
            icon={isFavorited ? '❤️' : '♡'}
            count={null}
            onClick={toggleFavorite}
            active={isFavorited}
            title="הוסיפי למועדפים"
          />
          <ActionBtn
            icon={isSaved ? '🔖' : '📌'}
            count={null}
            onClick={handleSave}
            active={isSaved}
            title="שמרי לספר שלי"
          />
          <ActionBtn
            icon="📤"
            count={null}
            onClick={e => { e.stopPropagation(); setShareOpen(true); }}
            active={false}
            title="שלחי לצ׳אט"
          />
        </div>
      </div>
      {shareOpen && <ShareToChatModal recipe={recipe} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function ActionBtn({ icon, count, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? colors.peachLight : 'transparent',
        border: `1px solid ${active ? colors.peach : colors.border}`,
        borderRadius: '8px',
        padding: '4px 8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '14px',
        color: colors.text,
        transition: 'all 0.15s',
      }}
    >
      <span>{icon}</span>
      {count !== null && <span style={{ fontSize: '12px', color: colors.textLight }}>{count}</span>}
    </button>
  );
}
