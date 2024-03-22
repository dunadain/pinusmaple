"use strict";
/**
 * Scheduler component to schedule message sending.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSchedulerComponent = void 0;
const direct_1 = require("../pushSchedulers/direct");
const pinus_logger_1 = require("pinus-logger");
const multi_1 = require("../pushSchedulers/multi");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class PushSchedulerComponent {
    constructor(app, opts) {
        this.app = app;
        this.name = '__pushScheduler__';
        opts = opts || {};
        this.scheduler = getScheduler(this, app, opts);
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    afterStart() {
        return this.scheduler.start();
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    stop(force) {
        return this.scheduler.stop();
    }
    /**
     * Schedule how the message to send.
     *
     * @param  {Number}   reqId request id
     * @param  {String}   route route string of the message
     * @param  {Object}   msg   message content after encoded
     * @param  {Array}    recvs array of receiver's session id
     * @param  {Object}   opts  options
     * @param  {Function} cb
     */
    schedule(reqId, route, msg, recvs, opts, cb) {
        this.scheduler.schedule(reqId, route, msg, recvs, opts, cb);
    }
}
exports.PushSchedulerComponent = PushSchedulerComponent;
let getScheduler = function (pushSchedulerComp, app, opts) {
    let scheduler = opts.scheduler || direct_1.DirectPushScheduler;
    if (typeof scheduler === 'function') {
        return new scheduler(app, opts);
    }
    if (Array.isArray(scheduler)) {
        return new multi_1.MultiPushScheduler(app, opts);
    }
    return scheduler;
};
//# sourceMappingURL=pushScheduler.js.map