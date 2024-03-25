"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeFilter = void 0;
/**
 * Filter for statistics.
 * Record used time for each request.
 */
const pinus_logger_1 = require("pinus-logger");
let conLogger = (0, pinus_logger_1.getLogger)('con-log', __filename);
const utils = require("../../util/utils");
class TimeFilter {
    before(routeRecord, msg, session, next) {
        session.__startTime__ = Date.now();
        next(null);
    }
    after(err, routeRecord, msg, session, resp, next) {
        let start = session.__startTime__;
        if (typeof start === 'number') {
            let timeUsed = Date.now() - start;
            let log = {
                route: routeRecord === null || routeRecord === void 0 ? void 0 : routeRecord.route,
                args: msg,
                time: utils.format(new Date(start)),
                timeUsed: timeUsed
            };
            conLogger.info(JSON.stringify(log));
        }
        next(err);
    }
}
exports.TimeFilter = TimeFilter;
//# sourceMappingURL=time.js.map