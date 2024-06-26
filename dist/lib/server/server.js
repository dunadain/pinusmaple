"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualReloadCrons = exports.Server = exports.create = void 0;
/**
 * Implementation of server component.
 * Init and start server instance.
 */
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
const pathUtil = require("../util/pathUtil");
const Loader = require("pinus-loader");
const pinus_loader_1 = require("pinus-loader");
const utils = require("../util/utils");
const schedule = require("pinus-scheduler");
const events_1 = require("../util/events");
const Constants = require("../util/constants");
const filterService_1 = require("../common/service/filterService");
const handlerService_1 = require("../common/service/handlerService");
const events_2 = require("events");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let ST_INITED = 0; // server inited
let ST_STARTED = 1; // server started
let ST_STOPED = 2; // server stoped
/**
 * Server factory function.
 *
 * @param {Object} app  current application context
 * @return {Object} erver instance
 */
function create(app, opts) {
    return new Server(app, opts);
}
exports.create = create;
class Server extends events_2.EventEmitter {
    constructor(app, opts) {
        super();
        this.globalFilterService = null;
        this.filterService = null;
        this.handlerService = null;
        this.cronHandlers = null;
        this.crons = [];
        this.jobs = {};
        this.state = ST_INITED;
        this.opts = opts || {};
        this.app = app;
        app.event.on(events_1.default.ADD_CRONS, this.addCrons.bind(this));
        app.event.on(events_1.default.REMOVE_CRONS, this.removeCrons.bind(this));
    }
    /**
     * Server lifecycle callback
     */
    start() {
        if (this.state > ST_INITED) {
            return;
        }
        this.globalFilterService = initFilter(true, this.app);
        this.filterService = initFilter(false, this.app);
        this.handlerService = initHandler(this.app, this.opts);
        this.loadCrons();
        this.state = ST_STARTED;
    }
    loadCrons(manualReload = false, clear = false) {
        if (manualReload) {
            logger.info('loadCrons remove crons', this.crons);
            this.removeCrons(this.crons);
            if (clear) {
                this.crons = [];
            }
        }
        this.cronHandlers = loadCronHandlers(this.app, manualReload);
        loadCrons(this, this.app, manualReload);
        if (manualReload) {
            scheduleCrons(this, this.crons);
        }
    }
    afterStart() {
        scheduleCrons(this, this.crons);
    }
    /**
     * Stop server
     */
    stop() {
        this.state = ST_STOPED;
    }
    /**
     * Global handler.
     *
     * @param  {Object} msg request message
     * @param  {Object} session session object
     * @param  {Callback} callback function
     */
    globalHandle(msg, session, cb) {
        var _a;
        if (this.state !== ST_STARTED) {
            utils.invokeCallback(cb, new Error('server not started'));
            return;
        }
        let routeRecord = parseRoute(msg.route);
        if (!routeRecord) {
            utils.invokeCallback(cb, new Error(`meet unknown route message ${msg.route}`));
            return;
        }
        if (routeRecord.method === 'constructor') {
            logger.warn('attack session:', session, msg);
            (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.kickBySessionId(session.id, 'attack');
            return;
        }
        let self = this;
        let dispatch = function (err, resp) {
            if (err) {
                handleError(true, self, err, msg, session, resp, function (err, resp) {
                    response(true, self, err, routeRecord, msg, session, resp, cb);
                });
                return;
            }
            if (self.app.getServerType() !== (routeRecord === null || routeRecord === void 0 ? void 0 : routeRecord.serverType)) {
                doForward(self.app, msg, session, routeRecord, function (err, resp) {
                    response(true, self, err, routeRecord, msg, session, resp, cb);
                });
            }
            else {
                doHandle(self, msg, session, routeRecord, function (err, resp) {
                    response(true, self, err, routeRecord, msg, session, resp, cb);
                });
            }
        };
        beforeFilter(true, self, routeRecord, msg, session, dispatch);
    }
    /**
     * Handle request
     */
    handle(msg, session, cb) {
        if (this.state !== ST_STARTED) {
            cb(new Error('server not started'));
            return;
        }
        let routeRecord = parseRoute(msg.route);
        doHandle(this, msg, session, routeRecord, cb);
    }
    /**
     * Add crons at runtime.
     *
     * @param {Array} crons would be added in application
     */
    addCrons(crons) {
        this.cronHandlers = loadCronHandlers(this.app);
        for (let i = 0, l = crons.length; i < l; i++) {
            let cron = crons[i];
            checkAndAdd(cron, this.crons, this);
        }
        scheduleCrons(this, crons);
    }
    /**
     * Remove crons at runtime.
     *
     * @param {Array} crons would be removed in application
     */
    removeCrons(crons) {
        for (let i = 0, l = crons.length; i < l; i++) {
            let cron = crons[i];
            let id = cron.id;
            if (!!this.jobs[id]) {
                schedule.cancelJob(this.jobs[id]);
                delete this.jobs[id];
            }
            else {
                logger.warn('cron is not in application: %j', cron);
            }
        }
    }
}
exports.Server = Server;
// 重置 crons 缓存，  手动添加的crons只会取消任务重新加载任务。
// clear 控制重新加载之前是否先清除原有的.
// 有的 cron 是通过运行时动态添加进来的. 所以不能直接清除, 所以只能添加选项自己来控制
function manualReloadCrons(app, clear = false) {
    if (!app.components.__server__) {
        return;
    }
    logger.info('manualReloadCrons start');
    app.components.__server__.server.loadCrons(true, clear);
    logger.info('manualReloadCrons finish');
}
exports.manualReloadCrons = manualReloadCrons;
let initFilter = function (isGlobal, app) {
    let service = new filterService_1.FilterService();
    let befores, afters;
    if (isGlobal) {
        befores = app.get(Constants.KEYWORDS.GLOBAL_BEFORE_FILTER);
        afters = app.get(Constants.KEYWORDS.GLOBAL_AFTER_FILTER);
    }
    else {
        befores = app.get(Constants.KEYWORDS.BEFORE_FILTER);
        afters = app.get(Constants.KEYWORDS.AFTER_FILTER);
    }
    let i, l;
    if (befores) {
        for (i = 0, l = befores.length; i < l; i++) {
            service.before(befores[i]);
        }
    }
    if (afters) {
        for (i = 0, l = afters.length; i < l; i++) {
            service.after(afters[i]);
        }
    }
    return service;
};
let initHandler = function (app, opts) {
    return new handlerService_1.HandlerService(app, opts);
};
/**
 * Load cron handlers from current application
 */
let loadCronHandlers = function (app, manualReload = false) {
    let all = {};
    let p = pathUtil.getCronPath(app.getBase(), app.getServerType());
    if (p) {
        let crons = Loader.load(p, app, manualReload, true, pinus_loader_1.LoaderPathType.PINUS_CRONNER);
        for (let name in crons) {
            all[name] = crons[name];
        }
    }
    for (let plugin of app.usedPlugins) {
        if (plugin.cronPath) {
            if (!_checkCanRequire(plugin.cronPath)) {
                logger.error(`插件[${plugin.name}的cronPath[${plugin.cronPath}不存在。]]`);
                continue;
            }
            let crons = Loader.load(plugin.cronPath, app, manualReload, true, pinus_loader_1.LoaderPathType.PINUS_CRONNER);
            for (let name in crons) {
                all[name] = crons[name];
            }
        }
    }
    return all;
};
const clearRequireCache = function (path) {
    const moduleObj = require.cache[path];
    if (!moduleObj) {
        return;
    }
    if (moduleObj.parent) {
        moduleObj.parent.children.splice(moduleObj.parent.children.indexOf(moduleObj), 1);
    }
    delete require.cache[path];
};
function _checkCanRequire(path, manualReload = false) {
    try {
        path = require.resolve(path);
        if (manualReload) {
            clearRequireCache(path);
        }
    }
    catch (err) {
        return null;
    }
    return path;
}
/**
 * Load crons from configure file
 */
let loadCrons = function (server, app, manualReload = false) {
    let env = app.get(Constants.RESERVED.ENV);
    let p = path.join(app.getBase(), Constants.FILEPATH.CRON);
    if (!_checkCanRequire(p, manualReload)) {
        p = path.join(app.getBase(), Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.CRON));
        if (!_checkCanRequire(p, manualReload)) {
            return;
        }
    }
    app.loadConfigBaseApp(Constants.RESERVED.CRONS, Constants.FILEPATH.CRON);
    let crons = app.get(Constants.RESERVED.CRONS);
    for (let serverType in crons) {
        if (app.serverType === serverType) {
            let list = crons[serverType];
            for (let i = 0; i < list.length; i++) {
                if (!list[i].serverId) {
                    checkAndAdd(list[i], server.crons, server, manualReload);
                }
                else {
                    if (app.serverId === list[i].serverId) {
                        checkAndAdd(list[i], server.crons, server, manualReload);
                    }
                }
            }
        }
    }
};
/**
 * Fire before filter chain if any
 */
