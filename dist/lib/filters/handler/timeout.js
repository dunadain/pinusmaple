"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutFilter = void 0;
/**
 * Filter for timeout.
 * Print a warn information when request timeout.
 */
const pinus_logger_1 = require("pinus-logger");
let logger = (0, pinus_logger_1.getLogger)('pinus', __filename);
let DEFAULT_TIMEOUT = 3000;
let DEFAULT_SIZE = 500;
class TimeoutFilter {
    constructor(timeout = DEFAULT_TIMEOUT, maxSize = DEFAULT_SIZE) {
        this.timeout = timeout;
        this.maxSize = maxSize;
        this.timeouts = {};
        this.curId = 0;
        this.timeOutCount = 0;
    }
    before(routeRecord, msg, session, next) {
        if (this.timeOutCount > this.maxSize) {
            logger.warn('timeout filter is out of range, current size is %s, max size is %s', this.timeOutCount, this.maxSize);
            next(null);
            return;
        }
        this.curId++;
        this.timeOutCount++;
        this.timeouts[this.curId] = setTimeout(function () {
            logger.error('request %j timeout.', routeRecord ? routeRecord.route : routeRecord);
        }, this.timeout);
        session.__timeout__ = this.curId;
        next(null);
    }
    after(err, routeRecord, msg, session, resp, next) {
        let timeout = this.timeouts[session.__timeout__];
        if (timeout) {
            clearTimeout(timeout);
            this.timeOutCount--;
            this.timeouts[session.__timeout__] = undefined;
        }
        next(err);
    }
}
exports.TimeoutFilter = TimeoutFilter;
//# sourceMappingURL=timeout.js.map