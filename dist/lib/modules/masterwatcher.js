"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterWatcherModule = void 0;
const pinus_logger_1 = require("pinus-logger");
const utils = require("../util/utils");
const Constants = require("../util/constants");
const watchdog_1 = require("../master/watchdog");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class MasterWatcherModule {
    constructor(opts, consoleService) {
        this.app = opts.app;
        this.service = consoleService;
        this.id = this.app.getServerId();
        this.watchdog = new watchdog_1.Watchdog(this.app, this.service);
        this.service.on('register', this.onServerAdd.bind(this));
        this.service.on('disconnect', this.onServerLeave.bind(this));
        this.service.on('reconnect', this.onServerReconnect.bind(this));
    }
    // ----------------- bind methods -------------------------
    onServerAdd(record) {
        logger.debug('masterwatcher receive add server event, with server: %j', record);
        if (!record || record.type === 'client' || !record.serverType) {
            return;
        }
        this.watchdog.addServer(record);
    }
    onServerReconnect(record) {
        logger.debug('masterwatcher receive reconnect server event, with server: %j', record);
        if (!record || record.type === 'client' || !record.serverType) {
            logger.warn('onServerReconnect receive wrong message: %j', record);
            return;
        }
        this.watchdog.reconnectServer(record);
    }
    onServerLeave(id, type) {
        logger.debug('masterwatcher receive remove server event, with server: %s, type: %s', id, type);
        if (!id) {
            logger.warn('onServerLeave receive server id is empty.');
            return;
        }
        if (type !== 'client') {
            this.watchdog.removeServer(id);
        }
    }
    // ----------------- module methods -------------------------
    start(cb) {
        utils.invokeCallback(cb);
    }
    masterHandler(agent, msg, cb) {
        if (!msg) {
            logger.warn('masterwatcher receive empty message.');
            return;
        }
        let func = masterMethods[msg.action];
        if (!func) {
            logger.info('masterwatcher unknown action: %j', msg.action);
            return;
        }
        func(this, agent, msg, cb);
    }
}
exports.MasterWatcherModule = MasterWatcherModule;
MasterWatcherModule.moduleId = Constants.KEYWORDS.MASTER_WATCHER;
// ----------------- monitor request methods -------------------------
let subscribe = function (module, agent, msg, cb) {
    if (!msg) {
        utils.invokeCallback(cb, new Error('masterwatcher subscribe empty message.'));
        return;
    }
    module.watchdog.subscribe(msg.id);
    utils.invokeCallback(cb, null, module.watchdog.query());
};
let unsubscribe = function (module, agent, msg, cb) {
    if (!msg) {
        utils.invokeCallback(cb, new Error('masterwatcher unsubscribe empty message.'));
        return;
    }
    module.watchdog.unsubscribe(msg.id);
    utils.invokeCallback(cb);
};
let query = function (module, agent, msg, cb) {
    utils.invokeCallback(cb, null, module.watchdog.query());
};
let record = function (module, agent, msg, cb) {
    if (!msg) {
        utils.invokeCallback(cb, new Error('masterwatcher record empty message.'));
        return;
    }
    module.watchdog.record(msg.id);
};
let masterMethods = {
    'subscribe': subscribe,
    'unsubscribe': unsubscribe,
    'query': query,
    'record': record
};
//# sourceMappingURL=masterwatcher.js.map