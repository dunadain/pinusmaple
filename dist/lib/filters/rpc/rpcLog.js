"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcLogFilter = void 0;
/**
 * Filter for rpc log.
 * Record used time for remote process call.
 */
const pinus_logger_1 = require("pinus-logger");
let rpcLogger = (0, pinus_logger_1.getLogger)('rpc-log', __filename);
const utils = require("../../util/utils");
class RpcLogFilter {
    constructor() {
        this.name = 'rpcLog';
    }
    /**
     * Before filter for rpc
     */
    before(serverId, msg, opts, next) {
        opts = opts || {};
        opts.__start_time__ = Date.now();
        next();
    }
    /**
     * After filter for rpc
     */
    after(serverId, msg, opts, next) {
        if (!!opts && !!opts.__start_time__) {
            let start = opts.__start_time__;
            let end = Date.now();
            let timeUsed = end - start;
            let log = {
                route: msg.service,
                args: msg.args,
                time: utils.format(new Date(start)),
                timeUsed: timeUsed
            };
            rpcLogger.info(JSON.stringify(log));
        }
        next();
    }
}
exports.RpcLogFilter = RpcLogFilter;
//# sourceMappingURL=rpcLog.js.map