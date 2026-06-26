import React, { useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import useClickOutside from '../../hook/use-click-outside';

const EmojiPickerButton = ({ onEmojiClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  useClickOutside(() => setIsOpen(false), isOpen, [pickerRef, buttonRef]);

  const handleEmojiClick = (emojiData) => {
    onEmojiClick(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f3f4f6';
          e.target.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#6b7280';
        }}
        title="Chèn emoji"
      >
        <Smile size={20} />
      </button>

      {isOpen && (
        <div
          ref={pickerRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            zIndex: 1000,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
            height={window.innerWidth < 400 ? 350 : 400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false,
            }}
            theme="light"
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;

