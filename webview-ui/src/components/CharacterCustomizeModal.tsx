import { useEffect, useRef, useState } from 'react';

import type { OfficeState } from '../office/engine/officeState.js';
import { Modal } from './ui/Modal.js';
import { Button } from './ui/Button.js';

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
    },
  ) => void;
  onFocusTerminal: (id: number) => void;
}

/** Approximate display colors for each character palette (char_0 .. char_5) */
const PALETTE_COLORS = [
  '#E8A87C', // char_0 – warm skin
  '#8BAED4', // char_1 – blue-cool
  '#C5896B', // char_2 – tan
  '#D4A8C8', // char_3 – lavender
  '#96C5A0', // char_4 – sage
  '#E8CC8A', // char_5 – golden
];

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'neutral', label: 'Нейтр' },
  { value: 'female', label: 'Жен' },
  { value: 'male', label: 'Муж' },
];

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
  const [isPanda, setIsPanda] = useState(false);
  const [gender, setGender] = useState('neutral');

  // Reset form state whenever the modal opens for a (possibly different) agent
  const prevAgentId = useRef<number | null>(null);
  useEffect(() => {
    if (isOpen && agentId !== null && agentId !== prevAgentId.current) {
      prevAgentId.current = agentId;
      const c = officeState.characters.get(agentId);
      setCustomName(c?.customName ?? '');
      setSelectedPalette(c?.palette ?? 0);
      setSelectedHueShift(c?.hueShift ?? 0);
      setIsPanda(c?.isPanda ?? false);
      setGender(c?.gender ?? 'neutral');
    }
    if (!isOpen) {
      prevAgentId.current = null;
    }
  }, [isOpen, agentId, officeState]);

  if (!isOpen || agentId === null) return null;

  const isTeamLead = ch?.isTeamLead ?? false;
  const isSub = ch?.isSubagent ?? false;

  const handleSave = () => {
    onSave(agentId, {
      customName,
      palette: selectedPalette,
      hueShift: selectedHueShift,
      isPanda,
      gender,
    });
  };

  const handleFocus = () => {
    onFocusTerminal(agentId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPanda ? (isTeamLead ? '🐼 Оркестратор-Панда' : '🐼 Настройка персонажа') : 'Настройка персонажа'}
      zIndex={60}
      className="min-w-[320px]"
    >
      <div className="px-10 pb-8 flex flex-col gap-12">

        {/* Panda orchestrator highlight */}
        {isTeamLead && (
          <div
            className="text-center text-sm py-4 px-8"
            style={{ background: 'rgba(96, 48, 255, 0.15)', border: '1px solid rgba(96, 48, 255, 0.4)', color: '#a07fff' }}
          >
            Главный оркестратор — попробуй стиль Панды!
          </div>
        )}

        {/* Panda toggle */}
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-muted">Стиль</span>
          <div className="flex gap-6">
            <button
              onClick={() => setIsPanda(false)}
              className={`flex-1 py-6 px-8 text-sm border-2 rounded-none cursor-pointer ${
                !isPanda
                  ? 'border-accent bg-active-bg text-text'
                  : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
              }`}
            >
              Человек
            </button>
            <button
              onClick={() => setIsPanda(true)}
              className={`flex-1 py-6 px-8 text-sm border-2 rounded-none cursor-pointer ${
                isPanda
                  ? 'border-accent bg-active-bg text-text'
                  : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
              }`}
            >
              🐼 Панда
            </button>
          </div>
        </div>

        {/* Character palette */}
        {!isPanda && (
          <div className="flex flex-col gap-4">
            <span className="text-sm text-text-muted">Персонаж</span>
            <div className="flex gap-4 flex-wrap">
              {PALETTE_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  title={`Персонаж ${idx + 1}`}
                  onClick={() => { setSelectedPalette(idx); setSelectedHueShift(0); }}
                  className="w-28 h-28 border-2 rounded-none cursor-pointer"
                  style={{
                    background: color,
                    borderColor: selectedPalette === idx && !isPanda ? 'var(--color-accent-bright)' : 'var(--color-border)',
                    boxShadow: selectedPalette === idx && !isPanda ? '0 0 0 1px var(--color-accent-bright)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Panda preview */}
        {isPanda && (
          <div
            className="flex items-center justify-center py-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span style={{ fontSize: '48px', lineHeight: 1 }}>🐼</span>
            <div className="ml-8 flex flex-col gap-2">
              <span className="text-base" style={{ color: '#d0d0d0' }}>
                {isTeamLead ? 'Главный Оркестратор' : 'Агент-Панда'}
              </span>
              <span className="text-sm text-text-muted">Чёрно-белый стиль</span>
            </div>
          </div>
        )}

        {/* Gender */}
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-muted">Пол</span>
          <div className="flex gap-4">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                className={`flex-1 py-4 text-sm border-2 rounded-none cursor-pointer ${
                  gender === opt.value
                    ? 'border-accent bg-active-bg text-text'
                    : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                }`}
              >
                {opt.label}
              </button>
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
            placeholder={isSub ? 'Подагент' : (isTeamLead ? 'Оркестратор' : 'Агент')}
            maxLength={32}
            className="w-full py-4 px-8 text-sm bg-btn-bg border-2 border-border text-text rounded-none outline-none focus:border-accent"
            style={{ fontFamily: 'inherit' }}
          />
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
