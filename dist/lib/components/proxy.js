"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualReloadProxies = exports.ProxyComponent = void 0;
/**
 * Component for proxy.
 * Generate proxies for rpc client.
 */
const crc = require("crc");
const utils = require("../util/utils");
const events_1 = require("../util/events");
const pinus_rpc_1 = require("pinus-rpc");
const Constants = require("../util/constants");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Proxy component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
class ProxyComponent {
    constructor(app, opts) {
        var _a, _b;
        this.name = '__proxy__';
        opts = opts || {};
        // proxy default config
        // cacheMsg is deprecated, just for compatibility here.
        opts.bufferMsg = opts.bufferMsg || opts.cacheMsg || false;
        opts.interval = opts.interval || 30;
        opts.router = genRouteFun();
        opts.context = (_a = opts.context) !== null && _a !== void 0 ? _a : app;
        opts.routeContext = (_b = opts.routeContext) !== null && _b !== void 0 ? _b : app;
        if (app.enabled('rpcDebugLog')) {
            opts.rpcDebugLog = true;
            opts.rpcLogger = (0, pinus_logger_1.getLogger)('rpc-debug', path.basename(__filename));
        }
        this.app = app;
        this.opts = opts;
        this.client = genRpcClient(this.app, opts);
        this.app.event.on(events_1.default.ADD_SERVERS, this.addServers.bind(this));
        this.app.event.on(events_1.default.REMOVE_SERVERS, this.removeServers.bind(this));
        this.app.event.on(events_1.default.REPLACE_SERVERS, this.replaceServers.bind(this));
    }
    /**
     * Proxy component lifecycle function
     *
     * @param {Function} cb
     * @return {Void}
     */
    async start() {
        if (this.opts.enableRpcLog) {
            logger.warn('enableRpcLog is deprecated in 0.8.0, please use app.rpcFilter(pinus.rpcFilters.rpcLog())');
        }
        let rpcBefores = this.app.get(Constants.KEYWORDS.RPC_BEFORE_FILTER);
        let rpcAfters = this.app.get(Constants.KEYWORDS.RPC_AFTER_FILTER);
        let rpcErrorHandler = this.app.get(Constants.RESERVED.RPC_ERROR_HANDLER);
        if (!!rpcBefores) {
            this.client.before(rpcBefores);
        }
        if (!!rpcAfters) {
            this.client.after(rpcAfters);
        }
        if (!!rpcErrorHandler) {
            this.client.setErrorHandler(rpcErrorHandler);
        }
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    afterStart() {
        let self = this;
        Object.defineProperty(this.app, 'rpc', {
            get: function () {
                return self.client.proxies.user;
            }
        });
        Object.defineProperty(this.app, 'sysrpc', {
            get: function () {
                return self.client.proxies.sys;
            }
        });
        this.app.rpcInvoke = this.client.rpcInvoke.bind(this.client);
        return new Promise((resolve, reject) => {
            this.client.start(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    /**
     * Add remote server to the rpc client.
     *
     * @param {Array} servers server info list, {id, serverType, host, port}
     */
    addServers(servers) {
        if (!servers || !servers.length) {
            return;
        }
        genProxies(this.client, this.app, servers);
        this.client.addServers(servers);
    }
    manualReloadProxies() {
        let servers = [];
        for (let k in this.client._station.servers) {
            servers.push(this.client._station.servers[k]);
        }
        logger.warn('manualReloadProxies servers:', servers);
        genProxies(this.client, this.app, servers);
    }
    /**
     * Remove remote server from the rpc client.
     *
     * @param  {Array} ids server id list
     */
    removeServers(ids) {
        this.client.removeServers(ids);
    }
    /**
     * Replace remote servers from the rpc client.
     *
     * @param  {Array} ids server id list
     */
    replaceServers(servers) {
        if (!servers || !servers.length) {
            return;
        }
        // update proxies
        this.client.proxies = {};
        genProxies(this.client, this.app, servers);
        this.client.replaceServers(servers);
    }
    /**
     * Proxy for rpc client rpcInvoke.
     *
     * @param {String}   serverId remote server id
     * @param {Object}   msg      rpc message: {serverType: serverType, service: serviceName, method: methodName, args: arguments}
     * @param {Function} cb      callback function
     */
    rpcInvoke(serverId, msg, cb) {
        this.client.rpcInvoke(serverId, msg, cb);
    }
}
exports.ProxyComponent = ProxyComponent;
function manualReloadProxies(app) {
    if (!app.components.__proxy__) {
        return;
    }
    if (app.components.__proxy__.manualReloadProxies) {
        app.components.__proxy__.manualReloadProxies();
    }
    else {
        logger.warn('manualReloadProxies not method');
    }
}
exports.manualReloadProxies = manualReloadProxies;
/**
 * Generate rpc client
 *
 * @param {Object} app current application context
 * @param {Object} opts contructor parameters for rpc client
 * @return {Object} rpc client
 */
let genRpcClient = function (app, opts) {
    var _a, _b;
    opts.context = (_a = opts.context) !== null && _a !== void 0 ? _a : app;
    opts.routeContext = (_b = opts.routeContext) !== null && _b !== void 0 ? _b : app;
    if (!!opts.rpcClient) {
        return opts.rpcClient.create(opts);
    }
    else {
        return (0, pinus_rpc_1.createClient)(opts);
    }
};
/**
 * Generate proxy for the server infos.
 *
 * @param  {Object} client rpc client instance
 * @param  {Object} app    application context
 * @param  {Array} sinfos server info list
 */
let genProxies = function (client, app, sinfos) {
    let item;
    for (let i = 0, l = sinfos.length; i < l; i++) {
        item = sinfos[i];
        client.addProxies(getProxyRecords(app, item));
    }
};
/**
 * Check a server whether has generated proxy before
 *
 * @param  {Object}  client rpc client instance
 * @param  {Object}  sinfo  server info
 * @return {Boolean}        true or false
 */
let hasProxy = function (client, sinfo) {
    let proxy = client.proxies;
    return !!proxy.sys && !!proxy.sys[sinfo.serverType];
};
/**
 * Get proxy path for rpc client.
 * Iterate all the remote service path and create remote path record.
 *
 * @param {Object} app current application context
 * @param {Object} sinfo server info, format: {id, serverType, host, port}
 * @return {Array}     remote path record array
 */
let getProxyRecords = function (app, sinfo) {
    return sinfo.remoterPaths;
};
let genRouteFun = function () {
    return function (session, msg, app, cb) {
        let routes = app.get(Constants.KEYWORDS.ROUTE);
        if (!routes) {
            defaultRoute(session, msg, app, cb);
            return;
        }
        let type = msg.serverType, route = routes[type] || routes['default'];
        if (route) {
            route(session, msg, app, cb);
        }
        else {
            defaultRoute(session, msg, app, cb);
        }
    };
};
let defaultRoute = function (session, msg, app, cb) {
    let list = app.getServersByType(msg.serverType);
    if (!list || !list.length) {
        cb(new Error('can not find server info for type:' + msg.serverType));
        return;
    }
    let uid = session ? (session.uid || '') : '';
    let index = Math.abs(crc.crc32(uid.toString())) % list.length;
    utils.invokeCallback(cb, null, list[index].id);
};
//# sourceMappingURL=proxy.js.map