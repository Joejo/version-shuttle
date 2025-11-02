import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SimpleGit, simpleGit } from 'simple-git';

export class FileExplorer implements vscode.TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | null | void> = new vscode.EventEmitter<Entry | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | null | void> = this._onDidChangeTreeData.event;

	private git: SimpleGit;

	constructor(private context: vscode.ExtensionContext, private workspaceRoot: string) {
		this.git = simpleGit(this.workspaceRoot);
		vscode.commands.registerCommand('fileExplorer.openFile', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('fileExplorer.openTerminal', (resource) => this.openTerminal(resource));
		vscode.commands.registerCommand('fileExplorer.deleteEntry', (resource) => this.deleteEntry(resource));
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.uri, element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		if (element.type === vscode.FileType.File) {
			treeItem.command = { command: 'fileExplorer.openFile', title: "Open File", arguments: [element.uri], };
			treeItem.contextValue = 'file';
		} else if (element.type === vscode.FileType.Directory) {
			treeItem.contextValue = 'directory';
		}
		return treeItem;
	}

	async getChildren(element?: Entry): Promise<Entry[]> {
		const versionsStorePath = path.join(this.workspaceRoot, '_versions-store');
		if (!fs.existsSync(versionsStorePath)) {
			fs.mkdirSync(versionsStorePath, { recursive: true });
		}

		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(element.uri.fsPath, name)), type }));
		}

		const children = await this.readDirectory(vscode.Uri.file(versionsStorePath));
		children.sort((a, b) => {
			if (a[1] === b[1]) {
				return a[0].localeCompare(b[0]);
			}
			return a[1] === vscode.FileType.Directory ? -1 : 1;
		});
		return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(versionsStorePath, name)), type }));
	}

	private async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		const children = await fs.promises.readdir(uri.fsPath, { withFileTypes: true });
		const result: [string, vscode.FileType][] = [];
		for (const child of children) {
			result.push([child.name, child.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File]);
		}
		return result;
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

	private openTerminal(resource: vscode.Uri): void {
		const terminal = vscode.window.createTerminal({
			cwd: resource.fsPath
		});
		terminal.show(false);
	}

	private async deleteEntry(resource: vscode.Uri): Promise<void> {
		const answer = await vscode.window.showWarningMessage(
			"This will remove all files of this branch or this version from your disk and have no rollback options, Please make sure all risks have been identified ?",
			"Yes", "No"
		);

		if (answer === "Yes") {
			try {
				await this.removeVer(resource.fsPath);
				this.refresh();
			} catch (err: any) {
				console.error(err);
				vscode.window.showErrorMessage('remove branch error', err);
			}
		}
	}

	private async removeVer(verPath: string): Promise<void> {
		const verName = path.basename(verPath);
		try {
			await this.git.raw(['worktree', 'remove', verPath]);
			await this.git.raw(['worktree', 'prune']);
			vscode.window.showInformationMessage(`removed ${verName} successfully !`);
		} catch (err: any) {
			vscode.window.showErrorMessage('remove branch error', err);
		}
	}
}

interface Entry {
	uri: vscode.Uri;
	type: vscode.FileType;
}

export namespace _ {

		export function mkdir(path: string): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				fs.mkdir(path, { recursive: true }, (err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}
	}