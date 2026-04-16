import type { WorkspaceFolder } from '../hooks/useExtensionMessages.js';
import { useLocale } from '../hooks/useLocale.js';
import { Button } from './ui/Button.js';

interface BottomToolbarProps {
  isEditMode: boolean;
  onOpenLauncher: () => void;
  onToggleEditMode: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  workspaceFolders: WorkspaceFolder[];
  bypassPermissions: boolean;
  onToggleBypassPermissions: () => void;
}

export function BottomToolbar({
  isEditMode,
  onOpenLauncher,
  onToggleEditMode,
  isSettingsOpen,
  onToggleSettings,
  bypassPermissions,
  onToggleBypassPermissions,
}: BottomToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="absolute bottom-10 left-10 z-20 flex items-center gap-4 pixel-panel p-4">
      <Button
        variant="accent"
        onClick={onOpenLauncher}
        className="bg-accent hover:bg-accent-bright"
      >
        {t('addAgent')}
      </Button>
      <button
        onClick={onToggleBypassPermissions}
        title={bypassPermissions ? 'Запросы разрешений ОТКЛЮЧЕНЫ — нажмите чтобы включить' : 'Включить режим без запросов разрешений'}
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
    </div>
  );
}
