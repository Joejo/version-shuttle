"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchItem = exports.BranchItems = void 0;
const vscode = require("vscode");
class BranchItems {
    constructor(branches) {
        this.branches = branches;
        this.branches = branches;
    }
    getTreeItem(element) {
        if (element.label !== 'Branch Lists') {
            element.contextValue = 'file';
        }
        return element;
    }
    getChildren(element) {
        if (element) {
            //child node
            var childrenList = [];
            for (let index = 0; index < this.branches.length; index++) {
                var item = new BranchItem('1.0.0', this.branches[index], vscode.TreeItemCollapsibleState.None);
                const branch = this.branches[index];
                item.command = {
                    command: 'Branch-Select.chooseBranch',
                    title: branch,
                    arguments: [branch], // command params
                };
                childrenList[index] = item;
            }
            return childrenList;
        }
        else {
            // root node
            return [
                new BranchItem('1.0.0', 'Branch Lists', vscode.TreeItemCollapsibleState.Collapsed),
            ];
        }
    }
}
exports.BranchItems = BranchItems;
/**
 * @description every branch item
 */
class BranchItem extends vscode.TreeItem {
    constructor(version, label, collapsibleState) {
        super(label, collapsibleState);
        this.version = version;
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label}-${this.version}`;
        // this.description = `${this.version}-${Math.ceil(Math.random() * 1000)}`
    }
}
exports.BranchItem = BranchItem;
//# sourceMappingURL=branches.js.map