import { useState } from 'react';
import { colors } from '../colors';
import LilyChat from './LilyChat';

export default function Header({ title = 'ספר המתכונים שלי' }) {
  const [lilyOpen, setLilyOpen] = useState(false);

  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${colors.peach}, ${colors.peachDeep})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(244,156,125,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: colors.white,
          textShadow: '0 1px 3px rgba(92,64,51,0.2)',
        }}>
          {title}
        </h1>
        <button
          onClick={() => setLilyOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title="לילי - עוזרת המטבח שלי"
        >
          👩🏽‍🍳
        </button>
      </div>

      {lilyOpen && <LilyChat onClose={() => setLilyOpen(false)} />}
    </>
  );
}
