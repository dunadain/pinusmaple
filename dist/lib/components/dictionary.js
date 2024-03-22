"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionaryComponent = void 0;
const path = require("path");
const Loader = require("pinus-loader");
const pinus_loader_1 = require("pinus-loader");
const pathUtil = require("../util/pathUtil");
const crypto = require("crypto");
const pinus_rpc_1 = require("pinus-rpc");
function canResolve(path) {
    try {
        require.resolve(path);
    }
    catch (err) {
        return false;
    }
    return true;
}
class DictionaryComponent {
    constructor(app, opts) {
        this.dict = {};
        this.abbrs = {};
        this.version = '';
        this.name = '__dictionary__';
        this.app = app;
        // Set user dictionary
        let p = path.join(app.getBase(), '/config/dictionary');
        if (!!opts && !!opts.dict) {
            p = opts.dict;
        }
        if (!!opts) {
            this.ignoreAutoRouter = !!opts.ignoreAutoRouter;
        }
        if (canResolve(p)) {
            this.userDicPath = p;
        }
    }
    async start() {
        let servers = this.app.get('servers');
        let routes = [];
        if (!this.ignoreAutoRouter) {
            // Load all the handler files
            for (let serverType in servers) {
                let p = pathUtil.getHandlerPath(this.app.getBase(), serverType);
                if (!p) {
                    continue;
                }
                let handlers = Loader.load(p, this.app, false, false, pinus_loader_1.LoaderPathType.PINUS_HANDLER);
                for (let name in handlers) {
                    let handler = handlers[name];
                    let proto = (0, pinus_rpc_1.listEs6ClassMethods)(handler);
                    for (let key of proto) {
                        routes.push(serverType + '.' + name + '.' + key);
                    }
                }
            }
        }
        // Sort the route to make sure all the routers abbr are the same in all the servers
        routes.sort();
        console.warn('after start all server, use route dictionary :\n', routes.join('\n'));
        let abbr;
        let i;
        for (i = 0; i < routes.length; i++) {
            abbr = i + 1;
            this.abbrs[abbr] = routes[i];
            this.dict[routes[i]] = abbr;
        }
        // Load user dictionary
        if (!!this.userDicPath) {
            let userDic = require(this.userDicPath);
            abbr = routes.length + 1;
            for (i = 0; i < userDic.length; i++) {
                let route = userDic[i];
                this.abbrs[abbr] = route;
                this.dict[route] = abbr;
                abbr++;
            }
        }
        this.version = crypto.createHash('md5').update(JSON.stringify(this.dict)).digest('base64');
    }
    getDict() {
        return this.dict;
    }
    getAbbrs() {
        return this.abbrs;
    }
    getVersion() {
        return this.version;
    }
}
exports.DictionaryComponent = DictionaryComponent;
//# sourceMappingURL=dictionary.js.map