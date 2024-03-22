"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const constants_1 = require("../utils/constants");
function default_1(program) {
    program.command('kill')
        .description('kill the application')
        .option('-u, --username <username>', 'administration user name', constants_1.DEFAULT_USERNAME)
        .option('-p, --password <password>', 'administration password', constants_1.DEFAULT_PWD)
        .option('-h, --host <master-host>', 'master server host', constants_1.DEFAULT_MASTER_HOST)
        .option('-P, --port <master-port>', 'master server port', (value) => parseInt(value), constants_1.DEFAULT_MASTER_PORT)
        .option('-f, --force', 'using this option would kill all the node processes')
        .action(function () {
        let args = [].slice.call(arguments, 0);
        let opts = args[args.length - 1];
        opts.serverIds = args.slice(0, -1);
        (0, utils_1.terminal)('kill', opts);
    });
}
exports.default = default_1;
//# sourceMappingURL=kill.js.map