// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscodeClient from 'vscode';
const vscode = require('vscode');
const path = require('path');
import { BranchItems } from './branches';
import { FileExplorer, _ } from './fileExplorer';
import { BPath } from './typings/git';
const projectRoot = vscode.workspace.rootPath;
const simpleGit = require('simple-git')((projectRoot) ? projectRoot : '.');
const fs = require('fs');
const worktreeRoot = path.resolve(projectRoot);
const worktreePath = path.resolve(projectRoot, '../');
const projectName = worktreeRoot.split('/').pop();
const branchStoreName = '_versions-store';
const branchStore = `${worktreePath}/${branchStoreName}/${projectName}`;
let pathes: BPath[] = [];

export function activate(context: vscodeClient.ExtensionContext) {

	// check if branch exists or not
	fs.open(branchStore, 'r', (err: any) => {
		if (err) {
			if (err.code === 'ENOENT') {
				_.mkdir(branchStore);
				return;
			}
	
			vscode.window.showErrorMessage(err);
		}
	});

	// init branchLists
	vscode.commands.executeCommand('RepoSwitch.listBranch');

	// refresh refreshBranchLists
	vscode.commands.registerCommand('Branch-Select.refreshEntry', () => {
		vscode.commands.executeCommand('RepoSwitch.listBranch');
	});

	// register download branch
/* 	vscode.commands.registerCommand('Branch-Select.downloadBranch', () => {
		vscode.commands.executeCommand('Branch-Select.chooseBranch');
	}); */

	//register choose branch
	new FileExplorer(context, branchStore, refreshBranchLists);
	vscode.commands.registerCommand('Branch-Select.chooseBranch', (args: string) => {
		vscode.window
			.showInformationMessage(
				"Checkout all files of this branch or version ?",
				...["Yes", "No"]
			)
			.then((answer: string) => {
				if (answer === "Yes") {
					const choosedBranch = args.replace(/remotes\/origin\//g, '');
					const folderName = choosedBranch.replace(/\//g, '-');
					const p = `${branchStore}/${folderName}`;
					simpleGit.raw(['worktree', 'add', p, choosedBranch], (err: any, result: any) => {
						if (err) {
							vscode.window.showErrorMessage(err);
							return;
						}

						new FileExplorer(context, branchStore);
						vscode.commands.executeCommand('Branch-Select.refreshEntry');
					});
				}
			});
	});

	// refresh branch lists
	function refreshBranchLists() {
		new FileExplorer(context, branchStore);
	}

	// git channel
	const outputChannel = vscode.window.createOutputChannel('RepoSwitch');
	vscode.commands.registerCommand('RepoSwitch.init', () => {
		if (projectRoot === undefined) {
			vscode.window.showErrorMessage('No directory open. Please open a directory first.');
		} else {
			simpleGit.init(() => {
				vscode.window.showInformationMessage("Initiated git repository at " + projectRoot);
			});
		 }
	});

	vscode.commands.registerCommand('RepoSwitch.listBranch', () => {
		simpleGit.branch('-r',(err: any, result: any) => {
			if (err) {
				vscode.window.showInformationMessage("Initiated git repository at err" + err);	
			}
			if (result) {
				const { all } = result;

				const branchItems = new BranchItems(all);
				vscode.window.registerTreeDataProvider(
					'Branch-Select',
					branchItems
				);
			 }
		});
	});

	// context.subscriptions.push(disposableInit);
	// context.subscriptions.push(disposableBranchAll);
}

export function removeVer(verPath: string, cb: () => void, context: vscodeClient.ExtensionContext) {
	const verName = verPath.split('/').pop();
	simpleGit.raw(['worktree', 'remove', verPath], (err: any, result: any) => {
		if (err) {
			vscode.window.showErrorMessage('remove branch error', err);
			return;
		}

		simpleGit.raw(['worktree', 'prune'], (err: any, result: any) => {
			if (err) {
				vscode.window.showErrorMessage('remove branch error', err);
				return;
			}
			// cb();
			new FileExplorer(context, branchStore);
			vscode.window.showInformationMessage(`removed ${verName} successfully !`);
		});
	});
}
