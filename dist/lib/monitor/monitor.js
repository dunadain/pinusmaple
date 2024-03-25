"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Monitor = void 0;
/**
 * Component for monitor.
 * Load and start monitor client.
 */
const pinus_logger_1 = require("pinus-logger");
const admin = require("pinus-admin");
const moduleUtil = require("../util/moduleUtil");
const utils = require("../util/utils");
const Constants = require("../util/constants");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class Monitor {
    constructor(app, opts) {
        var _a, _b;
        this.modules = [];
        opts = opts || {};
        this.app = app;
        this.serverInfo = app.getCurServer();
        this.masterInfo = app.getMaster();
        this.closeWatcher = opts.closeWatcher;
        this.monitorOpts = {
            id: this.serverInfo.id,
            type: this.app.getServerType(),
            host: (_a = this.masterInfo) === null || _a === void 0 ? void 0 : _a.host,
            port: (_b = this.masterInfo) === null || _b === void 0 ? void 0 : _b.port,
            info: this.serverInfo,
            env: this.app.get(Constants.RESERVED.ENV),
            authServer: app.get('adminAuthServerMonitor'),
            monitorAgentClientFactory: opts.monitorAgentClientFactory
        };
        this.monitorConsole = admin.createMonitorConsole(this.monitorOpts);
    }
    start(cb) {
        moduleUtil.registerDefaultModules(false, this.app, this.closeWatcher);
        this.startConsole(cb);
    }
    startConsole(cb) {
        moduleUtil.loadModules(this, this.monitorConsole);
        let self = this;
        this.monitorConsole.start(function (err) {
            if (err) {
                utils.invokeCallback(cb, err);
                return;
            }
            moduleUtil.startModules(self.modules, function (err) {
                utils.invokeCallback(cb, err);
                return;
            });
        });
        this.monitorConsole.on('error', function (err) {
            if (!!err) {
                logger.error('monitorConsole encounters with error: %j', err.stack);
                return;
            }
        });
    }
    stop(cb) {
        this.monitorConsole.stop();
        this.modules = [];
        process.nextTick(function () {
            utils.invokeCallback(cb);
        });
    }
    // monitor reconnect to master
    reconnect(masterInfo) {
        let self = this;
        this.stop(function () {
            self.monitorOpts.host = masterInfo.host;
            self.monitorOpts.port = masterInfo.port;
            self.monitorConsole = admin.createMonitorConsole(self.monitorOpts);
            self.startConsole(function () {
                logger.info('restart modules for server : %j finish.', self.app.serverId);
            });
        });
    }
}
exports.Monitor = Monitor;
//# sourceMappingURL=monitor.js.map