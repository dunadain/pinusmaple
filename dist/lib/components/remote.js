"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualReloadRemoters = exports.RemoteComponent = void 0;
const pathUtil = require("../util/pathUtil");
const pinus_rpc_1 = require("pinus-rpc");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
/**
 * Remote component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
class RemoteComponent {
    constructor(app, opts) {
        this.app = app;
        this.name = '__remote__';
        opts = opts || {};
        this.opts = opts;
        // cacheMsg is deprecated, just for compatibility here.
        opts.bufferMsg = opts.bufferMsg || opts.cacheMsg || false;
        opts.interval = opts.interval || 30;
        if (app.enabled('rpcDebugLog')) {
            opts.rpcDebugLog = true;
            opts.rpcLogger = (0, pinus_logger_1.getLogger)('rpc-debug', path.basename(__filename));
        }
        opts.relativePath = opts.relativePath || false;
        opts.paths = this.getRemotePaths(opts.relativePath);
        opts.context = this.app;
        let remoters = {};
        opts.services = {};
        opts.services['user'] = remoters;
        let info = this.app.getCurrentServer();
        // 添加插件中的remoter到ServerInfo中
        for (let plugin of this.app.usedPlugins) {
            if (plugin.remoterPath) {
                opts.paths.push({
                    namespace: 'user',
                    serverType: info.serverType,
                    path: plugin.remoterPath
                });
            }
        }
        // 添加路径到ServerInfo中
        info.remoterPaths = opts.paths;
    }
    /**
     * Remote component lifecycle function
     *
     * @param {Function} cb
     * @return {Void}
     */
    async start() {
        this.opts.port = this.app.getCurServer().port;
        this.remote = this.genRemote(this.opts);
        this.remote.start();
    }
    /**
     * Remote component lifecycle function
     *
     * @param {Boolean}  force whether stop the component immediately
     * @param {Function}  cb
     * @return {Void}
     */
    async stop(force) {
        var _a;
        (_a = this.remote) === null || _a === void 0 ? void 0 : _a.stop(force);
    }
    /**
     * Get remote paths from application
     *
     * @param {Boolean} relativePath convert path to relative path
     * @return {Array} paths
     *
     */
    getRemotePaths(relativePath) {
        let paths = [];
        let role;
        // master server should not come here
        if (this.app.isFrontend()) {
            role = 'frontend';
        }
        else {
            role = 'backend';
        }
        let sysPath = pathUtil.getSysRemotePath(role), serverType = this.app.getServerType();
        if (sysPath !== null) {
            paths.push(pathUtil.remotePathRecord('sys', serverType, sysPath, relativePath));
        }
        let userPath = pathUtil.getUserRemotePath(this.app.getBase(), serverType);
        if (userPath !== null) {
            paths.push(pathUtil.remotePathRecord('user', serverType, userPath, relativePath));
        }
        return paths;
    }
    /**
     * Generate remote server instance
     *
     * @param {Object} app current application context
     * @param {Object} opts contructor parameters for rpc Server
     * @return {Object} remote server instance
     */
    genRemote(opts) {
        if (!!opts.rpcServer) {
            return opts.rpcServer.create(opts);
        }
        else {
            return (0, pinus_rpc_1.createServer)(opts);
        }
    }
}
exports.RemoteComponent = RemoteComponent;
function manualReloadRemoters(app) {
    if (!app.components.__remote__) {
        return;
    }
    const remote = app.components.__remote__.remote;
    if (remote && remote['manualReloadRemoters']) {
        remote['manualReloadRemoters']();
    }
    else {
        console.warn('manualReloadRemoters  no method');
    }
}
exports.manualReloadRemoters = manualReloadRemoters;
//# sourceMappingURL=remote.js.map