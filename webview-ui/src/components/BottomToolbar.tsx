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
}

export function BottomToolbar({
  isEditMode,
  onOpenLauncher,
  onToggleEditMode,
  isSettingsOpen,
  onToggleSettings,
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
