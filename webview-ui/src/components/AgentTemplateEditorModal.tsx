import { useEffect, useState } from 'react';

import { vscode } from '../vscodeApi.js';
import type { AgentTemplate } from './AgentLauncherModal.js';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';

interface AgentTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Если передан — режим редактирования, иначе создание нового */
  template?: AgentTemplate | null;
}

type TemplateSource = 'global' | 'workspace';

export function AgentTemplateEditorModal({
  isOpen,
  onClose,
  template,
}: AgentTemplateEditorModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [source, setSource] = useState<TemplateSource>('global');
  const [error, setError] = useState('');

  // Заполняем поля при открытии модалки
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setPrompt(template.prompt);
        setSource(template.source as TemplateSource);
      } else {
        setName('');
        setDescription('');
        setPrompt('');
        setSource('global');
      }
      setError('');
    }
  }, [isOpen, template]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Имя шаблона обязательно');
      return;
    }
    if (!prompt.trim()) {
      setError('System prompt обязателен');
      return;
    }

    const msg: Record<string, unknown> = {
      type: 'saveAgentTemplate',
      name: trimmedName,
      description: description.trim(),
      prompt: prompt.trim(),
      source,
    };
    // При переименовании передаём оригинальное имя
    if (template && template.name !== trimmedName) {
      msg.originalName = template.name;
    }
    vscode.postMessage(msg);
    onClose();
  };

  const isEdit = Boolean(template);
  const title = isEdit ? 'Редактировать шаблон' : 'Новый шаблон агента';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      zIndex={70}
      className="min-w-[460px] max-w-[620px]"
    >
      <div className="px-10 pb-8 flex flex-col gap-8">
        {/* Name */}
        <div className="flex flex-col gap-3">
          <label className="text-sm text-text-muted">Имя шаблона</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Например: Backend Developer"
            className="w-full py-5 px-8 text-sm bg-btn-bg border-2 border-border text-text outline-none focus:border-accent"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-3">
          <label className="text-sm text-text-muted">Описание (необязательно)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание назначения агента"
            className="w-full py-5 px-8 text-sm bg-btn-bg border-2 border-border text-text outline-none focus:border-accent"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* System Prompt */}
        <div className="flex flex-col gap-3">
          <label className="text-sm text-text-muted">System Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError('');
            }}
            placeholder="Введите системный промпт для агента..."
            rows={10}
            className="w-full py-6 px-8 text-sm bg-btn-bg border-2 border-border text-text outline-none focus:border-accent resize-y"
            style={{ borderRadius: 0, minHeight: 140 }}
          />
        </div>

        {/* Source */}
        <div className="flex flex-col gap-3">
          <label className="text-sm text-text-muted">Расположение файла</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSource('global')}
              className={`px-8 py-4 text-sm border-2 cursor-pointer ${
                source === 'global'
                  ? 'border-accent bg-active-bg text-text'
                  : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
              }`}
              style={{ borderRadius: 0 }}
            >
              Глобальный (~/.claude/agents/)
            </button>
            <button
              onClick={() => setSource('workspace')}
              className={`px-8 py-4 text-sm border-2 cursor-pointer ${
                source === 'workspace'
                  ? 'border-accent bg-active-bg text-text'
                  : 'border-border bg-btn-bg text-text-muted hover:bg-btn-hover'
              }`}
              style={{ borderRadius: 0 }}
            >
              Проект (.claude/agents/)
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-warning">{error}</p>}

        {/* Actions */}
        <div className="flex gap-6 pt-2">
          <Button variant="accent" size="md" onClick={handleSave} className="flex-1">
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
