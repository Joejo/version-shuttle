'use strict';

import * as vscode from 'vscode';
import path = require('path');

export function command(context: vscode.ExtensionContext, directory: string) {
  let disposable = vscode.commands.registerCommand('terminalHere.create', () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
          return;
      }

      let document = editor.document;
      if (!document) {
          return;
      }

      let uri = document.uri;
      if (!uri) {
          return;
      }

      let terminal = vscode.window.createTerminal({
          cwd: path.dirname(directory)
      });
      terminal.show(false);
  });

  context.subscriptions.push(disposable);
}