let beforeFilter = function (isGlobal, server, routeRecord, msg, session, cb) {
    let fm;
    if (isGlobal) {
        fm = server.globalFilterService;
    }
    else {
        fm = server.filterService;
    }
    if (fm) {
        fm.beforeFilter(routeRecord, msg, session, cb);
    }
    else {
        utils.invokeCallback(cb);
    }
};
/**
 * Fire after filter chain if have
 */
let afterFilter = function (isGlobal, server, err, routeRecord, msg, session, resp, cb) {
    let fm;
    if (isGlobal) {
        fm = server.globalFilterService;
    }
    else {
        fm = server.filterService;
    }
    if (fm) {
        if (isGlobal) {
            fm.afterFilter(err, routeRecord, msg, session, resp, function () {
                // do nothing
            });
        }
        else {
            fm.afterFilter(err, routeRecord, msg, session, resp, function (err) {
                cb(err, resp);
            });
        }
    }
};
/**
 * pass err to the global error handler if specified
 */
let handleError = function (isGlobal, server, err, msg, session, resp, cb) {
    let handler;
    if (isGlobal) {
        handler = server.app.get(Constants.RESERVED.GLOBAL_ERROR_HANDLER);
    }
    else {
        handler = server.app.get(Constants.RESERVED.ERROR_HANDLER);
    }
    if (!handler) {
        logger.error(`${server.app.serverId} no default error handler msg[${JSON.stringify(msg)}] to resolve unknown exception: sessionId:${JSON.stringify(session.export())} , error stack: ${err.stack}`);
        utils.invokeCallback(cb, err, resp);
    }
    else {
        if (handler.length === 5) {
            handler(err, msg, resp, session, cb);
        }
        else {
            handler(err, msg, resp, session, cb);
        }
    }
};
/**
 * Send response to client and fire after filter chain if any.
 */
