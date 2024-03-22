"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = void 0;
const logger = require("pinus-logger");
/**
 * Configure pinus logger
 */
function configure(app, filename) {
    let serverId = app.getServerId();
    let base = app.getBase();
    logger.configure(filename, { serverId: serverId, base: base });
}
exports.configure = configure;
//# sourceMappingURL=log.js.map