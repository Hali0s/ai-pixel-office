import * as vscode from 'vscode';

import { AiPixelOfficeViewProvider } from './AiPixelOfficeViewProvider.js';
import { COMMAND_EXPORT_DEFAULT_LAYOUT, COMMAND_SHOW_PANEL, VIEW_ID } from './constants.js';

let providerInstance: AiPixelOfficeViewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log(
    `[AI Pixel Office] AI_PIXEL_OFFICE_DEBUG=${process.env.AI_PIXEL_OFFICE_DEBUG ?? 'not set'}`,
  );
  const provider = new AiPixelOfficeViewProvider(context);
  providerInstance = provider;

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(VIEW_ID, provider));

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_SHOW_PANEL, () => {
      vscode.commands.executeCommand(`${VIEW_ID}.focus`);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_EXPORT_DEFAULT_LAYOUT, () => {
      provider.exportDefaultLayout();
    }),
  );
}

export function deactivate() {
  providerInstance?.dispose();
}