let response = function (isGlobal, server, err, routeRecord, msg, session, resp, cb) {
    if (isGlobal) {
        cb(err, resp);
        // after filter should not interfere response
        afterFilter(isGlobal, server, err, routeRecord, msg, session, resp, cb);
    }
    else {
        afterFilter(isGlobal, server, err, routeRecord, msg, session, resp, cb);
    }
};
/**
 * Parse route string.
 *
 * @param  {String} route route string, such as: serverName.handlerName.methodName
 * @return {Object}       parse result object or null for illeagle route string
 */
let parseRoute = function (route) {
    if (!route) {
        return null;
    }
    let ts = route.split('.');
    if (ts.length !== 3) {
        return null;
    }
    return {
        route: route,
        serverType: ts[0],
        handler: ts[1],
        method: ts[2]
    };
};
let doForward = function (app, msg, session, routeRecord, cb) {
    let finished = false;
    // should route to other servers
    try {
        if (app.sysrpc && routeRecord) {
            app.sysrpc[routeRecord.serverType].msgRemote.forwardMessage(
            // app.sysrpc[routeRecord.serverType].msgRemote.forwardMessage2(
            session, msg, 
            // msg.oldRoute || msg.route,
            // msg.body,
            // msg.aesPassword,
            // msg.compressGzip,
            session.export()).then(function (resp) {
                finished = true;
                utils.invokeCallback(cb, null, resp);
            }).catch(function (err) {
                logger.error(app.serverId + ' fail to process remote message:' + err.stack);
                utils.invokeCallback(cb, err);
            });
        }
    }
    catch (err) {
        if (!finished) {
            logger.error(app.serverId + ' fail to forward message:' + err.stack);
            utils.invokeCallback(cb, err);
        }
    }
};
let doHandle = function (server, msg, session, routeRecord, cb) {
    msg = msg.body || {};
    let self = server;
    let handle = function (err, resp) {
        var _a;
        if (err) {
            // error from before filter
            handleError(false, self, err, msg, session, resp, function (err, resp) {
                response(false, self, err, routeRecord, msg, session, resp, cb);
            });
            return;
        }
        (_a = self.handlerService) === null || _a === void 0 ? void 0 : _a.handle(routeRecord, msg, session, function (err, resp) {
            if (err) {
                // error from handler
                handleError(false, self, err, msg, session, resp, function (err, resp) {
                    response(false, self, err, routeRecord, msg, session, resp, cb);
                });
                return;
            }
            response(false, self, err, routeRecord, msg, session, resp, cb);
        });
    }; // end of handle
    beforeFilter(false, server, routeRecord, msg, session, handle);
};
/**
 * Schedule crons
 */
let scheduleCrons = function (server, crons) {
    let handlers = server.cronHandlers;
    for (let i = 0; i < crons.length; i++) {
        let cronInfo = crons[i];
        let time = cronInfo.time;
        let action = cronInfo.action;
        let jobId = cronInfo.id;
        if (!time || !action || !jobId) {
            logger.error(server.app.serverId + ' cron miss necessary parameters: %j', cronInfo);
            continue;
        }
        if (action.indexOf('.') < 0) {
            logger.error(server.app.serverId + ' cron action is error format: %j', cronInfo);
            continue;
        }
        let cron = action.split('.')[0];
        let job = action.split('.')[1];
        let handler = handlers ? handlers[cron] : undefined;
        if (!handler) {
            logger.error('could not find cron: %j', cronInfo);
            continue;
        }
        if (typeof handler[job] !== 'function') {
            logger.error('could not find cron job: %j, %s', cronInfo, job);
            continue;
        }
        let id = schedule.scheduleJob(time, handler[job].bind(handler));
        server.jobs[jobId] = id;
    }
};
/**
 * If cron is not in crons then put it in the array.
 */
let checkAndAdd = function (cron, crons, server, replace = false) {
    const orgCron = containCron(cron.id, crons);
    if (!orgCron) {
        server.crons.push(cron);
    }
    else {
        logger.warn('cron is duplicated: %j', cron);
        if (replace) {
            logger.warn('replace time and action org:%j, new:%j', orgCron, cron);
            orgCron.time = cron.time;
            orgCron.action = cron.action;
        }
    }
};
/**
 * Check if cron is in crons.
 */
let containCron = function (id, crons) {
    for (let i = 0, l = crons.length; i < l; i++) {
        if (id === crons[i].id) {
            return crons[i];
        }
    }
    return null;
};
//# sourceMappingURL=server.js.map