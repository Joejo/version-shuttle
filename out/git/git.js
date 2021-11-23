"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = exports.Git = exports.GitError = void 0;
const cp = require("child_process");
const events_1 = require("events");
const iconv = require("iconv-lite-umd");
const utils_1 = require("../utils");
function sanitizePath(path) {
    return path.replace(/^([a-z]):\\/i, (_, letter) => `${letter.toUpperCase()}:\\`);
}
class GitError {
    constructor(data) {
        if (data.error) {
            this.error = data.error;
            this.message = data.error.message;
        }
        else {
            this.error = undefined;
            this.message = '';
        }
        this.message = this.message || data.message || 'Git error';
        this.stdout = data.stdout;
        this.stderr = data.stderr;
        this.exitCode = data.exitCode;
        this.gitErrorCode = data.gitErrorCode;
        this.gitCommand = data.gitCommand;
        this.gitArgs = data.gitArgs;
    }
    toString() {
        let result = this.message + ' ' + JSON.stringify({
            exitCode: this.exitCode,
            gitErrorCode: this.gitErrorCode,
            gitCommand: this.gitCommand,
            stdout: this.stdout,
            stderr: this.stderr
        }, null, 2);
        if (this.error) {
            result += this.error.stack;
        }
        return result;
    }
}
exports.GitError = GitError;
function cpErrorHandler(cb) {
    return err => {
        if (/ENOENT/.test(err.message)) {
            err = new GitError({
                error: err,
                message: 'Failed to execute git (ENOENT)',
                gitErrorCode: "NotAGitRepository" /* NotAGitRepository */
            });
        }
        cb(err);
    };
}
async function exec(child, cancellationToken) {
    if (!child.stdout || !child.stderr) {
        throw new GitError({ message: 'Failed to get stdout or stderr from git process.' });
    }
    if (cancellationToken && cancellationToken.isCancellationRequested) {
        throw new GitError({ message: 'Cancelled' });
    }
    const disposables = [];
    const once = (ee, name, fn) => {
        ee.once(name, fn);
        disposables.push((0, utils_1.toDisposable)(() => ee.removeListener(name, fn)));
    };
    const on = (ee, name, fn) => {
        ee.on(name, fn);
        disposables.push((0, utils_1.toDisposable)(() => ee.removeListener(name, fn)));
    };
    let result = Promise.all([
        new Promise((c, e) => {
            once(child, 'error', cpErrorHandler(e));
            once(child, 'exit', c);
        }),
        new Promise(c => {
            const buffers = [];
            on(child.stdout, 'data', (b) => buffers.push(b));
            once(child.stdout, 'close', () => c(Buffer.concat(buffers)));
        }),
        new Promise(c => {
            const buffers = [];
            on(child.stderr, 'data', (b) => buffers.push(b));
            once(child.stderr, 'close', () => c(Buffer.concat(buffers).toString('utf8')));
        })
    ]);
    if (cancellationToken) {
        const cancellationPromise = new Promise((_, e) => {
            (0, utils_1.onceEvent)(cancellationToken.onCancellationRequested)(() => {
                try {
                    child.kill();
                }
                catch (err) {
                    // noop
                }
                e(new GitError({ message: 'Cancelled' }));
            });
        });
        result = Promise.race([result, cancellationPromise]);
    }
    try {
        const [exitCode, stdout, stderr] = await result;
        return { exitCode, stdout, stderr };
    }
    finally {
        (0, utils_1.dispose)(disposables);
    }
}
class Git {
    constructor(options) {
        this._onOutput = new events_1.EventEmitter();
        this.path = options.gitPath;
        this.env = options.env || {};
    }
    get onOutput() { return this._onOutput; }
    open(repository, dotGit) {
        return new Repository(this, repository, dotGit);
    }
    async init(repository) {
        await this.exec(repository, ['init']);
        return;
    }
    async exec(cwd, args, options = {}) {
        options = (0, utils_1.assign)({ cwd }, options || {});
        return await this._exec(args, options);
    }
    async _exec(args, options = {}) {
        const child = this.spawn(args, options);
        const bufferResult = await exec(child, options.cancellationToken);
        let encoding = options.encoding || 'utf8';
        const result = {
            exitCode: bufferResult.exitCode,
            stdout: iconv.decode(bufferResult.stdout, encoding),
            stderr: bufferResult.stderr
        };
        return result;
    }
    spawn(args, options = {}) {
        if (!this.path) {
            throw new Error('git could not be found in ths system.');
        }
        if (!options) {
            options = {};
        }
        if (!options.stdio && !options.input) {
            options.stdio = ['ignore', null, null];
        }
        options.env = (0, utils_1.assign)({}, process.env, this.env, options.env || {}, {
            VSCODE_GIT_COMMAND: args[0],
            LC_ALL: 'en_US.UTF-8',
            LANG: 'en_US.UTF-8',
            GIT_PAGER: 'cat'
        });
        if (options.cwd) {
            options.cwd = sanitizePath(options.cwd);
        }
        if (options.log !== false) {
            this.log(`> git ${args.join(' ')}\n`);
        }
        return cp.spawn(this.path, args, options);
    }
    log(output) {
        this._onOutput.emit('log', output);
    }
}
exports.Git = Git;
class Repository {
    constructor(_git, repositoryRoot, dotGit) {
        this._git = _git;
        this.repositoryRoot = repositoryRoot;
        this.dotGit = dotGit;
    }
    get git() {
        return this._git;
    }
    get root() {
        return this.repositoryRoot;
    }
}
exports.Repository = Repository;
//# sourceMappingURL=git.js.map