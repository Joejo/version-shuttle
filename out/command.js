'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const vscode = require("vscode");
const path = require("path");
function command(context, directory) {
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
exports.command = command;
//# sourceMappingURL=command.js.map