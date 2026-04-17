import { useCallback, useEffect, useRef, useState } from 'react';

import { toMajorMinor } from './changelogData.js';
import { AgentLauncherModal } from './components/AgentLauncherModal.js';
import { BottomToolbar } from './components/BottomToolbar.js';
import { ChangelogModal } from './components/ChangelogModal.js';
import { CharacterCustomizeModal } from './components/CharacterCustomizeModal.js';
import { ContextMenu } from './components/ContextMenu.js';
import { DebugView } from './components/DebugView.js';
import { EditActionBar } from './components/EditActionBar.js';
import { HelpModal } from './components/HelpModal.js';
import { MigrationNotice } from './components/MigrationNotice.js';
import { RenameModal } from './components/RenameModal.js';
import { SendMessageModal } from './components/SendMessageModal.js';
import { SessionPickerModal } from './components/SessionPickerModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Tooltip } from './components/Tooltip.js';
import { Modal } from './components/ui/Modal.js';
import { VersionIndicator } from './components/VersionIndicator.js';
import { ZoomControls } from './components/ZoomControls.js';
import { useEditorActions } from './hooks/useEditorActions.js';
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js';
import { useExtensionMessages } from './hooks/useExtensionMessages.js';
import { OfficeCanvas } from './office/components/OfficeCanvas.js';
import { ToolOverlay } from './office/components/ToolOverlay.js';
import { EditorState } from './office/editor/editorState.js';
import { EditorToolbar } from './office/editor/EditorToolbar.js';
import { OfficeState } from './office/engine/officeState.js';
import { isRotatable } from './office/layout/furnitureCatalog.js';
import { clearCharacterSpriteCache } from './office/sprites/spriteData.js';
import { EditTool } from './office/types.js';
import { isBrowserRuntime } from './runtime.js';
import { vscode } from './vscodeApi.js';

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null };
const editorState = new EditorState();

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState();
  }
  return officeStateRef.current;
}

