"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRemote = void 0;
function default_1(app) {
    return new SessionRemote(app);
}
exports.default = default_1;
class SessionRemote {
    constructor(app) {
        this.app = app;
    }
    bind(sid, uid) {
        var _a;
        (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.bind(sid, uid);
    }
    unbind(sid, uid) {
        var _a;
        (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.unbind(sid, uid);
    }
    push(sid, key, value) {
        var _a;
        return (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.aimport(sid, key, value);
    }
    pushAll(sid, settings) {
        var _a;
        return (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.aimportAll(sid, settings);
    }
    /**
     * Get session informations with session id.
     *
     * @param  {String}   sid session id binded with the session
     * @param  {Function} cb(err, sinfo)  callback funtion, sinfo would be null if the session not exist.
     */
    getBackendSessionBySid(sid) {
        var _a;
        let session = (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.get(sid);
        if (!session) {
            return;
        }
        return session.toFrontendSession().export();
    }
    /**
     * Get all the session informations with the specified user id.
     *
     * @param  {String}   uid user id binded with the session
     * @param  {Function} cb(err, sinfo)  callback funtion, sinfo would be null if the session does not exist.
     */
    getBackendSessionsByUid(uid) {
        var _a;
        let sessions = (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.getByUid(uid);
        if (!sessions) {
            return;
        }
        let res = [];
        for (let i = 0, l = sessions.length; i < l; i++) {
            res.push(sessions[i].toFrontendSession().export());
        }
        return res;
    }
    /**
     * Kick a session by session id.
     *
     * @param  {Number}   sid session id
     * @param  {String}   reason  kick reason
     * @param  {Function} cb  callback function
     */
    kickBySid(sid, reason) {
        var _a;
        (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.kickBySessionId(sid, reason);
    }
    /**
     * Kick sessions by user id.
     *
     * @param  {Number|String}   uid user id
     * @param  {String}          reason     kick reason
     * @param  {Function} cb     callback function
     */
    kickByUid(uid, reason) {
        var _a;
        (_a = this.app.sessionService) === null || _a === void 0 ? void 0 : _a.kick(uid, reason);
    }
}
exports.SessionRemote = SessionRemote;
//# sourceMappingURL=sessionRemote.js.map