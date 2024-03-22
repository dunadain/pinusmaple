"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferPushScheduler = void 0;
const utils = require("../util/utils");
let DEFAULT_FLUSH_INTERVAL = 20;
class BufferPushScheduler {
    constructor(app, opts) {
        this.sessions = {}; // sid -> msg queue
        this.tid = null;
        opts = opts || {};
        this.app = app;
        this.flushInterval = opts.flushInterval || DEFAULT_FLUSH_INTERVAL;
    }
    async start() {
        this.tid = setInterval(this.flush.bind(this), this.flushInterval);
    }
    async stop() {
        if (this.tid) {
            clearInterval(this.tid);
            this.tid = null;
        }
    }
    schedule(reqId, route, msg, recvs, opts, cb) {
        opts = opts || {};
        if (opts.type === 'broadcast') {
            this.doBroadcast(msg, opts.userOptions);
        }
        else {
            this.doBatchPush(msg, recvs);
        }
        process.nextTick(function () {
            utils.invokeCallback(cb);
        });
    }
    flush() {
        let sessionService = this.app.get('sessionService');
        let queue, session;
        for (let sid in this.sessions) {
            session = sessionService.get(Number(sid));
            if (!session) {
                continue;
            }
            queue = this.sessions[sid];
            if (!queue || queue.length === 0) {
                continue;
            }
            session.sendBatch(queue);
            this.sessions[sid] = [];
        }
    }
    doBroadcast(msg, opts) {
        let channelService = this.app.get('channelService');
        let sessionService = this.app.get('sessionService');
        if (opts.binded) {
            sessionService.forEachBindedSession((session) => {
                if (channelService.broadcastFilter &&
                    !channelService.broadcastFilter(session, msg, opts.filterParam)) {
                    return;
                }
                this.enqueue(session, msg);
            });
        }
        else {
            sessionService.forEachSession((session) => {
                if (channelService.broadcastFilter &&
                    !channelService.broadcastFilter(session, msg, opts.filterParam)) {
                    return;
                }
                this.enqueue(session, msg);
            });
        }
    }
    doBatchPush(msg, recvs) {
        let sessionService = this.app.get('sessionService');
        let session;
        for (let i = 0, l = recvs.length; i < l; i++) {
            session = sessionService.get(recvs[i]);
            if (session) {
                this.enqueue(session, msg);
            }
        }
    }
    enqueue(session, msg) {
        let queue = this.sessions[session.id];
        if (!queue) {
            queue = this.sessions[session.id] = [];
            session.once('closed', this.onClose.bind(this));
        }
        queue.push(msg);
    }
    onClose(session) {
        delete this.sessions[session.id];
    }
}
exports.BufferPushScheduler = BufferPushScheduler;
//# sourceMappingURL=buffer.js.map