import * as vscode from 'vscode';

export class BranchItems
	implements vscode.TreeDataProvider<BranchItem> {
	constructor(private branches: string[]) {
		this.branches = branches;
	}
	getTreeItem(element: BranchItem): vscode.TreeItem {
		if (element.label !== 'Branch Lists') {
			element.contextValue = 'file';
		}
    return element;
  }

  getChildren(
    element?: BranchItem
	): vscode.ProviderResult<BranchItem[]> {
    if (element) {
      //child node
      const childrenList = [];
      for (let index = 0; index < this.branches.length; index++) {
        const item = new BranchItem(
          '1.0.0',
          this.branches[index],
          vscode.TreeItemCollapsibleState.None
				);
				const branch = this.branches[index];
        item.command = {
          command: 'Branch-Select.chooseBranch', // command id
          title: branch,
          arguments: [branch], // command params
        };
        childrenList[index] = item;
      }
      return childrenList;
    } else {
      // root node
      return [
        new BranchItem(
          '1.0.0',
          'Branch Lists',
          vscode.TreeItemCollapsibleState.Collapsed
        ),
      ];
    }
	}
}

/**
 * @description every branch item
 */
 export class BranchItem extends vscode.TreeItem {
  constructor(
    private version: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    // this.description = `${this.version}-${Math.ceil(Math.random() * 1000)}`
	}
}