function App() {
  // Browser runtime (dev or static dist): dispatch mock messages after the
  // useExtensionMessages listener has been registered.
  useEffect(() => {
    if (isBrowserRuntime) {
      void import('./browserMock.js').then(({ dispatchMockMessages }) => dispatchMockMessages());
    }
  }, []);

  const editor = useEditorActions(getOfficeState, editorState);

  const isEditDirty = useCallback(
    () => editor.isEditMode && editor.isDirty,
    [editor.isEditMode, editor.isDirty],
  );

  const {
    agents,
    selectedAgent,
    agentTools,
    agentStatuses,
    subagentTools,
    subagentCharacters,
    layoutReady,
    layoutWasReset,
    loadedAssets,
    workspaceFolders,
    externalAssetDirectories,
    lastSeenVersion,
    extensionVersion,
    watchAllSessions,
    setWatchAllSessions,
    alwaysShowLabels,
    hooksEnabled,
    setHooksEnabled,
    hooksInfoShown,
    agentTemplates,
    bypassPermissions,
    setBypassPermissions,
    hookServerStatus,
  } = useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty);

  // Show migration notice once layout reset is detected
  const [migrationNoticeDismissed, setMigrationNoticeDismissed] = useState(false);
  const showMigrationNotice = layoutWasReset && !migrationNoticeDismissed;

  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHooksInfoOpen, setIsHooksInfoOpen] = useState(false);
  const [hooksTooltipDismissed, setHooksTooltipDismissed] = useState(false);
  const [isDebugMode] = useState(false);
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [characterModalAgentId, setCharacterModalAgentId] = useState<number | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    agentId: number;
    x: number;
    y: number;
  } | null>(null);

  // Send message modal state
  const [sendMessageAgentId, setSendMessageAgentId] = useState<number | null>(null);

  // Rename modal state
  const [renameAgentId, setRenameAgentId] = useState<number | null>(null);

  // Session picker modal state
  const [sessionPickerAgentId, setSessionPickerAgentId] = useState<number | null>(null);

  const currentMajorMinor = toMajorMinor(extensionVersion);

  const handleWhatsNewDismiss = useCallback(() => {
    vscode.postMessage({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  const handleOpenChangelog = useCallback(() => {
    setIsChangelogOpen(true);
    vscode.postMessage({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  // Sync alwaysShowOverlay from persisted settings
  useEffect(() => {
    setAlwaysShowOverlay(alwaysShowLabels);
  }, [alwaysShowLabels]);

  const handleToggleAlwaysShowOverlay = useCallback(() => {
    setAlwaysShowOverlay((prev) => {
      const newVal = !prev;
      vscode.postMessage({ type: 'setAlwaysShowLabels', enabled: newVal });
      return newVal;
    });
  }, []);

  const handleSelectAgent = useCallback((id: number) => {
    vscode.postMessage({ type: 'focusAgent', id });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0);
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    editor.handleToggleEditMode,
  );

  const handleCloseAgent = useCallback((id: number) => {
    vscode.postMessage({ type: 'closeAgent', id });
  }, []);

  // Open character customization modal on agent click (instead of directly focusing terminal)
  const handleClick = useCallback((agentId: number) => {
    const ch = getOfficeState().characters.get(agentId);
    if (ch?.ghostOf !== undefined) {
      // Ghost sub-agent: focus parent terminal instead of opening modal
      vscode.postMessage({ type: 'focusAgent', id: ch.ghostOf });
      return;
    }
    setCharacterModalAgentId(agentId);
    setIsCharacterModalOpen(true);
  }, []);

  // Context menu on right-click over a character
  const handleAgentContextMenu = useCallback((agentId: number, x: number, y: number) => {
    const ch = getOfficeState().characters.get(agentId);
    if (ch?.ghostOf !== undefined) return; // ghosts have no context menu
    setContextMenu({ agentId, x, y });
  }, []);

  const handleContextMenuClose = useCallback(() => setContextMenu(null), []);

  // Context menu action: open send message modal
  const handleContextMenuSendMessage = useCallback((agentId: number) => {
    setSendMessageAgentId(agentId);
  }, []);

  // Context menu action: open customize modal
  const handleContextMenuCustomize = useCallback((agentId: number) => {
    setCharacterModalAgentId(agentId);
    setIsCharacterModalOpen(true);
  }, []);

  // Context menu action: copy session ID
  const handleContextMenuCopySessionId = useCallback((agentId: number) => {
    const os = getOfficeState();
    const ch = os.characters.get(agentId);
    if (!ch) return;
    // Session ID is stored in the agent's character; look it up from agents list
    // We pass it via a custom postMessage since we don't have direct access here
    vscode.postMessage({ type: 'getAgentSessionId', id: agentId });
    // Fallback: copy agent id as string if no better data
    void navigator.clipboard.writeText(String(agentId)).catch(() => undefined);
  }, []);

  // Context menu action: attach to session
  const handleContextMenuAttachSession = useCallback((agentId: number) => {
    setSessionPickerAgentId(agentId);
  }, []);

  // Context menu action: hide character (terminal keeps running)
  const handleContextMenuHideAgent = useCallback((agentId: number) => {
    vscode.postMessage({ type: 'hideAgent', id: agentId });
  }, []);

  // Context menu action: close/terminate agent
  const handleContextMenuCloseAgent = useCallback((agentId: number) => {
    vscode.postMessage({ type: 'closeAgent', id: agentId });
  }, []);

  // Context menu action: rename agent
  const handleContextMenuRename = useCallback((agentId: number) => {
    setRenameAgentId(agentId);
  }, []);

  // Send message handler
  const handleSendMessage = useCallback((agentId: number, text: string) => {
    vscode.postMessage({ type: 'sendAgentMessage', id: agentId, text });
  }, []);

  // Rename handler
  const handleRename = useCallback((agentId: number, name: string) => {
    const os = getOfficeState();
    const ch = os.characters.get(agentId);
    if (ch) {
      ch.customName = name || undefined;
    }
    // Persist all agent seats so customName survives reload
    const seats: Record<
      number,
      {
        palette: number;
        hueShift: number;
        seatId: string | null;
        customName?: string;
        isPanda?: boolean;
        gender?: string;
        idlePreference?: string;
      }
    > = {};
    for (const c of os.characters.values()) {
      if (c.isSubagent || c.ghostOf !== undefined) continue;
      seats[c.id] = {
        palette: c.palette,
        hueShift: c.hueShift,
        seatId: c.seatId,
        customName: c.customName,
        isPanda: c.isPanda,
        gender: c.gender,
        idlePreference: c.idlePreference,
      };
    }
    vscode.postMessage({ type: 'saveAgentSeats', seats });
  }, []);

  // Focus terminal from inside the modal
  const handleFocusTerminal = useCallback((agentId: number) => {
    const os = getOfficeState();
    const meta = os.subagentMeta.get(agentId);
    const focusId = meta ? meta.parentAgentId : agentId;
    vscode.postMessage({ type: 'focusAgent', id: focusId });
    setIsCharacterModalOpen(false);
  }, []);

  // Save character customization and persist
  const handleCharacterSave = useCallback(
    (
      id: number,
      opts: {
        customName: string;
        palette: number;
        hueShift: number;
        isPanda: boolean;
        gender: string;
        idlePreference: string;
      },
    ) => {
      const os = getOfficeState();
      os.setCharacterCustomization(id, opts);
      // Palette or panda mode changed — clear sprite cache so new sprites are generated
      clearCharacterSpriteCache();
      // Persist all agent customization to workspace state
      const seats: Record<
        number,
        {
          palette: number;
          hueShift: number;
          seatId: string | null;
          customName?: string;
          isPanda?: boolean;
          gender?: string;
          idlePreference?: string;
        }
      > = {};
      for (const ch of os.characters.values()) {
        if (ch.isSubagent || ch.ghostOf !== undefined) continue;
        seats[ch.id] = {
          palette: ch.palette,
          hueShift: ch.hueShift,
          seatId: ch.seatId,
          customName: ch.customName,
          isPanda: ch.isPanda,
          gender: ch.gender,
          idlePreference: ch.idlePreference,
        };
      }
      vscode.postMessage({ type: 'saveAgentSeats', seats });
      setIsCharacterModalOpen(false);
    },
    [],
  );

  const officeState = getOfficeState();

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard;

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint =
    editor.isEditMode &&
    (() => {
      if (editorState.selectedFurnitureUid) {
        const item = officeState
          .getLayout()
          .furniture.find((f) => f.uid === editorState.selectedFurnitureUid);
        if (item && isRotatable(item.type)) return true;
      }
      if (
        editorState.activeTool === EditTool.FURNITURE_PLACE &&
        isRotatable(editorState.selectedFurnitureType)
      ) {
        return true;
      }
      return false;
    })();

  // Derive display name for send-message modal title
  const sendMessageDisplayName = (() => {
    if (sendMessageAgentId === null) return '';
    const ch = officeState.characters.get(sendMessageAgentId);
    return ch?.customName ?? ch?.agentName ?? `Агент #${sendMessageAgentId}`;
  })();

  // Derive current name for rename modal
  const renameCurrentName = (() => {
    if (renameAgentId === null) return '';
    const ch = officeState.characters.get(renameAgentId);
    return ch?.customName ?? '';
  })();

  if (!layoutReady) {
    return <div className="w-full h-full flex items-center justify-center ">Загрузка...</div>;
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <OfficeCanvas
        officeState={officeState}
        onClick={handleClick}
        onAgentContextMenu={handleAgentContextMenu}
        isEditMode={editor.isEditMode}
        editorState={editorState}
        onEditorTileAction={editor.handleEditorTileAction}
        onEditorEraseAction={editor.handleEditorEraseAction}
        onEditorSelectionChange={editor.handleEditorSelectionChange}
        onDeleteSelected={editor.handleDeleteSelected}
        onRotateSelected={editor.handleRotateSelected}
        onDragMove={editor.handleDragMove}
        editorTick={editor.editorTick}
        zoom={editor.zoom}
        onZoomChange={editor.handleZoomChange}
        panRef={editor.panRef}
      />

      {!isDebugMode ? (
        <>
          <ZoomControls zoom={editor.zoom} onZoomChange={editor.handleZoomChange} />

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'var(--vignette)' }}
          />

          {editor.isEditMode && editor.isDirty && (
            <EditActionBar editor={editor} editorState={editorState} />
          )}

          {showRotateHint && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-11 bg-accent-bright text-white text-sm py-3 px-8 rounded-none border-2 border-accent shadow-pixel pointer-events-none whitespace-nowrap"
              style={{ top: editor.isDirty ? 64 : 8 }}
            >
              Rotate (R)
            </div>
          )}

          {editor.isEditMode &&
            (() => {
              const selUid = editorState.selectedFurnitureUid;
              const selColor = selUid
                ? (officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null)
                : null;
              return (
                <EditorToolbar
                  activeTool={editorState.activeTool}
                  selectedTileType={editorState.selectedTileType}
                  selectedFurnitureType={editorState.selectedFurnitureType}
                  selectedFurnitureUid={selUid}
                  selectedFurnitureColor={selColor}
                  floorColor={editorState.floorColor}
                  wallColor={editorState.wallColor}
                  selectedWallSet={editorState.selectedWallSet}
                  onToolChange={editor.handleToolChange}
                  onTileTypeChange={editor.handleTileTypeChange}
                  onFloorColorChange={editor.handleFloorColorChange}
                  onWallColorChange={editor.handleWallColorChange}
                  onWallSetChange={editor.handleWallSetChange}
                  onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
                  onFurnitureTypeChange={editor.handleFurnitureTypeChange}
                  loadedAssets={loadedAssets}
                />
              );
            })()}

          <ToolOverlay
            officeState={officeState}
            agents={agents}
            agentTools={agentTools}
            subagentCharacters={subagentCharacters}
            containerRef={containerRef}
            zoom={editor.zoom}
            panRef={editor.panRef}
            onCloseAgent={handleCloseAgent}
            alwaysShowOverlay={alwaysShowOverlay}
          />
        </>
      ) : (
        <DebugView
          agents={agents}
          selectedAgent={selectedAgent}
          agentTools={agentTools}
          agentStatuses={agentStatuses}
          subagentTools={subagentTools}
          onSelectAgent={handleSelectAgent}
        />
      )}

      {/* Hooks first-run tooltip */}
      {!hooksInfoShown && !hooksTooltipDismissed && (
        <Tooltip
          title="Мгновенное обнаружение активно"
          position="top-right"
          onDismiss={() => {
            setHooksTooltipDismissed(true);
            vscode.postMessage({ type: 'setHooksInfoShown' });
          }}
        >
          <span className="text-sm text-text leading-none">
            Агенты реагируют в реальном времени.{' '}
            <span
              className="text-accent cursor-pointer underline"
              onClick={() => {
                setIsHooksInfoOpen(true);
                setHooksTooltipDismissed(true);
                vscode.postMessage({ type: 'setHooksInfoShown' });
              }}
            >
              Подробнее
            </span>
          </span>
        </Tooltip>
      )}

      {/* Hooks info modal */}
      <Modal
        isOpen={isHooksInfoOpen}
        onClose={() => setIsHooksInfoOpen(false)}
        title="Мгновенное обнаружение включено"
        zIndex={52}
      >
        <div className="text-base text-text px-10" style={{ lineHeight: 1.4 }}>
          <p className="mb-8">Ваш AI Pixel Office теперь реагирует в реальном времени:</p>
          <ul className="mb-8 pl-18 list-disc m-0">
            <li className="text-sm mb-2">Запросы разрешений появляются мгновенно</li>
            <li className="text-sm mb-2">Завершение хода определяется в ту же секунду</li>
            <li className="text-sm mb-2">Звуковые уведомления воспроизводятся немедленно</li>
          </ul>
          <p className="mb-12 text-text-muted">
            Работает через хуки Claude Code — небольшие обработчики событий, которые уведомляют AI
            Pixel Office о происходящем в ваших сессиях.
          </p>
          <div className="text-center">
            <button
              onClick={() => setIsHooksInfoOpen(false)}
              className="py-4 px-20 text-lg bg-accent text-white border-2 border-accent rounded-none cursor-pointer shadow-pixel"
            >
              Понятно
            </button>
          </div>
          <p className="mt-8 text-xs text-text-muted text-center">
            Отключить: Настройки {'>'} Мгновенное обнаружение
          </p>
        </div>
      </Modal>

      <BottomToolbar
        isEditMode={editor.isEditMode}
        onOpenLauncher={() => setIsLauncherOpen(true)}
        onToggleEditMode={editor.handleToggleEditMode}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((v) => !v)}
        onOpenHelp={() => setIsHelpOpen(true)}
        workspaceFolders={workspaceFolders}
        bypassPermissions={bypassPermissions}
        onToggleBypassPermissions={() => {
          const newVal = !bypassPermissions;
          setBypassPermissions(newVal);
          vscode.postMessage({ type: 'setBypassPermissions', enabled: newVal });
        }}
        hookServerStatus={hookServerStatus}
      />

      <VersionIndicator
        currentVersion={extensionVersion}
        lastSeenVersion={lastSeenVersion}
        onDismiss={handleWhatsNewDismiss}
        onOpenChangelog={handleOpenChangelog}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        currentVersion={extensionVersion}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        alwaysShowOverlay={alwaysShowOverlay}
        onToggleAlwaysShowOverlay={handleToggleAlwaysShowOverlay}
        externalAssetDirectories={externalAssetDirectories}
        watchAllSessions={watchAllSessions}
        onToggleWatchAllSessions={() => {
          const newVal = !watchAllSessions;
          setWatchAllSessions(newVal);
          vscode.postMessage({ type: 'setWatchAllSessions', enabled: newVal });
        }}
        hooksEnabled={hooksEnabled}
        onToggleHooksEnabled={() => {
          const newVal = !hooksEnabled;
          setHooksEnabled(newVal);
          vscode.postMessage({ type: 'setHooksEnabled', enabled: newVal });
        }}
        bypassPermissions={bypassPermissions}
        onToggleBypassPermissions={() => {
          const newVal = !bypassPermissions;
          setBypassPermissions(newVal);
          vscode.postMessage({ type: 'setBypassPermissions', enabled: newVal });
        }}
      />

      {showMigrationNotice && (
        <MigrationNotice onDismiss={() => setMigrationNoticeDismissed(true)} />
      )}

      <AgentLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        agentTemplates={agentTemplates}
        workspaceFolders={workspaceFolders}
        defaultBypassPermissions={bypassPermissions}
      />

      <CharacterCustomizeModal
        isOpen={isCharacterModalOpen}
        agentId={characterModalAgentId}
        officeState={officeState}
        onClose={() => setIsCharacterModalOpen(false)}
        onSave={handleCharacterSave}
        onFocusTerminal={handleFocusTerminal}
      />

      {/* Context menu */}
      {contextMenu !== null && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          agentId={contextMenu.agentId}
          folderPath={(() => {
            const ch = getOfficeState().characters.get(contextMenu.agentId);
            return ch?.folderName;
          })()}
          onClose={handleContextMenuClose}
          onSendMessage={handleContextMenuSendMessage}
          onCustomize={handleContextMenuCustomize}
          onCopySessionId={handleContextMenuCopySessionId}
          onAttachSession={handleContextMenuAttachSession}
          onHideAgent={handleContextMenuHideAgent}
          onCloseAgent={handleContextMenuCloseAgent}
          onRename={handleContextMenuRename}
        />
      )}

      {/* Send message modal */}
      <SendMessageModal
        agentId={sendMessageAgentId}
        agentDisplayName={sendMessageDisplayName}
        onClose={() => setSendMessageAgentId(null)}
        onSend={handleSendMessage}
      />

      {/* Rename modal */}
      <RenameModal
        agentId={renameAgentId}
        currentName={renameCurrentName}
        onClose={() => setRenameAgentId(null)}
        onRename={handleRename}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <SessionPickerModal
        agentId={sessionPickerAgentId}
        onClose={() => setSessionPickerAgentId(null)}
      />
    </div>
  );
}

export default App;
