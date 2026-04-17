import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  agentId: number;
  onClose: () => void;
  onSendMessage: (agentId: number) => void;
  onCustomize: (agentId: number) => void;
  onCopySessionId: (agentId: number) => void;
  onCloseAgent: (agentId: number) => void;
  onRename: (agentId: number) => void;
}

export function ContextMenu({
  x,
  y,
  agentId,
  onClose,
  onSendMessage,
  onCustomize,
  onCopySessionId,
  onCloseAgent,
  onRename,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position so menu doesn't overflow viewport
  const MENU_W = 200;
  const MENU_H = 180;
  const adjustedX = Math.min(x, window.innerWidth - MENU_W - 8);
  const adjustedY = Math.min(y, window.innerHeight - MENU_H - 8);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '5px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--vscode-foreground)',
    fontSize: 12,
    whiteSpace: 'nowrap',
  };

  const handleItem = (cb: () => void) => () => {
    onClose();
    cb();
  };

  return (
    <div
      ref={menuRef}
      className="shadow-pixel"
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        zIndex: 9999,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 0,
        minWidth: MENU_W,
        padding: '3px 0',
        userSelect: 'none',
      }}
    >
      <button
        style={itemStyle}
        onClick={handleItem(() => onRename(agentId))}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span>✏️</span> Переименовать
      </button>

      <button
        style={itemStyle}
        onClick={handleItem(() => onSendMessage(agentId))}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span>💬</span> Отправить сообщение
      </button>

      <button
        style={itemStyle}
        onClick={handleItem(() => onCustomize(agentId))}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span>🎨</span> Сменить образ
      </button>

      <button
        style={itemStyle}
        onClick={handleItem(() => onCopySessionId(agentId))}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span>📋</span> Копировать Session ID
      </button>

      <div
        style={{
          height: 1,
          background: 'var(--color-border)',
          margin: '3px 10px',
        }}
      />

      <button
        style={{ ...itemStyle, color: 'var(--color-danger-light)' }}
        onClick={handleItem(() => onCloseAgent(agentId))}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span>🔴</span> Завершить сессию
      </button>
    </div>
  );
}
