"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualReloadHandlers = exports.HandlerService = void 0;
const fs = require("fs");
const utils = require("../../util/utils");
const Loader = require("pinus-loader");
const pathUtil = require("../../util/pathUtil");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
const pinus_loader_1 = require("pinus-loader");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let forwardLogger = (0, pinus_logger_1.getLogger)('forward-log', path.basename(__filename));
/**
 * Handler service.
 * Dispatch request to the relactive handler.
 *
 * @param {Object} app      current application context
 */
class HandlerService {
    constructor(app, opts) {
        this.handlerMap = {};
        this.handlerPaths = {};
        this.name = 'handler';
        this.app = app;
        if (!!opts.reloadHandlers) {
            watchHandlers(app, this.handlerMap);
        }
        this.enableForwardLog = opts.enableForwardLog || false;
        // 添加默认路径到ServerInfo中
        let info = app.getCurrentServer();
        let handlerPath = info.serverType ? pathUtil.getHandlerPath(app.getBase(), info.serverType) : undefined;
        info.handlerPaths = [];
        if (handlerPath) {
            info.handlerPaths.push(handlerPath);
        }
        // 添加插件中的handler到ServerInfo中
        for (let plugin of app.usedPlugins) {
            if (plugin.handlerPath) {
                info.handlerPaths.push(plugin.handlerPath);
            }
        }
        // 添加一台服务器
        this.addServer(info);
    }
    /**
     * Handler the request.
     */
    handle(routeRecord, msg, session, cb) {
        // the request should be processed by current server
        let handler = this.getHandler(routeRecord);
        if (!handler) {
            logger.error('[handleManager]: fail to find handler for %j', routeRecord.route);
            utils.invokeCallback(cb, new Error('fail to find handler for ' + routeRecord.route));
            return;
        }
        let start = Date.now();
        let self = this;
        let callback = function (err, resp, opts) {
            if (self.enableForwardLog) {
                let log = {
                    route: routeRecord.route,
                    args: msg,
                    time: utils.format(new Date(start)),
                    timeUsed: Date.now() - start
                };
                forwardLogger.info(JSON.stringify(log));
            }
            // resp = getResp(arguments);
            utils.invokeCallback(cb, err, resp, opts);
        };
        let method = routeRecord.method;
        if (!Array.isArray(msg)) {
            handler[method](msg, session).then((resp) => {
                callback(null, resp);
            }, (reason) => {
                callback(reason);
            });
        }
        else {
            msg.push(session);
            handler[method].apply(handler, msg).then((resp) => {
                callback(null, resp);
            }, (reason) => {
                callback(reason);
            });
        }
        return;
    }
    /**
     * Get handler instance by routeRecord.
     *
     * @param  {Object} handlers    handler map
     * @param  {Object} routeRecord route record parsed from route string
     * @return {Object}             handler instance if any matchs or null for match fail
     */
    getHandler(routeRecord) {
        let serverType = routeRecord.serverType;
        if (!this.handlerMap[serverType]) {
            this.loadHandlers(serverType);
        }
        let handlers = this.handlerMap[serverType] || {};
        let handler = handlers[routeRecord.handler];
        if (!handler) {
            logger.warn('could not find handler for routeRecord: %j', routeRecord);
            return null;
        }
        if (typeof handler[routeRecord.method] !== 'function') {
            logger.warn('could not find the method %s in handler: %s', routeRecord.method, routeRecord.handler);
            return null;
        }
        return handler;
    }
    parseHandler(serverType, handlerPath) {
        let modules = Loader.load(handlerPath, this.app, false, true, pinus_loader_1.LoaderPathType.PINUS_HANDLER);
        for (let name in modules) {
            let targetHandlers = this.handlerMap[serverType];
            if (!targetHandlers) {
                targetHandlers = {};
                this.handlerMap[serverType] = targetHandlers;
            }
            targetHandlers[name] = modules[name];
        }
    }
    addServer(serverInfo) {
        let targetPaths = this.handlerPaths[serverInfo.serverType];
        if (!targetPaths) {
            targetPaths = new Set();
            this.handlerPaths[serverInfo.serverType] = targetPaths;
        }
        for (let path of serverInfo.handlerPaths) {
            targetPaths.add(path);
        }
    }
    /**
     * Load handlers from current application
     */
    loadHandlers(serverType) {
        let paths = this.handlerPaths[serverType];
        for (let path of paths) {
            this.parseHandler(serverType, path);
        }
    }
}
exports.HandlerService = HandlerService;
function manualReloadHandlers(app) {
    if (!app.components.__server__) {
        return;
    }
    let p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
    if (!p) {
        return;
    }
    const handlerMap = app.components.__server__.server.handlerService.handlerMap;
    handlerMap[app.serverType] = Loader.load(p, app, true, true, pinus_loader_1.LoaderPathType.PINUS_HANDLER);
}
exports.manualReloadHandlers = manualReloadHandlers;
let watchHandlers = function (app, handlerMap) {
    let p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
    if (!!p) {
        fs.watch(p, function (event, name) {
            if (event === 'change') {
                handlerMap[app.serverType] = Loader.load(p, app, true, true, pinus_loader_1.LoaderPathType.PINUS_HANDLER);
            }
        });
    }
};
let getResp = function (args) {
    let len = args.length;
    if (len === 1) {
        return [];
    }
    if (len === 2) {
        return [args[1]];
    }
    if (len === 3) {
        return [args[1], args[2]];
    }
    if (len === 4) {
        return [args[1], args[2], args[3]];
    }
    let r = new Array(len);
    for (let i = 1; i < len; i++) {
        r[i] = args[i];
    }
    return r;
};
//# sourceMappingURL=handlerService.js.map