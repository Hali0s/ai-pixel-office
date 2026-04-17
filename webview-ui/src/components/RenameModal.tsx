import { useEffect, useRef, useState } from 'react';

interface RenameModalProps {
  agentId: number | null;
  currentName: string;
  onClose: () => void;
  onRename: (agentId: number, name: string) => void;
}

export function RenameModal({ agentId, currentName, onClose, onRename }: RenameModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (agentId !== null) {
      setValue(currentName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [agentId, currentName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (agentId === null) return null;

  const handleSave = () => {
    const trimmed = value.trim();
    onRename(agentId, trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9998 }} onClick={onClose} />
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
          minWidth: 280,
          maxWidth: 400,
          width: '80%',
        }}
      >
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
            ✏️ Переименовать агента
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
        <div style={{ padding: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Имя агента (оставьте пустым для сброса)"
            maxLength={40}
            style={{
              width: '100%',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-foreground)',
              border: '1px solid var(--color-border)',
              borderRadius: 0,
              padding: '6px 8px',
              fontSize: 12,
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
              onClick={handleSave}
              className="shadow-pixel"
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: 0,
                color: 'var(--color-text)',
                padding: '5px 14px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
