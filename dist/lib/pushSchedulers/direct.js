"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectPushScheduler = void 0;
const utils = require("../util/utils");
class DirectPushScheduler {
    constructor(app, opts) {
        opts = opts || {};
        this.app = app;
    }
    async start() {
    }
    async stop() {
    }
    schedule(reqId, route, msg, recvs, opts, cb) {
        opts = opts || {};
        if (opts.type === 'broadcast') {
            this.doBroadcast(msg, opts.userOptions);
        }
        else {
            this.doBatchPush(msg, recvs);
        }
        if (cb) {
            process.nextTick(function () {
                utils.invokeCallback(cb);
            });
        }
    }
    doBroadcast(msg, opts) {
        let channelService = this.app.get('channelService');
        let sessionService = this.app.get('sessionService');
        if (opts.binded) {
            sessionService.forEachBindedSession(function (session) {
                if (channelService.broadcastFilter &&
                    !channelService.broadcastFilter(session, msg, opts.filterParam)) {
                    return;
                }
                sessionService.sendMessageByUid(session.uid, msg);
            });
        }
        else {
            sessionService.forEachSession(function (session) {
                if (channelService.broadcastFilter &&
                    !channelService.broadcastFilter(session, msg, opts.filterParam)) {
                    return;
                }
                sessionService.sendMessage(session.id, msg);
            });
        }
    }
    doBatchPush(msg, recvs) {
        let sessionService = this.app.get('sessionService');
        for (let i = 0, l = recvs.length; i < l; i++) {
            sessionService.sendMessage(recvs[i], msg);
        }
    }
}
exports.DirectPushScheduler = DirectPushScheduler;
//# sourceMappingURL=direct.js.map