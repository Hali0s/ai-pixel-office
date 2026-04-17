import type { HookServerStatus, WorkspaceFolder } from '../hooks/useExtensionMessages.js';
import { useLocale } from '../hooks/useLocale.js';
import { Button } from './ui/Button.js';

interface BottomToolbarProps {
  isEditMode: boolean;
  onOpenLauncher: () => void;
  onToggleEditMode: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  onOpenHelp: () => void;
  workspaceFolders: WorkspaceFolder[];
  bypassPermissions: boolean;
  onToggleBypassPermissions: () => void;
  hookServerStatus?: HookServerStatus;
}

export function BottomToolbar({
  isEditMode,
  onOpenLauncher,
  onToggleEditMode,
  isSettingsOpen,
  onToggleSettings,
  onOpenHelp,
  bypassPermissions,
  onToggleBypassPermissions,
  hookServerStatus = 'connected',
}: BottomToolbarProps) {
  const { t } = useLocale();

  const statusDotColor =
    hookServerStatus === 'connected'
      ? 'var(--color-status-ok)'
      : hookServerStatus === 'reconnecting'
        ? 'var(--color-status-warn)'
        : 'var(--color-danger)';

  const statusTitle =
    hookServerStatus === 'connected'
      ? 'Hooks: подключены'
      : hookServerStatus === 'reconnecting'
        ? 'Hooks: переподключение...'
        : 'Hooks: отключены (эвристический режим)';

  return (
    <div className="absolute bottom-10 left-10 z-20 flex items-center gap-4 pixel-panel p-4">
      {/* Hook server status indicator */}
      <div
        title={statusTitle}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: statusDotColor,
          flexShrink: 0,
          boxShadow: hookServerStatus === 'reconnecting' ? `0 0 4px ${statusDotColor}` : 'none',
        }}
      />
      <Button
        variant="accent"
        onClick={onOpenLauncher}
        className="bg-accent hover:bg-accent-bright"
      >
        {t('addAgent')}
      </Button>
      <button
        onClick={onToggleBypassPermissions}
        title={
          bypassPermissions
            ? 'Запросы разрешений ОТКЛЮЧЕНЫ — нажмите чтобы включить'
            : 'Включить режим без запросов разрешений'
        }
        className={`px-6 py-4 text-sm border-2 rounded-none cursor-pointer transition-colors ${
          bypassPermissions
            ? 'border-warning text-warning bg-warning/10 hover:bg-warning/20'
            : 'border-border text-text-muted bg-btn-bg hover:border-warning hover:text-warning'
        }`}
      >
        ⚠
      </button>
      <Button
        variant={isEditMode ? 'active' : 'default'}
        onClick={onToggleEditMode}
        title={t('editOfficeLayout')}
      >
        {t('layout')}
      </Button>
      <Button
        variant={isSettingsOpen ? 'active' : 'default'}
        onClick={onToggleSettings}
        title={t('settings')}
      >
        {t('settings')}
      </Button>
      <button
        onClick={onOpenHelp}
        title="Справка — как пользоваться расширением"
        className="px-5 py-4 text-sm border-2 border-border bg-btn-bg text-text-muted hover:bg-btn-hover hover:text-text rounded-none cursor-pointer"
      >
        ?
      </button>
    </div>
  );
}
