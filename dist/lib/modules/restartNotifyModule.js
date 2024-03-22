"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestartNotifyModule = void 0;
const path = require("path");
const pinus_logger_1 = require("pinus-logger");
const constants_1 = require("../util/constants");
const index_1 = require("../index");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
// 单个进程重启通知 afterStartAll 生命周期事件。
class RestartNotifyModule {
    constructor(opts, consoleService) {
        this.removedServers = {};
        this._addEvent = this.onAddServers.bind(this);
        this._removeEvent = this.onRemoveServers.bind(this);
        this.afterStartCallBack = null;
        this.afterStartCalled = false;
        this.app = opts.app;
        this.service = consoleService;
    }
    // ----------------- bind methods -------------------------
    onAddServers(servers) {
        if (!servers || !servers.length) {
            return;
        }
        servers.forEach(val => this.onServerAdd(val));
    }
    onRemoveServers(ids) {
        if (ids && ids.length) {
            // 避免有重复通知的问题。
            this._masterWatcherModule.watchdog.isStarted = true;
            this._masterWatcherModule.watchdog.count = -1;
            ids.forEach(val => this.onServerLeave(val));
        }
    }
    onServerAdd(record) {
        if (this.removedServers[record.id]) {
            this.removedServers[record.id] = false;
            // TOxDO notify afterStartAll
            const masterAgent = this.service.agent;
            logger.warn('notify afterStartAll ', record.id);
            process.nextTick(() => {
                masterAgent.request(record.id, 'RestartNotifyModule', { action: 'afterStartCallback' }, (err, body) => {
                    logger.warn('RestartNotifyModule notify RestartNotifyModule afterStart:', record.id, err, body);
                    // 通知startOver
                    masterAgent.request(record.id, constants_1.KEYWORDS.MONITOR_WATCHER, { action: 'startOver' }, (err, body) => {
                        logger.warn('RestartNotifyModule notify MONITOR_WATCHER start over:', record.id, err, body);
                    });
                });
            });
        }
    }
    onServerLeave(id) {
        logger.debug('RestartNotifyModule onServerLeave: %s', id);
        if (!id) {
            logger.warn('onServerLeave receive server id is empty.');
            return;
        }
        this.removedServers[id] = true;
    }
    afterStart() {
        logger.debug('~~ RestartNotifyModule afterStart', this.id);
        this.afterStartCalled = true;
        if (this.afterStartCallBack) {
            this.afterStartCallBack(1);
            this.afterStartCallBack = null;
        }
    }
    // ----------------- module methods -------------------------
    start(cb) {
        //    subscribeRequest(this, this.service.agent, this.id, cb);
        this.id = this.app.getServerId();
        if (this.app.getServerType() === 'master') {
            if (this.service.master) {
                this.app.event.on(index_1.events.ADD_SERVERS, this._addEvent);
                this.app.event.on(index_1.events.REMOVE_SERVERS, this._removeEvent);
                this._masterWatcherModule = this.service.modules[constants_1.KEYWORDS.MASTER_WATCHER].module;
            }
        }
        else {
            this.app.event.on(index_1.events.START_SERVER, this.afterStart.bind(this));
        }
        cb();
    }
    monitorHandler(agent, msg, cb) {
        if (!msg || !msg.action) {
            return;
        }
        switch (msg.action) {
            case 'afterStartCallback': {
                logger.warn('RestartNotifyModule afterStart notify ', this.id, msg);
                if (this.afterStartCalled) {
                    cb(1);
                    break;
                }
                this.afterStartCallBack = cb;
                break;
            }
            default: {
                logger.error('RestartNotifyModule unknown action: %j', msg.action);
                return;
            }
        }
    }
}
exports.RestartNotifyModule = RestartNotifyModule;
RestartNotifyModule.moduleId = 'RestartNotifyModule';
//# sourceMappingURL=restartNotifyModule.js.map