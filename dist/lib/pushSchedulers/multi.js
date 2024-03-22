"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiPushScheduler = void 0;
const util_1 = require("util");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class MultiPushScheduler {
    constructor(app, opts) {
        opts = opts || {};
        let scheduler = opts.scheduler;
        if (Array.isArray(scheduler)) {
            this.scheduler = {};
            for (let sch of scheduler) {
                if (typeof sch.scheduler === 'function') {
                    this.scheduler[sch.id] = new sch.scheduler(app, sch.options);
                }
                else {
                    this.scheduler[sch.id] = sch.scheduler;
                }
            }
            if (!(0, util_1.isFunction)(opts.selector)) {
                throw new Error('MultiPushScheduler必须提供selector参数');
            }
            this.selector = opts.selector;
        }
        else {
            throw new Error('MultiPushScheduler必须提供scheduler参数');
        }
        this.app = app;
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    async start() {
        for (let k in this.scheduler) {
            let sch = this.scheduler[k];
            if (typeof sch.start === 'function') {
                await sch.start();
            }
        }
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    async stop() {
        for (let k in this.scheduler) {
            let sch = this.scheduler[k];
            if (typeof sch.stop === 'function') {
                await sch.stop();
            }
        }
    }
    /**
     * Schedule how the message to send.
     *
     * @param  {Number}   reqId request id
     * @param  {String}   route route string of the message
     * @param  {Object}   msg   message content after encoded
     * @param  {Array}    recvs array of receiver's session id
     * @param  {Object}   opts  options
     */
    schedule(reqId, route, msg, recvs, opts, cb) {
        let self = this;
        let id = self.selector(reqId, route, msg, recvs, opts);
        if (self.scheduler[id]) {
            self.scheduler[id].schedule(reqId, route, msg, recvs, opts, cb);
        }
        else {
            logger.error('invalid pushScheduler id, id: %j', id);
        }
    }
}
exports.MultiPushScheduler = MultiPushScheduler;
//# sourceMappingURL=multi.js.map