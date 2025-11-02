import * as vscode from 'vscode';
import { SimpleGit } from 'simple-git';

export class BranchItems implements vscode.TreeDataProvider<BranchItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<BranchItem | undefined | null | void> = new vscode.EventEmitter<BranchItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<BranchItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(private git: SimpleGit) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: BranchItem): vscode.TreeItem {
		if (element.label !== 'Branch Lists') {
			element.contextValue = 'file';
		}
		return element;
	}

	async getChildren(element?: BranchItem): Promise<BranchItem[]> {
		if (element) {
			const branches = await this.getBranches();
			return branches.map(branch => {
				const item = new BranchItem('1.0.0', branch, vscode.TreeItemCollapsibleState.None);
				item.command = {
					command: 'Branch-Select.chooseBranch',
					title: branch,
					arguments: [branch],
				};
				return item;
			});
		} else {
			return [new BranchItem('1.0.0', 'Branch Lists', vscode.TreeItemCollapsibleState.Collapsed)];
		}
	}

	private async getBranches(): Promise<string[]> {
		try {
			const result = await this.git.branch(['-r']);
			return result.all;
		} catch (err: any) {
			vscode.window.showWarningMessage("Error fetching branches: " + err);
			return [];
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
	}
}
