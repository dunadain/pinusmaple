"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../utils/constants");
const utils_1 = require("../utils/utils");
const colors = require("colors");
// @ts-ignore
const pc = require("pretty-columns");
const console_1 = require("../../lib/modules/console");
function default_1(program) {
    program.command('list')
        .description('list the servers')
        .option('-u, --username <username>', 'administration user name', constants_1.DEFAULT_USERNAME)
        .option('-p, --password <password>', 'administration password', constants_1.DEFAULT_PWD)
        .option('-h, --host <master-host>', 'master server host', constants_1.DEFAULT_MASTER_HOST)
        .option('-P, --port <master-port>', 'master server port', (value) => parseInt(value), constants_1.DEFAULT_MASTER_PORT)
        .action(function (opts) {
        list(opts);
    });
}
exports.default = default_1;
/**
 * List pinus processes.
 *
 * @param {Object} opts options for `list` operation
 */
function list(opts) {
    let id = 'pinus_list_' + Date.now();
    (0, utils_1.connectToMaster)(id, opts, function (client) {
        client.request(console_1.ConsoleModule.moduleId, { signal: 'list' }, function (err, data) {
            if (err) {
                console.error(err);
            }
            let servers = [];
            for (let key in data.msg) {
                servers.push(data.msg[key]);
            }
            let comparer = function (a, b) {
                if (a.serverType < b.serverType) {
                    return -1;
                }
                else if (a.serverType > b.serverType) {
                    return 1;
                }
                else if (a.serverId < b.serverId) {
                    return -1;
                }
                else if (a.serverId > b.serverId) {
                    return 1;
                }
                else {
                    return 0;
                }
            };
            servers.sort(comparer);
            let rows = [];
            rows.push([colors.red('serverId'), colors.blue('serverType'), colors.green('pid'), colors.cyan('rss(M)'), colors.magenta('heapTotal(M)'), colors.white('heapUsed(M)'), colors.yellow('uptime(m)')]);
            servers.forEach(function (server) {
                rows.push([server.serverId, server.serverType, server.pid, server.rss, server.heapTotal, server.heapUsed, server.uptime]);
            });
            pc.output(rows);
            process.exit(0);
        });
    });
}
//# sourceMappingURL=list.js.map