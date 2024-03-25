"use strict";
/*!
 * Pinus -- proto
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
/**
 * Module dependencies.
 */
const utils = require("./util/utils");
const pinus_logger_1 = require("pinus-logger");
const events_1 = require("events");
const events_2 = require("./util/events");
const appUtil = require("./util/appUtil");
const Constants = require("./util/constants");
const appManager = require("./common/manager/appManager");
const fs = require("fs");
const path = require("path");
const starter = require("./master/starter");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Application states
 */
let STATE_INITED = 1; // app has inited
let STATE_BEFORE_START = 2; // app before start
let STATE_START = 3; // app start
let STATE_STARTED = 4; // app has started
let STATE_STOPED = 5; // app has stoped
class Application {
    constructor() {
        this.loaded = []; // loaded component list
        /**
         * __backendSession__?: BackendSessionComponent,
            __channel__?: ChannelComponent,
            __connection__?: ConnectionComponent,
            __connector__?: ConnectorComponent,
            __dictionary__?: DictionaryComponent,
            __master__?: MasterComponent,
            __monitor__?: MonitorComponent,
            __protobuf__?: ProtobufComponent,
            __proxy__?: ProxyComponent,
            __remote__?: RemoteComponent,
            __server__?: ServerComponent,
            __session__?: SessionComponent,
            __pushScheduler__?: PushSchedulerComponent,
         */
        this.components = {}; // name -> component map
        this.settings = {}; // collection keep set/get
        this.event = new events_1.EventEmitter(); // event object to sub/pub events
        // global server infos
        this.master = null; // master server info
        this.servers = {}; // current global server info maps, id -> info
        this.serverTypeMaps = {}; // current global type maps, type -> [info]
        this.serverTypes = []; // current global server type list
        this.usedPlugins = []; // current server custom lifecycle callbacks
        this.clusterSeq = {}; // cluster id seqence
        // astart = utils.promisify(this.start);
        this.aconfigure = utils.promisify(this.configure);
    }
    /**
     * Initialize the server.
     *
     *   - setup default configuration
     */
    init(opts) {
        opts = opts || {};
        let base = opts.base || path.dirname(require.main.filename);
        this.set(Constants.RESERVED.BASE, base);
        this.base = base;
        appUtil.defaultConfiguration(this);
        this.state = STATE_INITED;
        logger.info('application inited: %j', this.getServerId());
    }
    /**
     * Get application base path
     *
     *  // cwd: /home/game/
     *  pinus start
     *  // app.getBase() -> /home/game
     *
     * @return {String} application base path
     *
     * @memberOf Application
     */
    getBase() {
        return this.get(Constants.RESERVED.BASE);
    }
    /**
     * Override require method in application
     *
     * @param {String} relative path of file
     *
     * @memberOf Application
     */
    require(ph) {
        return require(path.join(this.getBase(), ph));
    }
    /**
     * Configure logger with {$base}/config/log4js.json
     *
     * @param {Object} logger pinus-logger instance without configuration
     *
     * @memberOf Application
     */
    configureLogger(logger) {
        if (process.env.POMELO_LOGGER !== 'off') {
            let serverId = this.getServerId();
            let base = this.getBase();
            let env = this.get(Constants.RESERVED.ENV);
            let originPath = path.join(base, Constants.FILEPATH.LOG);
            let presentPath = path.join(base, Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.LOG));
            if (this._checkCanRequire(originPath)) {
                logger.configure(originPath, { serverId: serverId, base: base });
            }
            else if (this._checkCanRequire(presentPath)) {
                logger.configure(presentPath, { serverId: serverId, base: base });
            }
            else {
                console.error('logger file path configuration is error.');
            }
        }
    }
    /**
     * add a filter to before and after filter
     *
     * @param {Object} filter provide before and after filter method.
     *                        A filter should have two methods: before and after.
     * @memberOf Application
     */
    filter(filter) {
        this.before(filter);
        this.after(filter);
    }
    /**
     * Add before filter.
     *
     * @param {Object|Function} bf before fileter, bf(msg, session, next)
     * @memberOf Application
     */
    before(bf) {
        addFilter(this, Constants.KEYWORDS.BEFORE_FILTER, bf);
    }
    /**
     * Add after filter.
     *
     * @param {Object|Function} af after filter, `af(err, msg, session, resp, next)`
     * @memberOf Application
     */
    after(af) {
        addFilter(this, Constants.KEYWORDS.AFTER_FILTER, af);
    }
    /**
     * add a global filter to before and after global filter
     *
     * @param {Object} filter provide before and after filter method.
     *                        A filter should have two methods: before and after.
     * @memberOf Application
     */
    globalFilter(filter) {
        this.globalBefore(filter);
        this.globalAfter(filter);
    }
    /**
     * Add global before filter.
     *
     * @param {Object|Function} bf before fileter, bf(msg, session, next)
     * @memberOf Application
     */
    globalBefore(bf) {
        addFilter(this, Constants.KEYWORDS.GLOBAL_BEFORE_FILTER, bf);
    }
    /**
     * Add global after filter.
     *
     * @param {Object|Function} af after filter, `af(err, msg, session, resp, next)`
     * @memberOf Application
     */
    globalAfter(af) {
        addFilter(this, Constants.KEYWORDS.GLOBAL_AFTER_FILTER, af);
    }
    /**
     * Add rpc before filter.
     *
     * @param {Object|Function} bf before fileter, bf(serverId, msg, opts, next)
     * @memberOf Application
     */
    rpcBefore(bf) {
        addFilter(this, Constants.KEYWORDS.RPC_BEFORE_FILTER, bf);
    }
    /**
     * Add rpc after filter.
     *
     * @param {Object|Function} af after filter, `af(serverId, msg, opts, next)`
     * @memberOf Application
     */
    rpcAfter(af) {
        addFilter(this, Constants.KEYWORDS.RPC_AFTER_FILTER, af);
    }
    /**
     * add a rpc filter to before and after rpc filter
     *
     * @param {Object} filter provide before and after filter method.
     *                        A filter should have two methods: before and after.
     * @memberOf Application
     */
    rpcFilter(filter) {
        this.rpcBefore(filter);
        this.rpcAfter(filter);
    }
    load(name, component, opts) {
        if (typeof name !== 'string') {
            opts = component;
            component = name;
            name = null;
        }
        if (typeof component === 'function') {
            component = new component(this, opts);
        }
        if (!name && typeof component.name === 'string') {
            name = component.name;
        }
        if (name && this.components[name]) {
            // ignore duplicat component
            logger.warn('ignore duplicate component: %j', name);
            return null;
        }
        this.loaded.push(component);
        if (name) {
            // components with a name would get by name throught app.components later.
            this.components[name] = component;
        }
        return component;
    }
    _checkCanRequire(path) {
        try {
            path = require.resolve(path);
        }
        catch (err) {
            return null;
        }
        return path;
    }
    /**
     * Load Configure json file to settings.(support different enviroment directory & compatible for old path)
     *
     * @param {String} key environment key
     * @param {String} val environment value
     * @param {Boolean} reload whether reload after change default false
     * @return {Server|Mixed} for chaining, or the setting value
     * @memberOf Application
     */
    loadConfigBaseApp(key, val, reload = false) {
        let self = this;
        let env = this.get(Constants.RESERVED.ENV);
        let originPath = path.join(this.getBase(), val);
        let presentPath = path.join(this.getBase(), Constants.FILEPATH.CONFIG_DIR, env, path.basename(val));
        let realPath = undefined;
        let tmp;
        if (self._checkCanRequire(originPath)) {
            realPath = require.resolve(originPath);
            let file = require(originPath);
            if (file[env]) {
                file = file[env];
            }
            this.set(key, file);
        }
        else if (self._checkCanRequire(presentPath)) {
            realPath = require.resolve(presentPath);
            let pfile = require(presentPath);
            this.set(key, pfile);
        }
        else {
            logger.error('invalid configuration with file path: %s', key);
        }
        if (realPath && reload) {
            const watcher = fs.watch(realPath, function (event, filename) {
                if (event === 'change') {
                    self.clearRequireCache(require.resolve(realPath));
                    watcher.close();
                    self.loadConfigBaseApp(key, val, reload);
                }
            });
        }
    }
    clearRequireCache(path) {
        const moduleObj = require.cache[path];
        if (!moduleObj) {
            logger.warn('can not find module of truepath', path);
            return;
        }
        if (moduleObj.parent) {
            //    console.log('has parent ',moduleObj.parent);
            moduleObj.parent.children.splice(moduleObj.parent.children.indexOf(moduleObj), 1);
        }
        delete require.cache[path];
    }
    /**
     * Load Configure json file to settings.
     *
     * @param {String} key environment key
     * @param {String} val environment value
     * @return {Server|Mixed} for chaining, or the setting value
     * @memberOf Application
     */
    loadConfig(key, val) {
        let env = this.get(Constants.RESERVED.ENV);
        let cfg = require(val);
        if (cfg[env]) {
            cfg = cfg[env];
        }
        this.set(key, cfg);
    }
    /**
     * Set the route function for the specified server type.
     *
     * Examples:
     *
     *  app.route('area', routeFunc);
     *
     *  let routeFunc = function(session, msg, app, cb) {
     *    // all request to area would be route to the first area server
     *    let areas = app.getServersByType('area');
     *    cb(null, areas[0].id);
     *  };
     *
     * @param  {String} serverType server type string
     * @param  {Function} routeFunc  route function. routeFunc(session, msg, app, cb)
     * @return {Object}     current application instance for chain invoking
     * @memberOf Application
     */
    route(serverType, routeFunc) {
        let routes = this.get(Constants.KEYWORDS.ROUTE);
        if (!routes) {
            routes = {};
            this.set(Constants.KEYWORDS.ROUTE, routes);
        }
        routes[serverType] = routeFunc;
        return this;
    }
    /**
     * Set before stop function. It would perform before servers stop.
     *
     * @param  {Function} fun before close function
     * @return {Void}
     * @memberOf Application
     */
    beforeStopHook(fun) {
        logger.warn('this method was deprecated in pinus 0.8');
        if (!!fun && typeof fun === 'function') {
            this.set(Constants.KEYWORDS.BEFORE_STOP_HOOK, fun);
        }
    }
    /**
     * Start application. It would load the default components and start all the loaded components.
     *
     * @param  {Function} cb callback function
     * @memberOf Application
     */
    async start() {
        this.startTime = Date.now();
        if (this.state > STATE_INITED) {
            return Promise.reject('application has already start.');
        }
        // by elendil
        if (!!this.startId) {
            if (this.startId !== Constants.RESERVED.MASTER) {
                starter.runServers(this);
                return;
            }
        }
        else {
            if (!!this.type && this.type !== Constants.RESERVED.ALL && this.type !== Constants.RESERVED.MASTER) {
                starter.runServers(this);
                return;
            }
        }
        appUtil.loadDefaultComponents(this);
        // call plugin beforestart
        for (let i = 0; i < this.usedPlugins.length; ++i) {
            const plugin = this.usedPlugins[i];
            if (typeof plugin.beforeStartup === 'function') {
                try {
                    await plugin.beforeStartup(this);
                }
                catch (e) {
                    logger.error(e);
                }
            }
        }
        this.state = STATE_BEFORE_START;
        logger.info('%j enter before start...', this.getServerId());
        await appUtil.optComponents(this.loaded, Constants.RESERVED.BEFORE_START);
        logger.info('%j enter start...', this.getServerId());
        await appUtil.optComponents(this.loaded, Constants.RESERVED.START);
        this.state = STATE_START;
        logger.info('%j enter after start...', this.getServerId());
        await this.afterStart();
        // by elendil
    }
    /**
     * Lifecycle callback for after start.
     *
     * @param  {Function} cb callback function
     * @return {Void}
     */
    async afterStart() {
        if (this.state !== STATE_START) {
            return Promise.reject('application is not running now.');
        }
        await appUtil.optComponents(this.loaded, Constants.RESERVED.AFTER_START);
        this.state = STATE_STARTED;
        let id = this.getServerId();
        logger.info('%j finish start', id);
        for (let i = 0; i < this.usedPlugins.length; ++i) {
            const plugin = this.usedPlugins[i];
            if (typeof plugin.afterStartup === 'function') {
                try {
                    await plugin.afterStartup(this);
                }
                catch (e) {
                    logger.error(e);
                }
            }
        }
        let usedTime = Date.now() - this.startTime;
        logger.info('%j startup in %s ms', id, usedTime);
        this.event.emit(events_2.default.START_SERVER, id);
    }
    /**
     * Stop components.
     *
     * @param  {Boolean} force whether stop the app immediately
     */
    async stop(force) {
        if (this.state > STATE_STARTED) {
            logger.warn('[pinus application] application is not running now.');
            return;
        }
        this.state = STATE_STOPED;
        let self = this;
        this.stopTimer = setTimeout(function () {
            process.exit(0);
        }, Constants.TIME.TIME_WAIT_STOP);
        let cancelShutDownTimer = function () {
            if (!!self.stopTimer) {
                clearTimeout(self.stopTimer);
            }
        };
        let shutDown = function () {
            appUtil.stopComps(self.loaded, 0, force, function () {
                cancelShutDownTimer();
                if (force) {
                    process.exit(0);
                }
            });
        };
        let fun = this.get(Constants.KEYWORDS.BEFORE_STOP_HOOK);
        for (let i = 0; i < this.usedPlugins.length; ++i) {
            const plugin = this.usedPlugins[i];
            if (typeof plugin.beforeShutdown === 'function') {
                try {
                    await plugin.beforeShutdown(this, cancelShutDownTimer);
                }
                catch (e) {
                    console.error(`throw err when beforeShutdown `, e.stack);
                }
            }
        }
        if (!!fun) {
            utils.invokeCallback(fun, self, shutDown, cancelShutDownTimer);
        }
        else {
            shutDown();
        }
        // appUtil.optLifecycles(self.usedPlugins, Constants.LIFECYCLE.BEFORE_SHUTDOWN, self, function (err) {
        //     if (err) {
        //         console.error(`throw err when beforeShutdown `, err.stack);
        //     } else {
        //         if (!!fun) {
        //             utils.invokeCallback(fun, self, shutDown, cancelShutDownTimer);
        //         } else {
        //             shutDown();
        //         }
        //     }
        // }, cancelShutDownTimer);
    }
    set(setting, val, attach) {
        this.settings[setting] = val;
        if (attach) {
            this[setting] = val;
        }
        return this;
    }
    get(setting) {
        return this.settings[setting];
    }
    /**
     * Check if `setting` is enabled.
     *
     * @param {String} setting application setting
     * @return {Boolean}
     * @memberOf Application
     */
    enabled(setting) {
        return !!this.get(setting);
    }
    /**
     * Check if `setting` is disabled.
     *
     * @param {String} setting application setting
     * @return {Boolean}
     * @memberOf Application
     */
    disabled(setting) {
        return !this.get(setting);
    }
    /**
     * Enable `setting`.
     *
     * @param {String} setting application setting
     * @return {app} for chaining
     * @memberOf Application
     */
    enable(setting) {
        return this.set(setting, true);
    }
    /**
     * Disable `setting`.
     *
     * @param {String} setting application setting
     * @return {app} for chaining
     * @memberOf Application
     */
    disable(setting) {
        return this.set(setting, false);
    }
    configure(env, type, fn) {
        let args = Array.from(arguments);
        fn = args.pop();
        env = type = Constants.RESERVED.ALL;
        if (args.length > 0) {
            env = args[0];
        }
        if (args.length > 1) {
            type = args[1];
        }
        if (env === Constants.RESERVED.ALL || contains(this.settings.env, env)) {
            if (type === Constants.RESERVED.ALL || contains(this.settings.serverType, type)) {
                if (fn !== undefined)
                    fn.call(this);
            }
        }
        return this;
    }
    registerAdmin(moduleId, module, opts) {
        let modules = this.get(Constants.KEYWORDS.MODULE);
        if (!modules) {
            modules = {};
            this.set(Constants.KEYWORDS.MODULE, modules);
        }
        if (typeof moduleId !== 'string') {
            opts = module;
            module = moduleId;
            if (module) {
                moduleId = (module.moduleId);
                if (!moduleId)
                    moduleId = module.constructor.name;
            }
        }
        if (!moduleId) {
            return;
        }
        modules[moduleId] = {
            moduleId: moduleId,
            module: module,
            opts: opts
        };
    }
    /**
     * Use plugin.
     *
     * @param  {Object} plugin plugin instance
     * @param  {[type]} opts    (optional) construct parameters for the factory function
     * @memberOf Application
     */
    use(plugin, opts) {
        opts = opts || {};
        if (!plugin) {
            throw new Error(`pluin is null!]`);
        }
        if (this.usedPlugins.indexOf(plugin) >= 0) {
            throw new Error(`pluin[${plugin.name} was used already!]`);
        }
        if (plugin.components) {
            for (let componentCtor of plugin.components) {
                this.load(componentCtor, opts);
            }
        }
        if (plugin.events) {
            for (let eventCtor of plugin.events) {
                this.loadEvent(eventCtor, opts);
            }
        }
        this.usedPlugins.push(plugin);
        console.warn(`used Plugin : ${plugin.name}`);
    }
    /**
     * Application transaction. Transcation includes conditions and handlers, if conditions are satisfied, handlers would be executed.
     * And you can set retry times to execute handlers. The transaction log is in file logs/transaction.log.
     *
     * @param {String} name transaction name
     * @param {Object} conditions functions which are called before transaction
     * @param {Object} handlers functions which are called during transaction
     * @param {Number} retry retry times to execute handlers if conditions are successfully executed
     * @memberOf Application
     */
    transaction(name, conditions, handlers, retry) {
        appManager.transaction(name, conditions, handlers, retry);
    }
    /**
     * Get master server info.
     *
     * @return {Object} master server info, {id, host, port}
     * @memberOf Application
     */
    getMaster() {
        return this.master;
    }
    /**
     * Get current server info.
     *
     * @return {Object} current server info, {id, serverType, host, port}
     * @memberOf Application
     */
    getCurServer() {
        return this.curServer;
    }
    /**
     * Get current server id.
     *
     * @return {String|Number} current server id from servers.json
     * @memberOf Application
     */
    getServerId() {
        return this.serverId;
    }
    /**
     * Get current server
     * @returns ServerInfo
     */
    getCurrentServer() {
        return this.curServer;
    }
    /**
     * Get current server type.
     *
     * @return {String|Number} current server type from servers.json
     * @memberOf Application
     */
    getServerType() {
        return this.serverType;
    }
    /**
     * Get all the current server infos.
     *
     * @return {Object} server info map, key: server id, value: server info
     * @memberOf Application
     */
    getServers() {
        return this.servers;
    }
    /**
     * Get all server infos from servers.json.
     *
     * @return {Object} server info map, key: server id, value: server info
     * @memberOf Application
     */
    getServersFromConfig() {
        return this.get(Constants.KEYWORDS.SERVER_MAP);
    }
    /**
     * Get all the server type.
     *
     * @return {Array} server type list
     * @memberOf Application
     */
    getServerTypes() {
        return this.serverTypes;
    }
    /**
     * Get server info by server id from current server cluster.
     *
     * @param  {String} serverId server id
     * @return {Object} server info or undefined
     * @memberOf Application
     */
    getServerById(serverId) {
        return this.servers[serverId];
    }
    /**
     * Get server info by server id from servers.json.
     *
     * @param  {String} serverId server id
     * @return {Object} server info or undefined
     * @memberOf Application
     */
    getServerFromConfig(serverId) {
        return this.get(Constants.KEYWORDS.SERVER_MAP)[serverId];
    }
    /**
     * Get server infos by server type.
     *
     * @param  {String} serverType server type
     * @return {Array}      server info list
     * @memberOf Application
     */
    getServersByType(serverType) {
        return this.serverTypeMaps[serverType];
    }
    /**
     * Check the server whether is a frontend server
     *
     * @param  {server}  server server info. it would check current server
     *            if server not specified
     * @return {Boolean}
     *
     * @memberOf Application
     */
    isFrontend(server) {
        server = server || this.getCurServer();
        return !!server && server.frontend === 'true';
    }
    /**
     * Check the server whether is a backend server
     *
     * @param  {server}  server server info. it would check current server
     *            if server not specified
     * @return {Boolean}
     * @memberOf Application
     */
    isBackend(server) {
        server = server || this.getCurServer();
        return !!server && !server.frontend;
    }
    /**
     * Check whether current server is a master server
     *
     * @return {Boolean}
     * @memberOf Application
     */
    isMaster() {
        return this.serverType === Constants.RESERVED.MASTER;
    }
    /**
     * Add new server info to current application in runtime.
     *
     * @param {Array} servers new server info list
     * @memberOf Application
     */
    addServers(servers) {
        if (!servers || !servers.length) {
            return;
        }
        let item, slist;
        for (let i = 0, l = servers.length; i < l; i++) {
            item = servers[i];
            // update global server map
            this.servers[item.id] = item;
            // update global server type map
            slist = this.serverTypeMaps[item.serverType];
            if (!slist) {
                this.serverTypeMaps[item.serverType] = slist = [];
            }
            replaceServer(slist, item);
            // update global server type list
            if (this.serverTypes.indexOf(item.serverType) < 0) {
                this.serverTypes.push(item.serverType);
            }
        }
        this.event.emit(events_2.default.ADD_SERVERS, servers);
    }
    /**
     * Remove server info from current application at runtime.
     *
     * @param  {Array} ids server id list
     * @memberOf Application
     */
    removeServers(ids) {
        if (!ids || !ids.length) {
            return;
        }
        let id, item, slist;
        for (let i = 0, l = ids.length; i < l; i++) {
            id = ids[i];
            item = this.servers[id];
            if (!item) {
                continue;
            }
            // clean global server map
            delete this.servers[id];
            // clean global server type map
            slist = this.serverTypeMaps[item.serverType];
            removeServer(slist, id);
            // TODO: should remove the server type if the slist is empty?
        }
        this.event.emit(events_2.default.REMOVE_SERVERS, ids);
    }
    /**
     * Replace server info from current application at runtime.
     *
     * @param  {Object} server id map
     * @memberOf Application
     */
    replaceServers(servers) {
        if (!servers) {
            return;
        }
        this.servers = servers;
        this.serverTypeMaps = {};
        this.serverTypes = [];
        let serverArray = [];
        for (let id in servers) {
            let server = servers[id];
            let serverType = server[Constants.RESERVED.SERVER_TYPE];
            let slist = this.serverTypeMaps[serverType];
            if (!slist) {
                this.serverTypeMaps[serverType] = slist = [];
            }
            this.serverTypeMaps[serverType].push(server);
            // update global server type list
            if (this.serverTypes.indexOf(serverType) < 0) {
                this.serverTypes.push(serverType);
            }
            serverArray.push(server);
        }
        this.event.emit(events_2.default.REPLACE_SERVERS, serverArray);
    }
    /**
     * Add crons from current application at runtime.
     *
     * @param  {Array} crons new crons would be added in application
     * @memberOf Application
     */
    addCrons(crons) {
        if (!crons || !crons.length) {
            logger.warn('crons is not defined.');
            return;
        }
        this.event.emit(events_2.default.ADD_CRONS, crons);
    }
    /**
     * Remove crons from current application at runtime.
     *
     * @param  {Array} crons old crons would be removed in application
     * @memberOf Application
     */
    removeCrons(crons) {
        if (!crons || !crons.length) {
            logger.warn('ids is not defined.');
            return;
        }
        this.event.emit(events_2.default.REMOVE_CRONS, crons);
    }
    /**
     * 加载一个事件侦听
     * @param Event
     * @param opts
     */
    loadEvent(Event, opts) {
        let eventInstance = new Event(opts);
        for (let evt in events_2.AppEvents) {
            let name = events_2.AppEvents[evt];
            let method = eventInstance[name];
            if (method) {
                this.event.on(name, method.bind(eventInstance));
            }
        }
    }
}
exports.Application = Application;
let replaceServer = function (slist, serverInfo) {
    for (let i = 0, l = slist.length; i < l; i++) {
        if (slist[i].id === serverInfo.id) {
            slist[i] = serverInfo;
            return;
        }
    }
    slist.push(serverInfo);
};
let removeServer = function (slist, id) {
    if (!slist || !slist.length) {
        return;
    }
    for (let i = 0, l = slist.length; i < l; i++) {
        if (slist[i].id === id) {
            slist.splice(i, 1);
            return;
        }
    }
};
let contains = function (str, settings) {
    if (!settings) {
        return false;
    }
    let ts = settings.split('|');
    for (let i = 0, l = ts.length; i < l; i++) {
        if (str === ts[i]) {
            return true;
        }
    }
    return false;
};
let addFilter = function (app, type, filter) {
    let filters = app.get(type);
    if (!filters) {
        filters = [];
        app.set(type, filters);
    }
    filters.push(filter);
};
//# sourceMappingURL=application.js.map