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
        return this.app.sessionService.abind(sid, uid);
    }
    unbind(sid, uid) {
        return this.app.sessionService.aunbind(sid, uid);
    }
    push(sid, key, value) {
        return this.app.sessionService.aimport(sid, key, value);
    }
    pushAll(sid, settings) {
        return this.app.sessionService.aimportAll(sid, settings);
    }
    /**
     * Get session informations with session id.
     *
     * @param  {String}   sid session id binded with the session
     * @param  {Function} cb(err, sinfo)  callback funtion, sinfo would be null if the session not exist.
     */
    getBackendSessionBySid(sid) {
        let session = this.app.sessionService.get(sid);
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
        let sessions = this.app.sessionService.getByUid(uid);
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
        this.app.sessionService.akickBySessionId(sid, reason);
    }
    /**
     * Kick sessions by user id.
     *
     * @param  {Number|String}   uid user id
     * @param  {String}          reason     kick reason
     * @param  {Function} cb     callback function
     */
    kickByUid(uid, reason) {
        this.app.sessionService.kick(uid, reason);
    }
}
exports.SessionRemote = SessionRemote;
//# sourceMappingURL=sessionRemote.js.map