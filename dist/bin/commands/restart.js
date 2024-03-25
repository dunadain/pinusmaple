"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const console_1 = require("../../lib/modules/console");
const constants_1 = require("../utils/constants");
function default_1(program) {
    program.command('restart')
        .description('restart the servers, for multiple servers, use `pinus restart server-id-1 server-id-2`')
        .option('-u, --username <username>', 'administration user name', constants_1.DEFAULT_USERNAME)
        .option('-p, --password <password>', 'administration password', constants_1.DEFAULT_PWD)
        .option('-h, --host <master-host>', 'master server host', constants_1.DEFAULT_MASTER_HOST)
        .option('-P, --port <master-port>', 'master server port', (value) => parseInt(value), constants_1.DEFAULT_MASTER_PORT)
        .option('-t, --type <server-type>,', 'start server type')
        .option('-i, --id <server-id>', 'start server id')
        .action(function (opts) {
        restart(opts);
    });
}
exports.default = default_1;
function restart(opts) {
    let id = 'pinus_restart_' + Date.now();
    let serverIds = [];
    let type = '';
    if (!!opts.id) {
        serverIds.push(opts.id);
    }
    if (!!opts.type) {
        type = opts.type;
    }
    (0, utils_1.connectToMaster)(id, opts, function (client) {
        client.request(console_1.ConsoleModule.moduleId, { signal: 'restart', ids: serverIds, type: type }, function (err, fails) {
            if (!!err) {
                console.error(err);
            }
            else if (!!fails.length) {
                console.info('restart fails server ids: %j', fails);
            }
            else {
                console.info(constants_1.RESTART_SERVER_INFO);
            }
            process.exit(0);
        });
    });
}
//# sourceMappingURL=restart.js.map