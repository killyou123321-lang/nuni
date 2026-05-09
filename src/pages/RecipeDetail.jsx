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
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.onSurfaceVariant }}>טוענת...</span>
    </div>
  );

  if (!recipe) return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.onSurfaceVariant }}>המתכון לא נמצא</span>
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
    <div style={{ minHeight: '100vh', background: colors.background, direction: 'rtl', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: `1px solid ${colors.outlineVariant}`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(50,34,20,0.06)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: colors.surfaceContainerLow, border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: colors.primary }}>arrow_forward</span>
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOwn && (
            <>
              <button
                onClick={() => navigate(`/edit-recipe/${id}`)}
                style={{ background: colors.surfaceContainerLow, border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.secondary }}>edit</span>
              </button>
              <button
                onClick={handleDelete}
                style={{ background: '#fff0f0', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#b00020' }}>delete</span>
              </button>
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
          background: colors.surfaceContainerLow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: colors.outline }}>restaurant</span>
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {/* Title & meta */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: colors.primary, fontFamily: "'EB Garamond', serif", lineHeight: 1.2 }}>{recipe.title}</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {recipe.category && (
              <span style={{ background: colors.peachLight, color: colors.secondary, fontWeight: '700', fontSize: '13px', padding: '4px 12px', borderRadius: '12px' }}>
                {recipe.category}
              </span>
            )}
            {recipe.authorName && !isOwn && (
              <span
                onClick={() => navigate(`/profile/${recipe.authorId}`)}
                style={{ color: colors.onSurfaceVariant, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                {recipe.authorName}
              </span>
            )}
            <span style={{ color: colors.outline, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {recipe.visibility === 'public' ? 'public' : recipe.visibility === 'followers' ? 'group' : 'lock'}
              </span>
              {recipe.visibility === 'public' ? 'ציבורי' : recipe.visibility === 'followers' ? 'עוקבים' : 'פרטי'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <ActionButton
            icon="favorite"
            filled={isLiked}
            label={`${recipe.likes?.length || 0} לייקים`}
            onClick={toggleLike}
            active={isLiked}
          />
          <ActionButton
            icon="bookmark"
            filled={isFavorited}
            label="מועדף"
            onClick={toggleFavorite}
            active={isFavorited}
          />
          {!isOwn && (
            <ActionButton icon="add_box" filled={false} label="שמרי לספר" onClick={() => setSaveOpen(true)} />
          )}
          <ActionButton icon="share" filled={false} label="שלחי" onClick={() => setShareOpen(true)} />
        </div>

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <Section title="מצרכים" icon="grocery">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                background: i % 2 === 0 ? '#ffffff' : colors.surfaceContainerLow,
                borderRadius: '10px',
                fontSize: '14px',
                color: colors.onSurface,
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.secondary, flexShrink: 0 }} />
                {ing}
              </div>
            ))}
          </Section>
        )}

        {/* Steps */}
        {recipe.steps?.length > 0 && (
          <Section title="שלבי הכנה" icon="menu_book">
            {recipe.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: '#ffffff',
                borderRadius: '12px',
                marginBottom: '8px',
                border: `1px solid ${colors.outlineVariant}`,
              }}>
                <span style={{
                  background: colors.secondary,
                  color: '#ffffff',
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
                <p style={{ margin: 0, fontSize: '14px', color: colors.onSurface, lineHeight: '1.6' }}>{step}</p>
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

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: colors.primary, fontFamily: "'EB Garamond', serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: colors.secondary }}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ActionButton({ icon, filled, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? colors.peachLight : '#ffffff',
        border: `1.5px solid ${active ? colors.secondary : colors.outlineVariant}`,
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
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '22px',
          color: active ? colors.secondary : colors.onSurfaceVariant,
          fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        }}
      >{icon}</span>
      <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, fontWeight: '600' }}>{label}</span>
    </button>
  );
}
