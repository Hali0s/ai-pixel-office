import { useEffect, useRef, useState } from 'react';

interface SendMessageModalProps {
  agentId: number | null;
  agentDisplayName: string;
  onClose: () => void;
  onSend: (agentId: number, text: string) => void;
}

export function SendMessageModal({
  agentId,
  agentDisplayName,
  onClose,
  onSend,
}: SendMessageModalProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (agentId !== null) {
      setText('');
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [agentId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (agentId === null) return null;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(agentId, trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9998 }} onClick={onClose} />
      {/* Modal */}
      <div
        className="shadow-pixel"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'var(--color-bg)',
          border: '2px solid var(--color-border)',
          borderRadius: 0,
          minWidth: 320,
          maxWidth: 480,
          width: '90%',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              color: 'var(--color-accent)',
              fontSize: 13,
              fontWeight: 'bold',
            }}
          >
            💬 Сообщение агенту: {agentDisplayName}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--vscode-foreground)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 2px',
              borderRadius: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 12 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
            rows={4}
            style={{
              width: '100%',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-foreground)',
              border: '1px solid var(--color-border)',
              borderRadius: 0,
              padding: '6px 8px',
              fontSize: 12,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                color: 'var(--vscode-foreground)',
                padding: '5px 14px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className={text.trim() ? 'shadow-pixel' : ''}
              style={{
                background: text.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                border: 'none',
                borderRadius: 0,
                color: 'var(--color-text)',
                padding: '5px 14px',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
