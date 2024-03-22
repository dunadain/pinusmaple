"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const constants = require("../../lib/util/constants");
const utils_1 = require("../utils/utils");
const constants_1 = require("../utils/constants");
const child_process_1 = require("child_process");
function default_1(program) {
    program.command('start')
        .description('start the application')
        .option('-e, --env <env>', 'the used environment', constants_1.DEFAULT_ENV)
        .option('-D, --daemon', 'enable the daemon start')
        .option('-d, --directory, <directory>', 'the code directory', constants_1.DEFAULT_GAME_SERVER_DIR)
        .option('-t, --type <server-type>,', 'start server type')
        .option('-i, --id <server-id>', 'start server id')
        .action(function (opts) {
        start(opts);
    });
}
exports.default = default_1;
/**
 * Start application.
 *
 * @param {Object} opts options for `start` operation
 */
function start(opts) {
    let absScript = path.resolve(opts.directory, 'app.js');
    if (!fs.existsSync(absScript)) {
        (0, utils_1.abort)(constants_1.SCRIPT_NOT_FOUND);
    }
    let logDir = path.resolve(opts.directory, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    let ls;
    let type = opts.type || constants.RESERVED.ALL;
    let params = [absScript, 'env=' + opts.env, 'type=' + type];
    if (!!opts.id) {
        params.push('startId=' + opts.id);
    }
    if (opts.daemon) {
        ls = (0, child_process_1.spawn)(process.execPath, params, { detached: true, stdio: 'ignore' });
        ls.unref();
        console.log(constants_1.DAEMON_INFO);
        process.exit(0);
    }
    else {
        ls = (0, child_process_1.spawn)(process.execPath, params);
        ls.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        ls.stderr.on('data', function (data) {
            console.log(data.toString());
        });
    }
}
//# sourceMappingURL=start.js.map