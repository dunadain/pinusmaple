"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchServerModule = void 0;
/*!
 * Pinus -- consoleModule watchServer
 * Copyright(c) 2013 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
const pinus_logger_1 = require("pinus-logger");
const countDownLatch = require("../util/countDownLatch");
const monitor = require("pinus-monitor");
const util = require("util");
const fs = require("fs");
const vm = require("vm");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
var HandleType;
(function (HandleType) {
    HandleType["client"] = "client";
    HandleType["monitor"] = "monitor";
})(HandleType || (HandleType = {}));
class WatchServerModule {
    constructor(opts) {
        opts = opts || {};
        if (opts.app)
            this.app = opts.app;
    }
    monitorHandler(agent, msg, cb) {
        let comd = msg['comd'];
        let context = msg['context'];
        let param = msg['param'];
        let app = this.app;
        let handle = HandleType.monitor;
        switch (comd) {
            case 'servers':
                showServers(handle, agent, comd, context, cb);
                break;
            case 'connections':
                showConnections(handle, agent, app, comd, context, cb);
                break;
            case 'logins':
                showLogins(handle, agent, app, comd, context, cb);
                break;
            case 'modules':
                showModules(handle, agent, comd, context, cb);
                break;
            case 'status':
                showStatus(handle, agent, comd, context, cb);
                break;
            case 'config':
                showConfig(handle, agent, app, comd, context, param, cb);
                break;
            case 'proxy':
                showProxy(handle, agent, app, comd, context, param, cb);
                break;
            case 'handler':
                showHandler(handle, agent, app, comd, context, param, cb);
                break;
            case 'components':
                showComponents(handle, agent, app, comd, context, param, cb);
                break;
            case 'settings':
                showSettings(handle, agent, app, comd, context, param, cb);
                break;
            case 'cpu':
                dumpCPU(handle, agent, comd, context, param, cb);
                break;
            case 'memory':
                dumpMemory(handle, agent, comd, context, param, cb);
                break;
            case 'get':
                getApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'set':
                setApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'enable':
                enableApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'disable':
                disableApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'run':
                runScript(handle, agent, app, comd, context, param, cb);
                break;
            default:
                showError(handle, agent, comd, context, cb);
        }
    }
    clientHandler(agent, msg, cb) {
        let comd = msg['comd'];
        let context = msg['context'];
        let param = msg['param'];
        let app = this.app; // master app
        if (!comd || !context) {
            cb('lack of comd or context param');
            return;
        }
        let handle = HandleType.client;
        switch (comd) {
            case 'servers':
                showServers(handle, agent, comd, context, cb);
                break;
            case 'connections':
                showConnections(handle, agent, app, comd, context, cb);
                break;
            case 'logins':
                showLogins(handle, agent, app, comd, context, cb);
                break;
            case 'modules':
                showModules(handle, agent, comd, context, cb);
                break;
            case 'status':
                showStatus(handle, agent, comd, context, cb);
                break;
            case 'config':
                showConfig(handle, agent, app, comd, context, param, cb);
                break;
            case 'proxy':
                showProxy(handle, agent, app, comd, context, param, cb);
                break;
            case 'handler':
                showHandler(handle, agent, app, comd, context, param, cb);
                break;
            case 'components':
                showComponents(handle, agent, app, comd, context, param, cb);
                break;
            case 'settings':
                showSettings(handle, agent, app, comd, context, param, cb);
                break;
            case 'cpu':
                dumpCPU(handle, agent, comd, context, param, cb);
                break;
            case 'memory':
                dumpMemory(handle, agent, comd, context, param, cb);
                break;
            case 'get':
                getApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'set':
                setApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'enable':
                enableApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'disable':
                disableApp(handle, agent, app, comd, context, param, cb);
                break;
            case 'run':
                runScript(handle, agent, app, comd, context, param, cb);
                break;
            default:
                showError(handle, agent, comd, context, cb);
        }
    }
}
exports.WatchServerModule = WatchServerModule;
WatchServerModule.moduleId = 'watchServer';
function showServers(handle, agent_, comd, context, cb) {
    if (handle === 'client') {
        let agent = agent_;
        let sid, record;
        let serverInfo = {};
        let count = Object.keys(agent.idMap).length;
        let latch = countDownLatch.createCountDownLatch(count, function () {
            cb(null, {
                msg: serverInfo
            });
        });
        for (sid in agent.idMap) {
            record = agent.idMap[sid];
            agent.request(record.id, WatchServerModule.moduleId, {
                comd: comd,
                context: context
            }, function (err, msg) {
                serverInfo[msg.serverId] = msg.body;
                latch.done();
            });
        }
    }
    else if (handle === 'monitor') {
        let agent = agent_;
        let serverId = agent.id;
        let serverType = agent.type;
        let info = agent.info;
        let pid = process.pid;
        let heapUsed = (process.memoryUsage().heapUsed / (1000 * 1000)).toFixed(2);
        let uptime = (process.uptime() / 60).toFixed(2);
        cb(null, {
            serverId: serverId,
            body: {
                serverId: serverId,
                serverType: serverType,
                host: info['host'],
                port: info['port'],
                pid: pid,
                heapUsed: heapUsed,
                uptime: uptime
            }
        });
    }
}
function showConnections(handle, _agent, app, comd, context, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            let sid, record;
            let serverInfo = {};
            let count = 0;
            for (let key in agent.idMap) {
                if (agent.idMap[key].info.frontend) {
                    count++;
                }
            }
            let latch = countDownLatch.createCountDownLatch(count, function () {
                cb(null, {
                    msg: serverInfo
                });
            });
            for (sid in agent.idMap) {
                record = agent.idMap[sid];
                if (record.info.frontend) {
                    agent.request(record.id, WatchServerModule.moduleId, {
                        comd: comd,
                        context: context
                    }, function (err, msg) {
                        serverInfo[msg.serverId] = msg.body;
                        latch.done();
                    });
                }
            }
        }
        else {
            let record = agent.idMap[context];
            if (!record) {
                cb('the server ' + context + ' not exist');
            }
            if (record.info.frontend) {
                agent.request(record.id, WatchServerModule.moduleId, {
                    comd: comd,
                    context: context
                }, function (err, msg) {
                    let serverInfo = {};
                    serverInfo[msg.serverId] = msg.body;
                    cb(null, {
                        msg: serverInfo
                    });
                });
            }
            else {
                cb('\nthis command should be applied to frontend server\n');
            }
        }
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let connection = app.components.__connection__;
        if (!connection) {
            cb(null, {
                serverId: agent.id,
                body: 'error'
            });
            return;
        }
        cb(null, {
            serverId: agent.id,
            body: connection.getStatisticsInfo()
        });
    }
}
function showLogins(handle, _agent, app, comd, context, cb) {
    showConnections(handle, _agent, app, comd, context, cb);
}
function showModules(handle, _agent, comd, context, cb) {
    let modules = _agent.consoleService.modules;
    let result = [];
    for (let module in modules) {
        result.push(module);
    }
    cb(null, {
        msg: result
    });
}
function showStatus(handle, _agent, comd, context, cb) {
    if (handle === 'client') {
        let agent = _agent;
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            context: context
        }, function (err, msg) {
            cb(null, {
                msg: msg
            });
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let serverId = agent.id;
        let pid = process.pid;
        let params = {
            serverId: serverId,
            pid: String(pid)
        };
        monitor.psmonitor.getPsInfo(params, function (err, data) {
            cb(null, {
                serverId: agent.id,
                body: data
            });
        });
    }
}
function showConfig(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (param === 'master') {
            cb(null, {
                masterConfig: app.get('masterConfig') || 'no config to master in app.js',
                masterInfo: app.get('master')
            });
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, cb);
    }
    else if (handle === 'monitor') {
        let key = param + 'Config';
        cb(null, clone(param, app.get(key)));
    }
}
function showProxy(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        proxyCb(app, context, cb);
    }
}
function showHandler(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        handlerCb(app, context, cb);
    }
}
function showComponents(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let _components = app.components;
        let res = {};
        for (let key in _components) {
            let name = getComponentName(key);
            res[name] = clone(name, app.get(name + 'Config'));
        }
        cb(null, res);
    }
}
function showSettings(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let _settings = app.settings;
        let res = {};
        for (let key in _settings) {
            if (key.match(/^__\w+__$/) || key.match(/\w+Config$/)) {
                continue;
            }
            if (!checkJSON(_settings[key])) {
                res[key] = 'Object';
                continue;
            }
            res[key] = _settings[key];
        }
        cb(null, res);
    }
}
function dumpCPU(handle, _agent, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(err, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let times = param['times'];
        let filepath = param['filepath'];
        let force = param['force'];
        cb(null, 'cpu dump is unused in 1.0 of pinus');
        /**
        if (!/\.cpuprofile$/.test(filepath)) {
            filepath = filepath + '.cpuprofile';
        }
        if (!times || !/^[0-9]*[1-9][0-9]*$/.test(times)) {
            cb('no times or times invalid error');
            return;
        }
        checkFilePath(filepath, force, function(err) {
            if (err) {
                cb(err);
                return;
            }
            //ndump.cpu(filepath, times);
            cb(null, filepath + ' cpu dump ok');
        });
        */
    }
}
function dumpMemory(handle, _agent, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(err, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let filepath = param['filepath'];
        let force = param['force'];
        if (!/\.heapsnapshot$/.test(filepath)) {
            filepath = filepath + '.heapsnapshot';
        }
        checkFilePath(filepath, force, function (err) {
            if (err) {
                cb(err);
                return;
            }
            let heapdump = null;
            try {
                heapdump = require('heapdump');
                heapdump.writeSnapshot(filepath);
                cb(null, filepath + ' memory dump ok');
            }
            catch (e) {
                cb('pinus-admin require heapdump');
            }
        });
    }
}
function getApp(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let res = app.get(param);
        if (!checkJSON(res)) {
            res = 'object';
        }
        cb(null, res || null);
    }
}
function setApp(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let key = param['key'];
        let value = param['value'];
        app.set(key, value);
        cb(null, 'set ' + key + ':' + value + ' ok');
    }
}
function enableApp(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        app.enable(param);
        cb(null, 'enable ' + param + ' ok');
    }
}
function disableApp(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        app.disable(param);
        cb(null, 'disable ' + param + ' ok');
    }
}
function runScript(handle, _agent, app, comd, context, param, cb) {
    if (handle === 'client') {
        let agent = _agent;
        if (context === 'all') {
            cb('context error');
            return;
        }
        agent.request(context, WatchServerModule.moduleId, {
            comd: comd,
            param: param,
            context: context
        }, function (err, msg) {
            cb(null, msg);
        });
    }
    else if (handle === 'monitor') {
        let agent = _agent;
        let ctx = {
            app: app,
            result: null
        };
        try {
            vm.createContext(ctx);
            vm.runInNewContext('result = ' + param, ctx);
            cb(null, util.inspect(ctx.result));
        }
        catch (e) {
            cb(null, e.stack);
        }
    }
}
function showError(handle, _agent, comd, context, cb) {
}
function clone(param, obj) {
    let result = {};
    let flag = 1;
    for (let key in obj) {
        if (typeof obj[key] === 'function' || typeof obj[key] === 'object') {
            continue;
        }
        flag = 0;
        result[key] = obj[key];
    }
    if (flag) {
        // return 'no ' + param + 'Config info';
    }
    return result;
}
function checkFilePath(filepath, force, cb) {
    if (!force && fs.existsSync(filepath)) {
        cb('filepath file exist');
        return;
    }
    fs.writeFile(filepath, 'test', function (err) {
        if (err) {
            cb('filepath invalid error');
            return;
        }
        fs.unlinkSync(filepath);
        cb(null);
    });
}
function proxyCb(app, context, cb) {
    let msg = {};
    let __proxy__ = app.components.__proxy__;
    if (__proxy__ && __proxy__.client && __proxy__.client.proxies.user) {
        let proxies = __proxy__.client.proxies.user;
        let server = app.getServerById(context);
        if (!server) {
            cb('no server with this id ' + context);
        }
        else {
            let type = server['serverType'];
            let tmp = proxies[type];
            msg[type] = {};
            for (let _proxy in tmp) {
                let r = tmp[_proxy];
                msg[type][_proxy] = {};
                for (let _rpc in r) {
                    if (typeof r[_rpc] === 'function') {
                        msg[type][_proxy][_rpc] = 'function';
                    }
                }
            }
            cb(undefined, msg);
        }
    }
    else {
        cb('no proxy loaded');
    }
}
function handlerCb(app, context, cb) {
    let msg = {};
    let __server__ = app.components.__server__;
    if (__server__ && __server__.server && __server__.server.handlerService && __server__.server.handlerService.handlerMap) {
        let handles = __server__.server.handlerService.handlerMap;
        let server = app.getServerById(context);
        if (!server) {
            cb('no server with this id ' + context);
        }
        else {
            let type = server['serverType'];
            let tmp = handles;
            msg[type] = {};
            for (let _p in tmp) {
                let r = tmp[_p];
                msg[type][_p] = {};
                for (let _r in r) {
                    if (typeof r[_r] === 'function') {
                        msg[type][_p][_r] = 'function';
                    }
                }
            }
            cb(null, msg);
        }
    }
    else {
        cb('no handler loaded');
    }
}
function getComponentName(c) {
    let t = c.match(/^__(\w+)__$/);
    if (t) {
        t = t[1];
    }
    return t;
}
function checkJSON(obj) {
    if (!obj) {
        return true;
    }
    try {
        JSON.stringify(obj);
    }
    catch (e) {
        return false;
    }
    return true;
}
//# sourceMappingURL=watchServer.js.map