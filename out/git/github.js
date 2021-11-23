'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGit = void 0;
const git_1 = require("./git");
async function createGit(gitApi, outputChannel) {
    outputChannel.appendLine(`using for from ${gitApi.git.path}`);
    return new git_1.Git({
        gitPath: gitApi.git.path,
        userAgent: '',
        version: '',
    });
}
exports.createGit = createGit;
//# sourceMappingURL=github.js.map