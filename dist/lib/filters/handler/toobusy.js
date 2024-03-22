"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToobusyFilter = void 0;
/**
 * Filter for toobusy.
 * if the process is toobusy, just skip the new request
 */
const pinus_logger_1 = require("pinus-logger");
let conLogger = (0, pinus_logger_1.getLogger)('con-log', __filename);
let toobusy = null;
let DEFAULT_MAXLAG = 70;
class ToobusyFilter {
    constructor(maxLag = DEFAULT_MAXLAG) {
        try {
            toobusy = require('toobusy');
        }
        catch (e) {
        }
        if (!!toobusy) {
            toobusy.maxLag(maxLag);
        }
    }
    before(routeRecord, msg, session, next) {
        if (!!toobusy && toobusy()) {
            conLogger.warn('[toobusy] reject request msg: ' + msg);
            let err = new Error('Server toobusy!');
            err.code = 500;
            next(err);
        }
        else {
            next(null);
        }
    }
}
exports.ToobusyFilter = ToobusyFilter;
//# sourceMappingURL=toobusy.js.map