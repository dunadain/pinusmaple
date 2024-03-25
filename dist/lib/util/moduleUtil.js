"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDefaultModules = exports.startModules = exports.loadModules = void 0;
const os = require("os");
const admin = require("pinus-admin");
const utils = require("./utils");
const Constants = require("./constants");
const pathUtil = require("./pathUtil");
const starter = require("../master/starter");
const pinus_logger_1 = require("pinus-logger");
const masterwatcher_1 = require("../modules/masterwatcher");
const monitorwatcher_1 = require("../modules/monitorwatcher");
const watchServer_1 = require("../modules/watchServer");
const onlineUser_1 = require("../modules/onlineUser");
const console_1 = require("../modules/console");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Load admin modules
 */
function loadModules(self, consoleService) {
    // load app register modules
    let _modules = self.app.get(Constants.KEYWORDS.MODULE);
    if (!_modules) {
        return;
    }
    let modules = [];
    for (let m in _modules) {
        modules.push(_modules[m]);
    }
    let record, moduleId, module;
    for (let i = 0, l = modules.length; i < l; i++) {
        record = modules[i];
        if (typeof record.module === 'function') {
            module = new record.module(record.opts, consoleService);
        }
        else {
            module = record.module;
        }
        moduleId = record.moduleId || (module === null || module === void 0 ? void 0 : module.moduleId);
        if (!moduleId) {
            logger.warn('ignore an unknown module.');
            continue;
        }
        if (module) {
            consoleService.register(moduleId, module);
            self.modules.push(module);
        }
    }
}
exports.loadModules = loadModules;
function startModules(modules, cb) {
    // invoke the start lifecycle method of modules
    if (!modules) {
        return;
    }
    startModule(undefined, modules, 0, cb);
}
exports.startModules = startModules;
/**
 * Append the default system admin modules
 */
function registerDefaultModules(isMaster, app, closeWatcher) {
    if (!closeWatcher) {
        if (isMaster) {
            app.registerAdmin(masterwatcher_1.MasterWatcherModule, { app: app });
        }
        else {
            app.registerAdmin(monitorwatcher_1.MonitorWatcherModule, { app: app });
        }
    }
    app.registerAdmin(watchServer_1.WatchServerModule, { app: app });
    app.registerAdmin(console_1.ConsoleModule, { app: app, starter: starter });
    if (app.enabled('systemMonitor')) {
        if (os.platform() !== Constants.PLATFORM.WIN) {
            app.registerAdmin(admin.modules.systemInfo);
            app.registerAdmin(admin.modules.nodeInfo);
        }
        app.registerAdmin(onlineUser_1.OnlineUserModule);
        app.registerAdmin(admin.modules.monitorLog, { path: pathUtil.getLogPath(app.getBase()) });
        app.registerAdmin(admin.modules.scripts, { app: app, path: pathUtil.getScriptPath(app.getBase()) });
        if (os.platform() !== Constants.PLATFORM.WIN) {
            app.registerAdmin(admin.modules.profiler);
        }
    }
}
exports.registerDefaultModules = registerDefaultModules;
let startModule = function (err, modules, index, cb) {
    if (err || index >= modules.length) {
        utils.invokeCallback(cb, err);
        return;
    }
    let module = modules[index];
    if (module && typeof module.start === 'function') {
        module.start((err) => {
            startModule(err, modules, index + 1, cb);
        });
    }
    else {
        startModule(err, modules, index + 1, cb);
    }
};
//# sourceMappingURL=moduleUtil.js.map