import { useState } from 'react';

import { vscode } from '../vscodeApi.js';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';

interface AgentPromptModalProps {
  agentId: number | null;
  initialPrompt?: string;
  templateName?: string;
  onClose: () => void;
}

export function AgentPromptModal({
  agentId,
  initialPrompt,
  templateName,
  onClose,
}: AgentPromptModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');

  const handleResend = () => {
    if (!agentId || !prompt.trim()) return;
    vscode.postMessage({ type: 'sendAgentMessage', id: agentId, text: prompt.trim() });
    onClose();
  };

  return (
    <Modal
      isOpen={agentId !== null}
      onClose={onClose}
      title={templateName ? `Шаблон: ${templateName}` : 'Шаблон агента'}
      zIndex={70}
      className="min-w-[400px] max-w-[560px]"
    >
      <div className="px-10 pb-8 flex flex-col gap-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          className="w-full py-6 px-8 text-sm bg-btn-bg border-2 border-border text-text rounded-none outline-none focus:border-accent resize-none"
          placeholder="Промпт отсутствует"
        />
        <div className="flex gap-6">
          <Button variant="accent" size="md" onClick={handleResend} className="flex-1">
            Отправить агенту
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
}
