"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorWatcherModule = void 0;
const pinus_logger_1 = require("pinus-logger");
const utils = require("../util/utils");
const events_1 = require("../util/events");
const Constants = require("../util/constants");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class MonitorWatcherModule {
    constructor(opts, consoleService) {
        this.app = opts.app;
        this.service = consoleService;
        this.id = this.app.getServerId();
        this.app.event.on(events_1.default.START_SERVER, finishStart.bind(null, this));
    }
    start(cb) {
        subscribeRequest(this, this.service.agent, this.id, cb);
    }
    monitorHandler(agent, msg, cb) {
        if (!msg || !msg.action) {
            return;
        }
        let func = monitorMethods[msg.action];
        if (!func) {
            logger.info('monitorwatcher unknown action: %j', msg.action);
            return;
        }
        func(this, agent, msg, cb);
    }
}
exports.MonitorWatcherModule = MonitorWatcherModule;
MonitorWatcherModule.moduleId = Constants.KEYWORDS.MONITOR_WATCHER;
// ----------------- monitor start method -------------------------
let subscribeRequest = function (self, agent, id, cb) {
    let msg = { action: 'subscribe', id: id };
    agent.request(Constants.KEYWORDS.MASTER_WATCHER, msg, function (err, servers) {
        if (err) {
            logger.error('subscribeRequest request to master with error: %j', err.stack);
            utils.invokeCallback(cb, err);
        }
        let res = [];
        for (let id in servers) {
            res.push(servers[id]);
        }
        addServers(self, res);
        utils.invokeCallback(cb);
    });
};
// ----------------- monitor request methods -------------------------
let addServer = function (self, agent, msg, cb) {
    logger.debug('[%s] receive addServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.server) {
        logger.warn('monitorwatcher addServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    addServers(self, [msg.server]);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
};
let removeServer = function (self, agent, msg, cb) {
    logger.debug('%s receive removeServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.id) {
        logger.warn('monitorwatcher removeServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    removeServers(self, [msg.id]);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
};
let replaceServer = function (self, agent, msg, cb) {
    logger.debug('%s receive replaceServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.servers) {
        logger.warn('monitorwatcher replaceServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    replaceServers(self, msg.servers);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
};
let startOver = function (self, agent, msg, cb) {
    for (let component of self.app.loaded) {
        let fun = component[Constants.RESERVED.AFTER_STARTALL];
        if (!!fun) {
            fun.call(component);
        }
    }
    for (let lifecycle of self.app.usedPlugins) {
        let fun = lifecycle[Constants.LIFECYCLE.AFTER_STARTALL];
        if (!!fun) {
            fun.call(lifecycle, self.app);
        }
    }
    self.app.event.emit(events_1.default.START_ALL);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
};
// ----------------- common methods -------------------------
let addServers = function (self, servers) {
    if (!servers || !servers.length) {
        return;
    }
    self.app.addServers(servers);
};
let removeServers = function (self, ids) {
    if (!ids || !ids.length) {
        return;
    }
    self.app.removeServers(ids);
};
let replaceServers = function (self, servers) {
    self.app.replaceServers(servers);
};
// ----------------- bind methods -------------------------
let finishStart = function (self, id) {
    let msg = { action: 'record', id: id };
    self.service.agent.notify(Constants.KEYWORDS.MASTER_WATCHER, msg);
};
let monitorMethods = {
    'addServer': addServer,
    'removeServer': removeServer,
    'replaceServer': replaceServer,
    'startOver': startOver
};
//# sourceMappingURL=monitorwatcher.js.map