"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const console_1 = require("../../lib/modules/console");
const constants_1 = require("../utils/constants");
function default_1(program) {
    program.command('add')
        .description('add a new server')
        .option('-u, --username <username>', 'administration user name', constants_1.DEFAULT_USERNAME)
        .option('-p, --password <password>', 'administration password', constants_1.DEFAULT_PWD)
        .option('-h, --host <master-host>', 'master server host', constants_1.DEFAULT_MASTER_HOST)
        .option('-P, --port <master-port>', 'master server port', (value) => parseInt(value), constants_1.DEFAULT_MASTER_PORT)
        .action(function () {
        let args = [].slice.call(arguments, 0);
        let opts = args[args.length - 1];
        opts.args = args.slice(0, -1);
        add(opts);
    });
}
exports.default = default_1;
/**
 * Add server to application.
 *
 * @param {Object} opts options for `add` operation
 */
function add(opts) {
    let id = 'pinus_add_' + Date.now();
    (0, utils_1.connectToMaster)(id, opts, function (client) {
        client.request(console_1.ConsoleModule.moduleId, { signal: 'add', args: opts.args }, function (err) {
            if (err) {
                console.error(err);
            }
            else {
                console.info(constants_1.ADD_SERVER_INFO);
            }
            process.exit(0);
        });
    });
}
//# sourceMappingURL=add.js.map