"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminal = exports.runServer = exports.abort = exports.prompt = exports.confirm = exports.connectToMaster = exports.version = void 0;
const os = require("os");
const path = require("path");
const util = require("util");
const constants_1 = require("./constants");
const utils = require("../../lib/util/utils");
const starter = require("../../lib/master/starter");
const constants = require("../../lib/util/constants");
const pinus_admin_1 = require("pinus-admin");
const child_process_1 = require("child_process");
const console_1 = require("../../lib/modules/console");
exports.version = require('../../../package.json').version;
function connectToMaster(id, opts, cb) {
    let client = new pinus_admin_1.AdminClient({ username: opts.username, password: opts.password, md5: true });
    client.connect(id, opts.host, opts.port, function (err) {
        if (err) {
            abort(constants_1.CONNECT_ERROR + err.red);
        }
        if (typeof cb === 'function') {
            cb(client);
        }
    });
}
exports.connectToMaster = connectToMaster;
/**
 * Prompt confirmation with the given `msg`.
 *
 * @param {String} msg
 * @param {Function} fn
 */
function confirm(msg, fn) {
    prompt(msg, function (val) {
        fn(/^ *y(es)?/i.test(val));
    });
}
exports.confirm = confirm;
/**
 * Prompt input with the given `msg` and callback `fn`.
 *
 * @param {String} msg
 * @param {Function} fn
 */
function prompt(msg, fn) {
    if (' ' === msg[msg.length - 1]) {
        process.stdout.write(msg);
    }
    else {
        console.log(msg);
    }
    process.stdin.setEncoding('ascii');
    process.stdin.once('data', function (data) {
        fn(data);
    }).resume();
}
exports.prompt = prompt;
/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */
function abort(str) {
    console.error(str);
    process.exit(1);
}
exports.abort = abort;
/**
 * Run server.
 *
 * @param {Object} server server information
 */
function runServer(server) {
    let cmd, key;
    let main = path.resolve(server.home, 'app.js');
    if (utils.isLocal(server.host)) {
        let options = [];
        options.push(main);
        for (key in server) {
            options.push(util.format('%s=%s', key, server[key]));
        }
        starter.localrun(process.execPath, null, options);
    }
    else {
        cmd = util.format('cd "%s" && "%s"', server.home, process.execPath);
        cmd += util.format(' "%s" ', main);
        for (key in server) {
            cmd += util.format(' %s=%s ', key, server[key]);
        }
        starter.sshrun(cmd, server.host);
    }
}
exports.runServer = runServer;
/**
 * Terminal application.
 *
 * @param {String} signal stop/kill
 * @param {Object} opts options for `stop/kill` operation
 */
function terminal(signal, opts) {
    console.info(constants_1.CLOSEAPP_INFO);
    // option force just for `kill`
    if (opts.force) {
        if (os.platform() === constants.PLATFORM.WIN) {
            (0, child_process_1.exec)(constants_1.KILL_CMD_WIN);
        }
        else {
            (0, child_process_1.exec)(constants_1.KILL_CMD_LUX);
        }
        process.exit(1);
        return;
    }
    let id = 'pinus_terminal_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request(console_1.ConsoleModule.moduleId, {
            signal: signal, ids: opts.serverIds
        }, function (err, msg) {
            if (err) {
                console.error(err);
            }
            if (signal === 'kill') {
                if (msg.code === 'ok') {
                    console.log('All the servers have been terminated!');
                }
                else {
                    console.log('There may be some servers remained:', msg.serverIds);
                }
            }
            process.exit(0);
        });
    });
}
exports.terminal = terminal;
//# sourceMappingURL=utils.js.map