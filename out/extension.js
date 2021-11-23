"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeVer = exports.activate = void 0;
const vscode = require('vscode');
const path = require('path');
const branches_1 = require("./branches");
const fileExplorer_1 = require("./fileExplorer");
const projectRoot = vscode.workspace.rootPath;
const simpleGit = require('simple-git')((projectRoot) ? projectRoot : '.');
const fs = require('fs');
const worktreeRoot = path.resolve(projectRoot);
const worktreePath = path.resolve(projectRoot, '../');
const projectName = worktreeRoot.split('/').pop();
const branchStoreName = '_versions-store';
const branchStore = `${worktreePath}/${branchStoreName}/${projectName}`;
let pathes = [];
function activate(context) {
    // check if branch exists or not
    fs.open(branchStore, 'r', (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                fileExplorer_1._.mkdir(branchStore);
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
    new fileExplorer_1.FileExplorer(context, branchStore, refreshBranchLists);
    vscode.commands.registerCommand('Branch-Select.chooseBranch', (args) => {
        vscode.window
            .showInformationMessage("Checkout all files of this branch or version ?", ...["Yes", "No"])
            .then((answer) => {
            if (answer === "Yes") {
                const choosedBranch = args.replace(/remotes\/origin\//g, '');
                const folderName = choosedBranch.replace(/\//g, '-');
                const p = `${branchStore}/${folderName}`;
                simpleGit.raw(['worktree', 'add', p, choosedBranch], (err, result) => {
                    if (err) {
                        vscode.window.showErrorMessage(err);
                        return;
                    }
                    new fileExplorer_1.FileExplorer(context, branchStore);
                    vscode.commands.executeCommand('Branch-Select.refreshEntry');
                });
            }
        });
    });
    // refresh branch lists
    function refreshBranchLists() {
        new fileExplorer_1.FileExplorer(context, branchStore);
    }
    // git channel
    const outputChannel = vscode.window.createOutputChannel('RepoSwitch');
    vscode.commands.registerCommand('RepoSwitch.init', () => {
        if (projectRoot === undefined) {
            vscode.window.showErrorMessage('No directory open. Please open a directory first.');
        }
        else {
            simpleGit.init(() => {
                vscode.window.showInformationMessage("Initiated git repository at " + projectRoot);
            });
        }
    });
    vscode.commands.registerCommand('RepoSwitch.listBranch', () => {
        simpleGit.branch('-r', (err, result) => {
            if (err) {
                vscode.window.showInformationMessage("Initiated git repository at err" + err);
            }
            if (result) {
                const { all } = result;
                const branchItems = new branches_1.BranchItems(all);
                vscode.window.registerTreeDataProvider('Branch-Select', branchItems);
            }
        });
    });
    // context.subscriptions.push(disposableInit);
    // context.subscriptions.push(disposableBranchAll);
}
exports.activate = activate;
function removeVer(verPath, cb, context) {
    const verName = verPath.split('/').pop();
    simpleGit.raw(['worktree', 'remove', verPath], (err, result) => {
        if (err) {
            vscode.window.showErrorMessage('remove branch error', err);
            return;
        }
        simpleGit.raw(['worktree', 'prune'], (err, result) => {
            if (err) {
                vscode.window.showErrorMessage('remove branch error', err);
                return;
            }
            // cb();
            new fileExplorer_1.FileExplorer(context, branchStore);
            vscode.window.showInformationMessage(`removed ${verName} successfully !`);
        });
    });
}
exports.removeVer = removeVer;
//# sourceMappingURL=extension.js.map