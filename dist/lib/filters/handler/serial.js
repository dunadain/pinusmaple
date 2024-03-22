"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialFilter = void 0;
/**
 * Filter to keep request sequence.
 */
const pinus_logger_1 = require("pinus-logger");
const taskManager = require("../../common/manager/taskManager");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class SerialFilter {
    constructor(timeout, timeOutResponse) {
        this.timeout = timeout;
        this.timeOutResponse = timeOutResponse;
    }
    /**
     * request serialization after filter
     */
    before(routeRecord, msg, session, next) {
        taskManager.addTask(session.id, function (task) {
            session.__serialTask__ = task;
            next(null);
        }, () => {
            logger.error('[serial filter] msg timeout, msg:' + JSON.stringify(msg) + ' routeRecord:' + JSON.stringify(routeRecord));
            if (this.timeOutResponse) {
                next(new Error('msg timeout:' + session.id + ' uid:' + (session.uid ? session.uid : '')), this.timeOutResponse);
            }
        }, this.timeout);
    }
    /**
     * request serialization after filter
     */
    after(err, routeRecord, msg, session, resp, next) {
        let task = session.__serialTask__;
        if (task) {
            if (!task.done() && !err) {
                err = new Error('task time out. msg:' + JSON.stringify(msg));
            }
        }
        next(err);
    }
}
exports.SerialFilter = SerialFilter;
//# sourceMappingURL=serial.js.map