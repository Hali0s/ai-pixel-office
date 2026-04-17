import { useState } from 'react';

import type { Locale } from '../hooks/useLocale.js';
import { useLocale } from '../hooks/useLocale.js';
import { localeNames } from '../i18n/index.js';
import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { vscode } from '../vscodeApi.js';
import { Button } from './ui/Button.js';
import { Checkbox } from './ui/Checkbox.js';
import { MenuItem } from './ui/MenuItem.js';
import { Modal } from './ui/Modal.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
  hooksEnabled: boolean;
  onToggleHooksEnabled: () => void;
  bypassPermissions: boolean;
  onToggleBypassPermissions: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
  hooksEnabled,
  onToggleHooksEnabled,
  bypassPermissions,
  onToggleBypassPermissions,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);
  const { locale, setLocale, t } = useLocale();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings')}>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'openSessionsFolder' });
          onClose();
        }}
      >
        {t('openSessionsFolder')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'exportLayout' });
          onClose();
        }}
      >
        {t('exportLayout')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'importLayout' });
          onClose();
        }}
      >
        {t('importLayout')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'addExternalAssetDirectory' });
          onClose();
        }}
      >
        {t('addAssetDirectory')}
      </MenuItem>
      {externalAssetDirectories.map((dir) => (
        <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
          <span
            className="text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap"
            title={dir}
          >
            {dir.split(/[/\\]/).pop() ?? dir}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => vscode.postMessage({ type: 'removeExternalAssetDirectory', path: dir })}
            className="shrink-0"
          >
            x
          </Button>
        </div>
      ))}
      <Checkbox
        label={t('soundNotifications')}
        checked={soundLocal}
        onChange={() => {
          const newVal = !isSoundEnabled();
          setSoundEnabled(newVal);
          setSoundLocal(newVal);
          vscode.postMessage({ type: 'setSoundEnabled', enabled: newVal });
        }}
      />
      <Checkbox
        label={t('watchAllSessions')}
        checked={watchAllSessions}
        onChange={onToggleWatchAllSessions}
      />
      <Checkbox
        label={t('instantDetection')}
        checked={hooksEnabled}
        onChange={onToggleHooksEnabled}
      />
      <Checkbox
        label={t('alwaysShowLabels')}
        checked={alwaysShowOverlay}
        onChange={onToggleAlwaysShowOverlay}
      />
      <Checkbox
        label={t('bypassPermissions')}
        checked={bypassPermissions}
        onChange={onToggleBypassPermissions}
      />

      {/* Language switcher */}
      <div className="flex items-center justify-between py-4 px-10 gap-8">
        <span className="text-sm">{t('language')}</span>
        <div className="flex gap-2">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <Button
              key={loc}
              variant={locale === loc ? 'active' : 'default'}
              size="sm"
              onClick={() => setLocale(loc)}
            >
              {localeNames[loc]}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
