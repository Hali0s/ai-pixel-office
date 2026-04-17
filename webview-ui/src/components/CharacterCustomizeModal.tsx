import { useEffect, useRef, useState } from 'react';

import type { OfficeState } from '../office/engine/officeState.js';
import { getCachedSprite } from '../office/sprites/spriteCache.js';
import { getCharacterSprites, getLoadedCharacterCount } from '../office/sprites/spriteData.js';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';

interface CharacterCustomizeModalProps {
  isOpen: boolean;
  agentId: number | null;
  officeState: OfficeState;
  onClose: () => void;
  onSave: (
    id: number,
    opts: {
      customName: string;
      palette: number;
      hueShift: number;
      isPanda: boolean;
      gender: string;
      idlePreference: string;
    },
  ) => void;
  onFocusTerminal: (id: number) => void;
}

/** Mini sprite preview rendered on a canvas — shows the standing-down pose */
function SpritePreview({
  palette,
  hueShift,
  selected,
  onClick,
}: {
  palette: number;
  hueShift: number;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ZOOM = 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sprites = getCharacterSprites(palette, hueShift, false);
    // Use the standing frame (walk[DOWN][1] = neutral stand)
    const frame = sprites.walk[0][1];
    const cached = getCachedSprite(frame, ZOOM);
    canvas.width = cached.width;
    canvas.height = cached.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cached, 0, 0);
  }, [palette, hueShift]);

  return (
    <button
      onClick={onClick}
      title={`Персонаж ${palette + 1}`}
      style={{
        background: 'var(--pixel-bg)',
        border: `2px solid ${selected ? 'var(--color-accent-bright)' : 'var(--color-border)'}`,
        boxShadow: selected ? '0 0 0 1px var(--color-accent-bright)' : 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        imageRendering: 'pixelated',
      }}
    >
      <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />
    </button>
  );
}

export function CharacterCustomizeModal({
  isOpen,
  agentId,
  officeState,
  onClose,
  onSave,
  onFocusTerminal,
}: CharacterCustomizeModalProps) {
  const ch = agentId !== null ? officeState.characters.get(agentId) : null;

  const [customName, setCustomName] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [selectedHueShift, setSelectedHueShift] = useState(0);
  const [idlePreference, setIdlePreference] = useState<string>('random');

  // Reset form state whenever the modal opens for a (possibly different) agent
  const prevAgentId = useRef<number | null>(null);
  useEffect(() => {
    if (isOpen && agentId !== null && agentId !== prevAgentId.current) {
      prevAgentId.current = agentId;
      const c = officeState.characters.get(agentId);
      setCustomName(c?.customName ?? '');
      setSelectedPalette(c?.palette ?? 0);
      setSelectedHueShift(c?.hueShift ?? 0);
      setIdlePreference(c?.idlePreference ?? 'random');
    }
    if (!isOpen) {
      prevAgentId.current = null;
    }
  }, [isOpen, agentId, officeState]);

  if (!isOpen || agentId === null) return null;

  const isSub = ch?.isSubagent ?? false;

  const handleSave = () => {
    onSave(agentId, {
      customName,
      palette: selectedPalette,
      hueShift: selectedHueShift,
      isPanda: ch?.isPanda ?? false,
      gender: 'neutral',
      idlePreference,
    });
  };

  const handleFocus = () => {
    onFocusTerminal(agentId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройка персонажа"
      zIndex={60}
      className="min-w-[320px]"
    >
      <div className="px-10 pb-8 flex flex-col gap-12">
        {/* Character palette — sprite previews */}
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-muted">Персонаж</span>
          <div className="flex gap-4 flex-wrap">
            {Array.from({ length: getLoadedCharacterCount() }, (_, idx) => (
              <SpritePreview
                key={idx}
                palette={idx}
                hueShift={selectedPalette === idx ? selectedHueShift : 0}
                selected={selectedPalette === idx}
                onClick={() => {
                  setSelectedPalette(idx);
                  setSelectedHueShift(0);
                }}
              />
            ))}
          </div>
        </div>

        {/* Custom name */}
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-muted">Имя (необязательно)</span>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={isSub ? 'Подагент' : 'Агент'}
            maxLength={32}
            className="w-full py-4 px-8 text-sm bg-btn-bg border-2 border-border text-text rounded-none outline-none focus:border-accent"
          />
        </div>

        {/* Idle preference */}
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-muted">Отдых</span>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 'random', label: 'Случайно', icon: '🎲' },
              { value: 'coffee', label: 'Кофе ☕', icon: '' },
              { value: 'sleep', label: 'Сон 💤', icon: '' },
              { value: 'phone', label: 'Телефон 📱', icon: '' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setIdlePreference(opt.value)}
                className={`flex-1 py-4 px-6 text-xs border-2 rounded-none cursor-pointer ${
                  idlePreference === opt.value
                    ? 'border-accent bg-active-bg text-text'
                    : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                }`}
              >
                {opt.label || opt.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-6 pt-4">
          <Button variant="accent" size="md" onClick={handleSave} className="flex-1">
            Сохранить
          </Button>
          {!isSub && (
            <Button variant="default" size="md" onClick={handleFocus} className="flex-1">
              Терминал
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
}
