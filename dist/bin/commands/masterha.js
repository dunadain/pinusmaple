"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const constants = require("../../lib/util/constants");
const utils_1 = require("../utils/utils");
const constants_1 = require("../utils/constants");
function default_1(program) {
    program.command('masterha')
        .description('start all the slaves of the master')
        .option('-d, --directory <directory>', 'the code directory', constants_1.DEFAULT_GAME_SERVER_DIR)
        .action(function (opts) {
        startMasterha(opts);
    });
}
exports.default = default_1;
/**
 * Start master slaves.
 *
 * @param {String} option for `startMasterha` operation
 */
function startMasterha(opts) {
    let configFile = path.join(opts.directory, constants.FILEPATH.MASTER_HA);
    if (!fs.existsSync(configFile)) {
        (0, utils_1.abort)(constants_1.MASTER_HA_NOT_FOUND);
    }
    let masterha = require(configFile).masterha;
    for (let i = 0; i < masterha.length; i++) {
        let server = masterha[i];
        server.mode = constants.RESERVED.STAND_ALONE;
        server.masterha = 'true';
        server.home = opts.directory;
        (0, utils_1.runServer)(server);
    }
}
//# sourceMappingURL=masterha.js.map