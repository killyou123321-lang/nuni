import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SaveToBookModal from '../components/SaveToBookModal';
import ShareToChatModal from '../components/ShareToChatModal';
import { colors } from '../colors';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'recipes', id)).then(snap => {
      if (snap.exists()) setRecipe({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.textLight }}>טוענת...</span>
    </div>
  );

  if (!recipe) return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.textLight }}>המתכון לא נמצא</span>
    </div>
  );

  const isOwn = recipe.authorId === currentUser?.uid;
  const isLiked = recipe.likes?.includes(currentUser?.uid);
  const isFavorited = recipe.favoritedBy?.includes(currentUser?.uid);

  async function toggleLike() {
    if (!currentUser) return;
    await updateDoc(doc(db, 'recipes', id), {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    setRecipe(prev => ({
      ...prev,
      likes: isLiked
        ? prev.likes.filter(u => u !== currentUser.uid)
        : [...(prev.likes || []), currentUser.uid],
    }));
  }

  async function toggleFavorite() {
    if (!currentUser) return;
    await updateDoc(doc(db, 'recipes', id), {
      favoritedBy: isFavorited ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    setRecipe(prev => ({
      ...prev,
      favoritedBy: isFavorited
        ? prev.favoritedBy.filter(u => u !== currentUser.uid)
        : [...(prev.favoritedBy || []), currentUser.uid],
    }));
  }

  async function handleDelete() {
    if (!confirm('למחוק את המתכון הזה?')) return;
    await deleteDoc(doc(db, 'recipes', id));
    navigate('/my-book');
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.peachBg, direction: 'rtl', paddingBottom: '40px' }}>
      {/* Back header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: colors.white, fontSize: '18px' }}>←</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOwn && (
            <>
              <button onClick={() => navigate(`/edit-recipe/${id}`)} style={iconBtn}>✏️</button>
              <button onClick={handleDelete} style={iconBtn}>🗑️</button>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      {recipe.imageURL ? (
        <img src={recipe.imageURL} alt={recipe.title} style={{ width: '100%', maxHeight: '280px', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '160px',
          background: `linear-gradient(135deg, ${colors.peachLight}, ${colors.greenLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px',
        }}>🍽️</div>
      )}

      <div style={{ padding: '20px' }}>
        {/* Title & meta */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: colors.text }}>{recipe.title}</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {recipe.category && (
              <span style={{ background: colors.peachLight, color: colors.peachDeep, fontWeight: '700', fontSize: '13px', padding: '4px 12px', borderRadius: '12px' }}>
                {recipe.category}
              </span>
            )}
            {recipe.authorName && !isOwn && (
              <span
                onClick={() => navigate(`/profile/${recipe.authorId}`)}
                style={{ color: colors.textLight, fontSize: '13px', cursor: 'pointer' }}
              >
                👤 {recipe.authorName}
              </span>
            )}
            <span style={{ color: colors.textLight, fontSize: '12px' }}>
              {recipe.visibility === 'public' ? '🌍 ציבורי' : recipe.visibility === 'followers' ? '👥 עוקבים' : '🔒 פרטי'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <ActionButton icon={isLiked ? '💗' : '🤍'} label={`${recipe.likes?.length || 0} לייקים`} onClick={toggleLike} active={isLiked} />
          <ActionButton icon={isFavorited ? '❤️' : '♡'} label="מועדף" onClick={toggleFavorite} active={isFavorited} />
          {!isOwn && (
            <ActionButton icon="📌" label="שמרי לספר" onClick={() => setSaveOpen(true)} />
          )}
          <ActionButton icon="📤" label="שלחי" onClick={() => setShareOpen(true)} />
        </div>

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <Section title="🛒 מצרכים">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                background: i % 2 === 0 ? colors.white : colors.peachBg,
                borderRadius: '10px',
                fontSize: '14px',
                color: colors.text,
                marginBottom: '4px',
              }}>
                • {ing}
              </div>
            ))}
          </Section>
        )}

        {/* Steps */}
        {recipe.steps?.length > 0 && (
          <Section title="👩‍🍳 שלבי הכנה">
            {recipe.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: colors.white,
                borderRadius: '12px',
                marginBottom: '8px',
                border: `1px solid ${colors.border}`,
              }}>
                <span style={{
                  background: colors.peachDeep,
                  color: colors.white,
                  borderRadius: '50%',
                  minWidth: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                }}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: '14px', color: colors.text, lineHeight: '1.5' }}>{step}</p>
              </div>
            ))}
          </Section>
        )}
      </div>

      {saveOpen && <SaveToBookModal recipe={recipe} onClose={() => setSaveOpen(false)} />}
      {shareOpen && <ShareToChatModal recipe={recipe} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: colors.text }}>{title}</h2>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? colors.peachLight : colors.white,
        border: `1.5px solid ${active ? colors.peach : colors.border}`,
        borderRadius: '12px',
        padding: '10px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ fontSize: '11px', color: colors.textLight, fontWeight: '600' }}>{label}</span>
    </button>
  );
}

const iconBtn = {
  background: 'rgba(255,255,255,0.25)',
  border: 'none',
  borderRadius: '10px',
  padding: '8px 10px',
  cursor: 'pointer',
  fontSize: '18px',
};
