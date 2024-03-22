"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcToobusyFilter = void 0;
/**
 * Filter for rpc log.
 * Reject rpc request when toobusy
 */
const pinus_logger_1 = require("pinus-logger");
let rpcLogger = (0, pinus_logger_1.getLogger)('rpc-log', __filename);
let toobusy = null;
let DEFAULT_MAXLAG = 70;
class RpcToobusyFilter {
    constructor(maxLag = DEFAULT_MAXLAG) {
        this.name = 'toobusy';
        try {
            toobusy = require('toobusy');
        }
        catch (e) {
        }
        if (!!toobusy) {
            toobusy.maxLag(maxLag);
        }
    }
    /**
     * Before filter for rpc
     */
    before(serverId, msg, opts, next) {
        opts = opts || {};
        if (!!toobusy && toobusy()) {
            rpcLogger.warn('Server too busy for rpc request, serverId:' + serverId + ' msg: ' + msg);
            let err = new Error('Backend server ' + serverId + ' is too busy now!');
            err.code = 500;
            next(err);
        }
        else {
            next();
        }
    }
}
exports.RpcToobusyFilter = RpcToobusyFilter;
//# sourceMappingURL=toobusy.js.map