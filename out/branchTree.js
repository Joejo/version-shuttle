"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchTree = void 0;
const vscode = require("vscode");
class BranchTree {
    constructor(context) {
        const view = vscode.window.createTreeView('branchTree', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
        context.subscriptions.push(view);
        vscode.commands.registerCommand('branchTree.reveal', async () => {
            const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
            if (key) {
                await view.reveal({ key }, { focus: true, select: false, expand: true });
            }
        });
        vscode.commands.registerCommand('branchTree.changeTitle', async () => {
            const title = await vscode.window.showInputBox({ prompt: 'Type the new title for the Test View', placeHolder: view.title });
            if (title) {
                view.title = title;
            }
        });
    }
}
exports.BranchTree = BranchTree;
const tree = {
    'a': {
        'aa': {
            'aaa': {
                'aaaa': {
                    'aaaaa': {
                        'aaaaaa': {}
                    }
                }
            }
        },
        'ab': {}
    },
    'b': {
        'ba': {},
        'bb': {}
    }
};
const nodes = {};
function aNodeWithIdTreeDataProvider() {
    return {
        getChildren: (element) => {
            return getChildren(element ? element.key : undefined).map(key => getNode(key));
        },
        getTreeItem: (element) => {
            const treeItem = getTreeItem(element.key);
            treeItem.id = element.key;
            return treeItem;
        },
        getParent: ({ key }) => {
            const parentKey = key.substring(0, key.length - 1);
            return parentKey ? new Key(parentKey) : void 0;
        }
    };
}
function getChildren(key) {
    if (!key) {
        return Object.keys(tree);
    }
    const treeElement = getTreeElement(key);
    if (treeElement) {
        return Object.keys(treeElement);
    }
    return [];
}
function getTreeItem(key) {
    const treeElement = getTreeElement(key);
    // An example of how to use codicons in a MarkdownString in a tree item tooltip.
    const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${key}`, true);
    return {
        label: /**vscode.TreeItemLabel**/ { label: key, highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0 },
        tooltip,
        collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    };
}
function getTreeElement(element) {
    let parent = tree;
    for (let i = 0; i < element.length; i++) {
        parent = parent[element.substring(0, i + 1)];
        if (!parent) {
            return null;
        }
    }
    return parent;
}
function getNode(key) {
    if (!nodes[key]) {
        nodes[key] = new Key(key);
    }
    return nodes[key];
}
class Key {
    constructor(key) {
        this.key = key;
    }
}
//# sourceMappingURL=branchTree.js.map