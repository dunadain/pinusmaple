"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleModule = void 0;
/*!
 * Pinus -- consoleModule serverStop stop/kill
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
const pinus_logger_1 = require("pinus-logger");
const countDownLatch = require("../util/countDownLatch");
const utils = require("../util/utils");
const Constants = require("../util/constants");
const starter = require("../master/starter");
const child_process_1 = require("child_process");
const path = require("path");
const os = require("os");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class ConsoleModule {
    constructor(opts) {
        opts = opts !== null && opts !== void 0 ? opts : {};
        this.app = opts.app;
    }
    monitorHandler(agent, msg, cb) {
        let serverId = agent.id;
        switch (msg.signal) {
            case 'stop':
                if (agent.type === Constants.RESERVED.MASTER) {
                    return;
                }
                this.app.stop(true);
                break;
            case 'list':
                let serverType = agent.type;
                let pid = process.pid;
                let heapUsed = (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2);
                let rss = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
                let heapTotal = (process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(2);
                let uptime = (process.uptime() / 60).toFixed(2);
                utils.invokeCallback(cb, {
                    serverId: serverId,
                    body: {
                        serverId: serverId,
                        serverType: serverType,
                        pid: pid,
                        rss: rss,
                        heapTotal: heapTotal,
                        heapUsed: heapUsed,
                        uptime: uptime
                    }
                });
                break;
            case 'kill':
                utils.invokeCallback(cb, serverId);
                if (agent.type !== 'master') {
                    setTimeout(function () {
                        process.exit(-1);
                    }, Constants.TIME.TIME_WAIT_MONITOR_KILL);
                }
                break;
            case 'addCron':
                this.app.addCrons([msg.cron]);
                break;
            case 'removeCron':
                this.app.removeCrons([msg.cron]);
                break;
            case 'blacklist':
                if (this.app.isFrontend()) {
                    let connector = this.app.components.__connector__;
                    connector.blacklist = connector.blacklist.concat(msg.blacklist);
                }
                break;
            case 'restart':
                if (agent.type === Constants.RESERVED.MASTER) {
                    return;
                }
                let self = this;
                let server = this.app.get(Constants.RESERVED.CURRENT_SERVER);
                utils.invokeCallback(cb, server);
                process.nextTick(function () {
                    self.app.stop(true);
                });
                break;
            default:
                logger.error('receive error signal: %j', msg);
                break;
        }
    }
    clientHandler(agent, msg, cb) {
        let app = this.app;
        switch (msg.signal) {
            case 'kill':
                kill(app, agent, msg, cb);
                break;
            case 'stop':
                stop(app, agent, msg, cb);
                break;
            case 'list':
                list(app, agent, msg, cb);
                break;
            case 'add':
                add(app, agent, msg, cb);
                break;
            case 'addCron':
                addCron(app, agent, msg, cb);
                break;
            case 'removeCron':
                removeCron(app, agent, msg, cb);
                break;
            case 'blacklist':
                blacklist(app, agent, msg, cb);
                break;
            case 'restart':
                restart(app, agent, msg, cb);
                break;
            default:
                utils.invokeCallback(cb, new Error('The command cannot be recognized, please check.'), null);
                break;
        }
    }
}
exports.ConsoleModule = ConsoleModule;
ConsoleModule.moduleId = '__console__';
let kill = function (app, agent, msg, cb) {
    let sid, record;
    let serverIds = [];
    let count = Object.keys(agent.idMap).length;
    let latch = countDownLatch.createCountDownLatch(count, { timeout: Constants.TIME.TIME_WAIT_MASTER_KILL }, function (isTimeout) {
        if (!isTimeout) {
            utils.invokeCallback(cb, null, { code: 'ok' });
        }
        else {
            utils.invokeCallback(cb, null, { code: 'remained', serverIds: serverIds });
        }
        setTimeout(function () {
            process.exit(-1);
        }, Constants.TIME.TIME_WAIT_MONITOR_KILL);
    });
    let agentRequestCallback = function (msg) {
        for (let i = 0; i < serverIds.length; ++i) {
            if (serverIds[i] === msg) {
                serverIds.splice(i, 1);
                latch.done();
                break;
            }
        }
    };
    for (sid in agent.idMap) {
        record = agent.idMap[sid];
        serverIds.push(record.id);
        agent.request(record.id, ConsoleModule.moduleId, { signal: msg.signal }, agentRequestCallback);
    }
};
let stop = function (app, agent, msg, cb) {
    let serverIds = msg.ids;
    if (!!serverIds.length) {
        let servers = app.getServers();
        app.set(Constants.RESERVED.STOP_SERVERS, serverIds);
        for (let i = 0; i < serverIds.length; i++) {
            let serverId = serverIds[i];
            if (!servers[serverId]) {
                utils.invokeCallback(cb, new Error('Cannot find the server to stop.'), null);
            }
            else {
                agent.notifyById(serverId, ConsoleModule.moduleId, { signal: msg.signal });
            }
        }
        utils.invokeCallback(cb, null, { status: 'part' });
    }
    else {
        let servers = app.getServers();
        let serverIds = [];
        for (let key in servers) {
            serverIds.push(key);
        }
        app.set(Constants.RESERVED.STOP_SERVERS, serverIds);
        agent.notifyAll(ConsoleModule.moduleId, { signal: msg.signal });
        setTimeout(function () {
            app.stop(true);
            utils.invokeCallback(cb, null, { status: 'all' });
        }, Constants.TIME.TIME_WAIT_STOP);
    }
};
let restart = function (app, agent, msg, cb) {
    let successFlag;
    let successIds = [];
    let serverIds = msg.ids;
    let type = msg.type;
    let servers;
    if (!serverIds.length && !!type) {
        servers = app.getServersByType(type);
        if (!servers) {
            utils.invokeCallback(cb, new Error('restart servers with unknown server type: ' + type));
            return;
        }
        for (let i = 0; i < servers.length; i++) {
            serverIds.push(servers[i].id);
        }
    }
    else if (!serverIds.length) {
        servers = app.getServers();
        for (let key in servers) {
            serverIds.push(key);
        }
    }
    let count = serverIds.length;
    let latch = countDownLatch.createCountDownLatch(count, { timeout: Constants.TIME.TIME_WAIT_COUNTDOWN }, function () {
        if (!successFlag) {
            utils.invokeCallback(cb, new Error('all servers start failed.'));
            return;
        }
        utils.invokeCallback(cb, null, utils.arrayDiff(serverIds, successIds));
    });
    let request = function (id) {
        return (function () {
            agent.request(id, ConsoleModule.moduleId, { signal: msg.signal }, function (msg) {
                if (!msg || !Object.keys(msg).length) {
                    latch.done();
                    return;
                }
                setTimeout(function () {
                    runServer(app, msg, function (err, status) {
                        if (!!err) {
                            logger.error('restart ' + id + ' failed.', err.message, 'status:', status);
                        }
                        else {
                            successIds.push(id);
                            successFlag = true;
                        }
                        latch.done();
                    });
                }, Constants.TIME.TIME_WAIT_RESTART);
            });
        })();
    };
    for (let j = 0; j < serverIds.length; j++) {
        request(serverIds[j]);
    }
};
let list = function (app, agent, msg, cb) {
    let sid, record;
    let serverInfo = {};
    let count = Object.keys(agent.idMap).length;
    let latch = countDownLatch.createCountDownLatch(count, { timeout: Constants.TIME.TIME_WAIT_COUNTDOWN }, function () {
        utils.invokeCallback(cb, null, { msg: serverInfo });
    });
    let callback = function (msg) {
        serverInfo[msg.serverId] = msg.body;
        latch.done();
    };
    for (sid in agent.idMap) {
        record = agent.idMap[sid];
        agent.request(record.id, ConsoleModule.moduleId, { signal: msg.signal }, callback);
    }
};
let add = function (app, agent, msg, cb) {
    if (checkCluster(msg)) {
        startCluster(app, msg, cb);
    }
    else {
        startServer(app, msg, cb);
    }
    reset(ServerInfo);
};
let addCron = function (app, agent, msg, cb) {
    let cron = parseArgs(msg, CronInfo, cb);
    sendCronInfo(cron, agent, msg, CronInfo, cb);
};
let removeCron = function (app, agent, msg, cb) {
    let cron = parseArgs(msg, RemoveCron, cb);
    sendCronInfo(cron, agent, msg, RemoveCron, cb);
};
let blacklist = function (app, agent, msg, cb) {
    let ips = msg.args;
    for (let i = 0; i < ips.length; i++) {
        if (!(new RegExp(/(\d+)\.(\d+)\.(\d+)\.(\d+)/g).test(ips[i]))) {
            utils.invokeCallback(cb, new Error('blacklist ip: ' + ips[i] + ' is error format.'), null);
            return;
        }
    }
    agent.notifyAll(ConsoleModule.moduleId, { signal: msg.signal, blacklist: msg.args });
    process.nextTick(function () {
        cb(null, { status: 'ok' });
    });
};
let checkPort = function (server, cb) {
    if (!server.port && !server.clientPort) {
        utils.invokeCallback(cb, 'leisure');
        return;
    }
    let p = server.port || server.clientPort;
    let host = server.host;
    //   let cmd = 'netstat -tln | grep ';
    let cmd = os.type() === 'Windows_NT' ?
        `netstat -ano | %windir%\\system32\\find.exe ` : `netstat -tln | grep `;
    if (!utils.isLocal(host)) {
        cmd = 'ssh ' + host + ' ' + cmd;
    }
    p = os.type() === 'Windows_NT' ? `"${p}"` : p;
    (0, child_process_1.exec)(cmd + p, function (err, stdout, stderr) {
        if (stdout || stderr) {
            logger.debug('checkport has error?', cmd + p, 'stdout:', stdout, 'stderr', stderr);
            utils.invokeCallback(cb, 'busy');
        }
        else {
            p = server.clientPort;
            p = os.type() === 'Windows_NT' ? `"${p}"` : p;
            (0, child_process_1.exec)(cmd + p, function (err, stdout, stderr) {
                if (stdout || stderr) {
                    utils.invokeCallback(cb, 'busy');
                }
                else {
                    utils.invokeCallback(cb, 'leisure');
                }
            });
        }
    });
};
let parseArgs = function (msg, info, cb) {
    let rs = {};
    let args = msg.args;
    for (let i = 0; i < args.length; i++) {
        if (args[i].indexOf('=') < 0) {
            cb(new Error('Error server parameters format.'), null);
            return;
        }
        let pairs = args[i].split('=');
        let key = pairs[0];
        if (!!info[key]) {
            info[key] = 1;
        }
        rs[pairs[0]] = pairs[1];
    }
    return rs;
};
let sendCronInfo = function (cron, agent, msg, info, cb) {
    if (isReady(info) && (cron.serverId || cron.serverType)) {
        if (!!cron.serverId) {
            agent.notifyById(cron.serverId, ConsoleModule.moduleId, { signal: msg.signal, cron: cron });
        }
        else {
            agent.notifyByType(cron.serverType, ConsoleModule.moduleId, { signal: msg.signal, cron: cron });
        }
        process.nextTick(function () {
            cb(null, { status: 'ok' });
        });
    }
    else {
        cb(new Error('Miss necessary server parameters.'), null);
    }
    reset(info);
};
let startServer = function (app, msg, cb) {
    let server = parseArgs(msg, ServerInfo, cb);
    if (isReady(ServerInfo)) {
        runServer(app, server, cb);
    }
    else {
        cb(new Error('Miss necessary server parameters.'), null);
    }
};
let runServer = function (app, server, cb) {
    checkPort(server, function (status) {
        if (status === 'busy') {
            utils.invokeCallback(cb, new Error('Port occupied already, check your server to add.'));
        }
        else {
            starter.run(app, server, function (err) {
                if (err) {
                    err = String(err);
                    const checkErrCorrect = 'https://nodejs.org/en/docs/inspector';
                    const idx = err.indexOf(checkErrCorrect);
                    if (idx === -1 || idx + checkErrCorrect.length + 10 < err.length) {
                        utils.invokeCallback(cb, new Error(err), null);
                        return;
                    }
                }
            });
            process.nextTick(function () {
                utils.invokeCallback(cb, null, { status: 'ok' });
            });
        }
    });
};
let startCluster = function (app, msg, cb) {
    let serverMap = {};
    let fails = [];
    let successFlag;
    let serverInfo = parseArgs(msg, ClusterInfo, cb);
    utils.loadCluster(app, serverInfo, serverMap);
    let count = Object.keys(serverMap).length;
    let latch = countDownLatch.createCountDownLatch(count, () => {
        if (!successFlag) {
            utils.invokeCallback(cb, new Error('all servers start failed.'));
            return;
        }
        utils.invokeCallback(cb, null, fails);
    });
    let start = function (server) {
        return (function () {
            checkPort(server, function (status) {
                if (status === 'busy') {
                    fails.push(server);
                    latch.done();
                }
                else {
                    starter.run(app, server, function (err) {
                        if (err) {
                            fails.push(server);
                            if (latch.count) {
                                latch.done();
                            }
                        }
                    });
                    process.nextTick(function () {
                        successFlag = true;
                        if (latch.count) {
                            latch.done();
                        }
                    });
                }
            });
        })();
    };
    for (let key in serverMap) {
        let server = serverMap[key];
        start(server);
    }
};
let checkCluster = function (msg) {
    let flag = false;
    let args = msg.args;
    for (let i = 0; i < args.length; i++) {
        if (utils.startsWith(args[i], Constants.RESERVED.CLUSTER_COUNT)) {
            flag = true;
        }
    }
    return flag;
};
let isReady = function (info) {
    for (let key in info) {
        if (info[key]) {
            return false;
        }
    }
    return true;
};
let reset = function (info) {
    for (let key in info) {
        info[key] = 0;
    }
};
let ServerInfo = {
    host: 0,
    port: 0,
    id: 0,
    serverType: 0
};
let CronInfo = {
    id: 0,
    action: 0,
    time: 0
};
let RemoveCron = {
    id: 0
};
let ClusterInfo = {
    host: 0,
    port: 0,
    clusterCount: 0
};
//# sourceMappingURL=console.js.map