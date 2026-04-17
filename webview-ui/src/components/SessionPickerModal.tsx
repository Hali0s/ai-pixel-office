import { useEffect, useState } from 'react';

import { vscode } from '../vscodeApi.js';
import { Modal } from './ui/Modal.js';

interface AgentEntry {
  id: number;
  folderName?: string;
  projectDir: string;
  isExternal: boolean;
}

interface SessionPickerModalProps {
  agentId: number | null;
  onClose: () => void;
}

export function SessionPickerModal({ agentId, onClose }: SessionPickerModalProps) {
  const [agents, setAgents] = useState<AgentEntry[]>([]);

  useEffect(() => {
    if (agentId === null) return;
    vscode.postMessage({ type: 'requestAgentsList' });

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'agentsList') {
        setAgents((e.data.agents as AgentEntry[]).filter((a) => a.id !== agentId));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [agentId]);

  const handlePick = (target: AgentEntry) => {
    vscode.postMessage({
      type: 'updateAgentFolder',
      id: agentId,
      folderName: target.folderName ?? target.projectDir.split(/[/\\]/).pop(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={agentId !== null}
      onClose={onClose}
      title="Привязать к сессии"
      zIndex={70}
      className="min-w-[320px] max-w-[460px]"
    >
      <div
        className="px-10 pb-8 flex flex-col gap-4"
        style={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        {agents.length === 0 ? (
          <p className="text-sm text-text-muted py-4">Нет других активных сессий.</p>
        ) : (
          agents.map((a) => {
            const name = a.folderName ?? a.projectDir.split(/[/\\]/).pop() ?? `Агент #${a.id}`;
            return (
              <button
                key={a.id}
                onClick={() => handlePick(a)}
                className="flex flex-col items-start gap-1 px-8 py-6 border-2 border-border bg-btn-bg hover:bg-btn-hover text-left cursor-pointer rounded-none w-full"
              >
                <span className="text-sm text-text">{name}</span>
                <span className="text-xs text-text-muted">{a.projectDir}</span>
                {a.isExternal && (
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    внешняя сессия
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
