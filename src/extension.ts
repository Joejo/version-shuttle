// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit from 'simple-git';
import { BranchItems } from './branches';
import { FileExplorer, _ } from './fileExplorer';


export function activate(context: vscode.ExtensionContext) {
	console.log('Version Shuttle is now active!');
	const projectRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: undefined;

	if (!projectRoot) {
		vscode.window.showErrorMessage('No directory open. Please open a directory first.');
		return;
	}

	const git = simpleGit(projectRoot);
	const worktreeRoot = path.resolve(projectRoot);
	const worktreePath = path.resolve(projectRoot, '../');
	const projectName = worktreeRoot.split('/').pop();
	const branchStoreName = '_versions-store';
	const branchStore = `${worktreePath}/${branchStoreName}/${projectName}`;

	// check if branch exists or not
	if (!fs.existsSync(branchStore)) {
		_.mkdir(branchStore);
	}

	const branchItems = new BranchItems(git);
	vscode.window.registerTreeDataProvider('Branch-Select', branchItems);

	const fileExplorer = new FileExplorer(context, branchStore);
	vscode.window.registerTreeDataProvider('fileExplorer', fileExplorer);

	// refresh refreshBranchLists
	const disposableRegresh = vscode.commands.registerCommand('Branch-Select.refreshEntry', () => {
		branchItems.refresh();
		fileExplorer.refresh();
	});

	//register choose branch
	const disposableChoose = vscode.commands.registerCommand('Branch-Select.chooseBranch', async (args: string) => {
		const answer = await vscode.window
			.showInformationMessage(
				"Checkout all files of this branch or version ?",
				...["Yes", "No"]
			);

		if (answer === "Yes") {
			try {
				const choosedBranch = args.replace(/remotes\/origin\//g, '');
				const folderName = choosedBranch.replace(/\//g, '-');
				const p = `${branchStore}/${folderName}`;
				await git.raw(['worktree', 'add', p, choosedBranch]);
				fileExplorer.refresh();
				vscode.window.showInformationMessage(`Branch ${choosedBranch} checked out successfully.`);
			} catch (err: any) {
				vscode.window.showErrorMessage(err);
			}
		}
	});

	// git channel
	const outputChannel = vscode.window.createOutputChannel('RepoSwitch');
	const disposableInit = vscode.commands.registerCommand('RepoSwitch.init', async () => {
		try {
			await git.init();
			vscode.window.showInformationMessage("Initiated git repository at " + projectRoot);
		} catch (err: any) {
			vscode.window.showErrorMessage(err);
		}
	});

	context.subscriptions.push(disposableInit, disposableRegresh, disposableChoose);
}

export async function removeVer(verPath: string, context: vscode.ExtensionContext) {
	const verName = verPath.split('/').pop();
	const projectRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: undefined;

	if (!projectRoot) {
		vscode.window.showErrorMessage('No directory open. Please open a directory first.');
		return;
	}
	const git = simpleGit(projectRoot);

	try {
		await git.raw(['worktree', 'remove', verPath]);
		await git.raw(['worktree', 'prune']);
		vscode.window.showInformationMessage(`removed ${verName} successfully !`);
	} catch (err: any) {
		vscode.window.showErrorMessage('remove branch error', err);
	}
}
