"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localrun = exports.sshrun = exports.kill = exports.bindCpu = exports.run = exports.runServers = void 0;
const cp = require("child_process");
const pinus_logger_1 = require("pinus-logger");
const util = require("util");
const utils = require("../util/utils");
const Constants = require("../util/constants");
const os = require("os");
const pinus_1 = require("../pinus");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let cpus = {};
let env = Constants.RESERVED.ENV_DEV;
/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @return {Void}
 */
function runServers(app) {
    let server, servers;
    let condition = app.startId || app.type;
    switch (condition) {
        case Constants.RESERVED.MASTER:
            break;
        case Constants.RESERVED.ALL:
            servers = app.getServersFromConfig();
            for (let serverId in servers) {
                run(app, servers[serverId]);
            }
            break;
        default:
            server = app.getServerFromConfig(condition);
            if (!!server) {
                run(app, server);
            }
            else {
                servers = app.get(Constants.RESERVED.SERVERS)[condition];
                for (let i = 0; i < servers.length; i++) {
                    run(app, servers[i]);
                }
            }
    }
}
exports.runServers = runServers;
/**
 * Run server
 *
 * @param {Object} app current application context
 * @param {Object} server
 * @return {Void}
 */
function run(app, server, cb) {
    env = app.get(Constants.RESERVED.ENV);
    let cmd, key;
    if (utils.isLocal(server.host)) {
        let options = [];
        if (!!server.args) {
            if (typeof server.args === 'string') {
                options.push(server.args.trim());
            }
            else {
                options = options.concat(server.args);
            }
        }
        cmd = app.get(Constants.RESERVED.MAIN);
        options.push(cmd);
        options.push(util.format('env=%s', env));
        for (key in server) {
            if (key === Constants.RESERVED.CPU) {
                cpus[server.id] = server[key];
            }
            options.push(util.format('%s=%s', key, server[key]));
        }
        localrun(process.execPath, null, options, cb);
    }
    else {
        cmd = util.format('cd "%s" && "%s"', app.getBase(), process.execPath);
        let arg = server.args;
        if (arg !== undefined) {
            if (typeof arg === 'string') {
                cmd += ' ' + arg.trim();
            }
            else {
                for (let v of arg) {
                    cmd += ' ' + v.trim();
                }
            }
        }
        cmd += util.format(' "%s" env=%s ', app.get(Constants.RESERVED.MAIN), env);
        for (key in server) {
            if (key === Constants.RESERVED.CPU) {
                cpus[server.id] = server[key];
            }
            cmd += util.format(' %s=%s ', key, server[key]);
        }
        sshrun(cmd, server.host, cb);
    }
}
exports.run = run;
/**
 * Bind process with cpu
 *
 * @param {String} sid server id
 * @param {String} pid process id
 * @param {String} host server host
 * @return {Void}
 */
function bindCpu(sid, pid, host) {
    if (os.platform() === Constants.PLATFORM.LINUX && cpus[sid] !== undefined) {
        if (utils.isLocal(host)) {
            let options = [];
            options.push('-pc');
            options.push(String(cpus[sid]));
            options.push(pid);
            localrun(Constants.COMMAND.TASKSET, null, options);
        }
        else {
            let cmd = util.format('taskset -pc "%s" "%s"', cpus[sid], pid);
            sshrun(cmd, host);
        }
    }
}
exports.bindCpu = bindCpu;
/**
 * Kill application in all servers
 *
 * @param {String} pids  array of server's pid
 * @param {String} serverIds array of serverId
 */
function kill(pids, servers) {
    let cmd;
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        if (utils.isLocal(server.host)) {
            let options = [];
            if (os.platform() === Constants.PLATFORM.WIN) {
                cmd = Constants.COMMAND.TASKKILL;
                options.push('/pid');
                options.push('/f');
            }
            else {
                cmd = Constants.COMMAND.KILL;
                options.push(String(-9));
            }
            options.push(pids[i]);
            localrun(cmd, null, options);
        }
        else {
            if (os.platform() === Constants.PLATFORM.WIN) {
                cmd = util.format('taskkill /pid %s /f', pids[i]);
            }
            else {
                cmd = util.format('kill -9 %s', pids[i]);
            }
            sshrun(cmd, server.host);
        }
    }
}
exports.kill = kill;
/**
 * Use ssh to run command.
 *
 * @param {String} cmd command that would be executed in the remote server
 * @param {String} host remote server host
 * @param {Function} cb callback function
 *
 */
function sshrun(cmd, host, cb) {
    let args = [];
    args.push(host);
    // pinus masterha 命令下pinus.app为undefined
    if (pinus_1.pinus.app) {
        let ssh_params = pinus_1.pinus.app.get(Constants.RESERVED.SSH_CONFIG_PARAMS);
        if (!!ssh_params && Array.isArray(ssh_params)) {
            args = args.concat(ssh_params);
        }
    }
    args.push(cmd);
    logger.info('Executing ' + cmd + ' on ' + host + ':22');
    spawnProcess(Constants.COMMAND.SSH, host, args, cb);
    return;
}
exports.sshrun = sshrun;
/**
 * Run local command.
 *
 * @param {String} cmd
 * @param {Callback} callback
 *
 */
function localrun(cmd, host, options, callback) {
    logger.info('Executing ' + cmd + ' ' + options + ' locally');
    spawnProcess(cmd, host, options, callback);
}
exports.localrun = localrun;
/**
 * Fork child process to run command.
 *
 * @param {String} command
 * @param {Object} options
 * @param {Callback} callback
 *
 */
let spawnProcess = function (command, host, options, cb) {
    let child = null;
    if (env === Constants.RESERVED.ENV_DEV) {
        child = cp.spawn(command, options);
        let prefix = command === Constants.COMMAND.SSH ? '[' + host + '] ' : '';
        child.stderr.on('data', function (chunk) {
            let msg = chunk.toString();
            process.stderr.write(msg);
            if (!!cb) {
                cb(msg);
            }
        });
        child.stdout.on('data', function (chunk) {
            let msg = prefix + chunk.toString();
            process.stdout.write(msg);
        });
    }
    else {
        child = cp.spawn(command, options, { detached: true, stdio: 'inherit' });
        child.unref();
    }
    child.on('exit', function (code) {
        if (code !== 0) {
            logger.warn('child process exit with error, error code: %s, executed command: %s', code, command);
        }
        if (typeof cb === 'function') {
            cb(code);
        }
    });
};
//# sourceMappingURL=starter.js.map