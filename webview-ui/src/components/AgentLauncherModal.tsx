import { useState } from 'react';

import type { WorkspaceFolder } from '../hooks/useExtensionMessages.js';
import { vscode } from '../vscodeApi.js';
import { Modal } from './ui/Modal.js';
import { Button } from './ui/Button.js';

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
}

export function AgentLauncherModal({
  isOpen,
  onClose,
  agentTemplates,
  workspaceFolders,
}: AgentLauncherModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [bypassPermissions, setBypassPermissions] = useState(false);

  const handleLaunch = () => {
    const prompt = customPrompt.trim() || (selectedTemplate?.prompt ?? '');
    const msg: Record<string, unknown> = { type: 'openClaude' };
    if (prompt) msg.initialPrompt = prompt;
    if (selectedFolder) msg.folderPath = selectedFolder;
    if (bypassPermissions) msg.bypassPermissions = true;
    vscode.postMessage(msg);
    // Reset state
    setSelectedTemplate(null);
    setCustomPrompt('');
    setSelectedFolder(null);
    setBypassPermissions(false);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Запустить агента"
      zIndex={60}
      className="min-w-[400px] max-w-[560px]"
    >
      <div className="px-10 pb-8 flex flex-col gap-10">

        {/* Agent templates */}
        {agentTemplates.length > 0 && (
          <div className="flex flex-col gap-6">
            <span className="text-sm text-text-muted">Шаблоны агентов</span>
            <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto pr-2">
              {agentTemplates.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`text-left px-8 py-6 border-2 rounded-none cursor-pointer ${
                    selectedTemplate?.name === tpl.name
                      ? 'border-accent bg-active-bg'
                      : 'border-border bg-btn-bg hover:bg-btn-hover'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-text font-medium">{tpl.name}</span>
                    <span
                      className="text-xs px-4 py-1 rounded-none"
                      style={{
                        background: tpl.source === 'workspace' ? 'rgba(96,48,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: tpl.source === 'workspace' ? '#a07fff' : 'var(--color-text-muted)',
                      }}
                    >
                      {tpl.source === 'workspace' ? 'проект' : 'глобальный'}
                    </span>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">{tpl.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
            style={{ fontFamily: 'inherit' }}
          />
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
  );
}
