import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { PALETTE_COUNT } from '../constants.js';
import type { WorkspaceFolder } from '../hooks/useExtensionMessages.js';
import { getCachedSprite } from '../office/sprites/spriteCache.js';
import { getCharacterSprites, getLoadedCharacterCount } from '../office/sprites/spriteData.js';
import { vscode } from '../vscodeApi.js';
import { AgentTemplateEditorModal } from './AgentTemplateEditorModal.js';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';

function SpritePreview({
  palette,
  selected,
  onClick,
}: {
  palette: number;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ZOOM = 3;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sprites = getCharacterSprites(palette, 0, false);
    const frame = sprites.walk[0][1];
    const cached = getCachedSprite(frame, ZOOM);
    canvas.width = cached.width;
    canvas.height = cached.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cached, 0, 0);
  }, [palette]);
  return (
    <button
      onClick={onClick}
      title={`Скин ${palette + 1}`}
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
        borderRadius: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />
    </button>
  );
}

export interface AgentTemplate {
  name: string;
  description: string;
  prompt: string;
  source: 'workspace' | 'global';
}

interface AgentLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentTemplates: AgentTemplate[];
  workspaceFolders: WorkspaceFolder[];
  defaultBypassPermissions?: boolean;
}

export function AgentLauncherModal({
  isOpen,
  onClose,
  agentTemplates,
  workspaceFolders,
  defaultBypassPermissions = false,
}: AgentLauncherModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [bypassPermissions, setBypassPermissions] = useState(defaultBypassPermissions);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<AgentTemplate | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<number | null>(null);
  const [terminalLocation, setTerminalLocation] = useState<'panel' | 'editor' | 'claude-ui'>(
    'panel',
  );

  // Keep local state in sync when global setting changes
  useEffect(() => {
    setBypassPermissions(defaultBypassPermissions);
  }, [defaultBypassPermissions]);

  const handleLaunch = () => {
    if (terminalLocation === 'claude-ui') {
      vscode.postMessage({ type: 'openClaudeUI' });
    } else {
      const prompt = customPrompt.trim() || (selectedTemplate?.prompt ?? '');
      const msg: Record<string, unknown> = { type: 'openClaude' };
      if (prompt) msg.initialPrompt = prompt;
      if (selectedFolder) msg.folderPath = selectedFolder;
      if (bypassPermissions) msg.bypassPermissions = true;
      if (selectedPalette !== null) msg.initialPalette = selectedPalette;
      msg.terminalLocation = terminalLocation;
      vscode.postMessage(msg);
    }
    // Reset state
    setSelectedTemplate(null);
    setCustomPrompt('');
    setSelectedFolder(null);
    setBypassPermissions(false);
    setSelectedPalette(null);
    onClose();
  };

  const handleSelectTemplate = (tpl: AgentTemplate) => {
    if (selectedTemplate?.name === tpl.name) {
      setSelectedTemplate(null);
      setCustomPrompt('');
    } else {
      setSelectedTemplate(tpl);
      setCustomPrompt(tpl.prompt);
    }
  };

  const handleEditTemplate = (e: MouseEvent, tpl: AgentTemplate) => {
    e.stopPropagation();
    setEditorTemplate(tpl);
    setEditorOpen(true);
  };

  const handleDeleteTemplate = (e: MouseEvent, tpl: AgentTemplate) => {
    e.stopPropagation();
    setConfirmDeleteName(tpl.name);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteName) return;
    const tpl = agentTemplates.find((t) => t.name === confirmDeleteName);
    if (tpl) {
      vscode.postMessage({ type: 'deleteAgentTemplate', name: tpl.name, source: tpl.source });
    }
    if (selectedTemplate?.name === confirmDeleteName) {
      setSelectedTemplate(null);
      setCustomPrompt('');
    }
    setConfirmDeleteName(null);
  };

  const handleNewTemplate = () => {
    setEditorTemplate(null);
    setEditorOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Запустить агента"
        zIndex={60}
        className="min-w-[400px] max-w-[560px]"
      >
        <div
          className="px-10 pb-8 flex flex-col gap-10"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {/* Agent templates */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Шаблоны агентов</span>
              <button
                onClick={handleNewTemplate}
                className="text-xs px-6 py-2 border-2 border-border bg-btn-bg text-text-muted hover:bg-btn-hover hover:text-text cursor-pointer"
                style={{ borderRadius: 0 }}
              >
                + Новый шаблон
              </button>
            </div>
            {agentTemplates.length > 0 && (
              <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto pr-2">
                {agentTemplates.map((tpl) => (
                  <div
                    key={tpl.name}
                    className={`relative border-2 rounded-none ${
                      selectedTemplate?.name === tpl.name
                        ? 'border-accent bg-active-bg'
                        : 'border-border bg-btn-bg hover:bg-btn-hover'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectTemplate(tpl)}
                      className="w-full text-left px-8 py-6 cursor-pointer bg-transparent border-0 pr-28"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-text font-medium">{tpl.name}</span>
                        <span
                          className={`text-xs px-4 py-1 rounded-none ${
                            tpl.source === 'workspace'
                              ? 'bg-accent/15 text-accent-bright'
                              : 'bg-white/5 text-text-muted'
                          }`}
                        >
                          {tpl.source === 'workspace' ? 'проект' : 'глобальный'}
                        </span>
                      </div>
                      {tpl.description && (
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      )}
                    </button>
                    {/* Edit / Delete buttons */}
                    <div className="absolute top-1/2 right-6 -translate-y-1/2 flex gap-2">
                      <button
                        onClick={(e) => handleEditTemplate(e, tpl)}
                        title="Редактировать шаблон"
                        className="text-xs px-4 py-2 border border-border bg-btn-bg text-text-muted hover:text-text hover:bg-btn-hover cursor-pointer"
                        style={{ borderRadius: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteTemplate(e, tpl)}
                        title="Удалить шаблон"
                        className="text-xs px-4 py-2 border border-border bg-btn-bg text-text-muted hover:text-warning hover:border-warning cursor-pointer"
                        style={{ borderRadius: 0 }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {agentTemplates.length === 0 && (
              <p className="text-xs text-text-muted">Шаблонов пока нет. Создайте первый!</p>
            )}
          </div>

          {/* Custom prompt textarea */}
          <div className="flex flex-col gap-4">
            <span className="text-sm text-text-muted">
              {agentTemplates.length > 0 ? 'Промпт (из шаблона или свой)' : 'Промпт для агента'}
            </span>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                if (e.target.value !== selectedTemplate?.prompt) {
                  setSelectedTemplate(null);
                }
              }}
              placeholder="Введите задачу для агента..."
              rows={5}
              className="w-full py-6 px-8 text-sm bg-btn-bg border-2 border-border text-text rounded-none outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Character skin selector */}
          <div className="flex flex-col gap-6">
            <span className="text-sm text-text-muted">Скин персонажа</span>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setSelectedPalette(null)}
                title="Случайный скин"
                style={{
                  background: 'var(--pixel-bg)',
                  border: `2px solid ${selectedPalette === null ? 'var(--color-accent-bright)' : 'var(--color-border)'}`,
                  boxShadow:
                    selectedPalette === null ? '0 0 0 1px var(--color-accent-bright)' : 'none',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  borderRadius: 0,
                }}
              >
                Авто
              </button>
              {Array.from({ length: getLoadedCharacterCount() || PALETTE_COUNT }, (_, i) => (
                <SpritePreview
                  key={i}
                  palette={i}
                  selected={selectedPalette === i}
                  onClick={() => setSelectedPalette(i)}
                />
              ))}
            </div>
          </div>

          {/* Folder selector (multi-root only) */}
          {workspaceFolders.length > 1 && (
            <div className="flex flex-col gap-4">
              <span className="text-sm text-text-muted">Рабочая папка</span>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`px-8 py-4 text-sm border-2 rounded-none cursor-pointer ${
                    selectedFolder === null
                      ? 'border-accent bg-active-bg text-text'
                      : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                  }`}
                >
                  Авто
                </button>
                {workspaceFolders.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFolder(f.path)}
                    className={`px-8 py-4 text-sm border-2 rounded-none cursor-pointer ${
                      selectedFolder === f.path
                        ? 'border-accent bg-active-bg text-text'
                        : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Terminal location */}
          <div className="flex flex-col gap-4">
            <span className="text-sm text-text-muted">Открыть в</span>
            <div className="flex gap-4">
              <button
                onClick={() => setTerminalLocation('panel')}
                title="Открыть в нижней панели терминалов (стандартно)"
                className={`flex-1 py-4 px-6 text-xs border-2 rounded-none cursor-pointer ${
                  terminalLocation === 'panel'
                    ? 'border-accent bg-active-bg text-text'
                    : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                }`}
              >
                ▼ Панели
              </button>
              <button
                onClick={() => setTerminalLocation('editor')}
                title="Открыть как отдельную вкладку в редакторе"
                className={`flex-1 py-4 px-6 text-xs border-2 rounded-none cursor-pointer ${
                  terminalLocation === 'editor'
                    ? 'border-accent bg-active-bg text-text'
                    : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                }`}
              >
                ◱ Вкладке
              </button>
              <button
                onClick={() => setTerminalLocation('claude-ui')}
                title="Открыть через нативный UI Claude Code (требует расширение Claude Code)"
                className={`flex-1 py-4 px-6 text-xs border-2 rounded-none cursor-pointer ${
                  terminalLocation === 'claude-ui'
                    ? 'border-accent bg-active-bg text-text'
                    : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
                }`}
              >
                ✦ Claude UI
              </button>
            </div>
            {terminalLocation === 'claude-ui' && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Сессия откроется в интерфейсе Claude Code. Персонаж появится автоматически — нужно
                включить{' '}
                <span style={{ color: 'var(--color-accent-bright)' }}>Отслеживать все сессии</span>{' '}
                в Настройках или активные хуки (зелёная точка).
              </p>
            )}
          </div>

          {/* Action buttons + bypass permissions */}
          <div className="flex gap-6 pt-2">
            <Button variant="accent" size="md" onClick={handleLaunch} className="flex-1">
              Запустить
            </Button>
            <button
              onClick={() => setBypassPermissions((v) => !v)}
              title="Пропустить все запросы разрешений (опасно)"
              className={`px-8 py-4 text-sm border-2 rounded-none cursor-pointer transition-colors ${
                bypassPermissions
                  ? 'border-warning bg-warning/10 text-warning'
                  : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover hover:border-warning'
              }`}
            >
              ⚠ {bypassPermissions ? 'Без прав ON' : 'Без прав'}
            </button>
            <Button variant="ghost" size="md" onClick={onClose}>
              ✕
            </Button>
          </div>
          {bypassPermissions && (
            <p className="text-xs text-warning/80 text-center -mt-4">
              Агент будет запущен без запросов разрешений
            </p>
          )}
        </div>
      </Modal>

      {/* Template editor sub-modal */}
      <AgentTemplateEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editorTemplate}
      />

      {/* Confirm delete sub-modal */}
      <Modal
        isOpen={confirmDeleteName !== null}
        onClose={() => setConfirmDeleteName(null)}
        title="Удалить шаблон?"
        zIndex={80}
        className="min-w-[320px] max-w-[400px]"
      >
        <div className="px-10 pb-8 flex flex-col gap-8">
          <p className="text-sm text-text">
            Удалить шаблон{' '}
            <span className="text-accent-bright font-medium">{confirmDeleteName}</span>? Это
            действие нельзя отменить.
          </p>
          <div className="flex gap-6">
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-4 px-8 text-sm border-2 border-warning bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              Удалить
            </button>
            <Button variant="ghost" size="md" onClick={() => setConfirmDeleteName(null)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
