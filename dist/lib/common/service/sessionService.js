"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendSession = exports.Session = exports.SessionService = void 0;
const events_1 = require("events");
const pinus_logger_1 = require("pinus-logger");
const utils = require("../../util/utils");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let FRONTEND_SESSION_FIELDS = ['id', 'frontendId', 'uid', '__sessionService__'];
let EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings'];
let ST_INITED = 0;
let ST_CLOSED = 1;
/**
 * Session service maintains the internal session for each client connection.
 *
 * Session service is created by session component and is only
 * <b>available</b> in frontend servers. You can access the service by
 * `app.get('sessionService')` or `app.sessionService` in frontend servers.
 *
 * @param {Object} opts constructor parameters
 * @class
 * @constructor
 */
class SessionService {
    constructor(opts) {
        // akick: (uid: UID, reason?: string) => Promise<void> = utils.promisify(this.kick.bind(this));
        // akickBySessionId: (sid: SID, reason?: string) => Promise<void> = utils.promisify(this.kickBySessionId.bind(this));
        // abind: (sid: SID, uid: UID) => Promise<void> = utils.promisify(this.bind.bind(this));
        // aunbind: (sid: SID, uid: UID) => Promise<void> = utils.promisify(this.unbind.bind(this));
        this.aimport = utils.promisify(this.import.bind(this));
        this.aimportAll = utils.promisify(this.importAll.bind(this));
        opts = opts || {};
        this.singleSession = !!opts.singleSession;
        this.sessions = {}; // sid -> session
        this.uidMap = {}; // uid -> sessions
    }
    /**
     * Create and return internal session.
     *
     * @param {Integer} sid uniqe id for the internal session
     * @param {String} frontendId frontend server in which the internal session is created
     * @param {Object} socket the underlying socket would be held by the internal session
     *
     * @return {Session}
     *
     * @memberOf SessionService
     * @api private
     */
    create(sid, frontendId, socket) {
        let session = new Session(sid, frontendId, socket, this);
        this.sessions[session.id] = session;
        return session;
    }
    /**
     * Bind the session with a user id.
     *
     * @memberOf SessionService
     * @api private
     */
    bind(sid, uid) {
        let session = this.sessions[sid];
        if (!session) {
            throw new Error('session does not exist, sid: ' + sid);
        }
        if (session.uid) {
            if (session.uid === uid) {
                console.log('already bound with the same uid');
                return;
            }
            // already bound with other uid
            throw new Error('session has already bound with ' + session.uid);
        }
        let sessions = this.uidMap[uid];
        if (this.singleSession && sessions && sessions.length > 0) {
            throw new Error('singleSession is enabled, and session has already bound with uid: ' + uid);
        }
        if (!sessions) {
            sessions = this.uidMap[uid] = [];
        }
        for (let i = 0, l = sessions.length; i < l; i++) {
            // session has binded with the uid
            if (sessions[i].id === session.id) {
                return;
            }
        }
        sessions.push(session);
        session.bind(uid);
    }
    /**
     * Unbind a session with the user id.
     *
     * @memberOf SessionService
     * @api private
     */
    unbind(sid, uid) {
        let session = this.sessions[sid];
        if (!session) {
            throw new Error('session does not exist, sid: ' + sid);
        }
        if (!session.uid || session.uid !== uid) {
            throw new Error('session has not bind with ' + session.uid);
        }
        let sessions = this.uidMap[uid], sess;
        if (sessions) {
            for (let i = 0, l = sessions.length; i < l; i++) {
                sess = sessions[i];
                if (sess.id === sid) {
                    sessions.splice(i, 1);
                    break;
                }
            }
            if (sessions.length === 0) {
                delete this.uidMap[uid];
            }
        }
        session.unbind(uid);
    }
    /**
     * Get session by id.
     *
     * @param {Number} id The session id
     * @return {Session}
     *
     * @memberOf SessionService
     * @api private
     */
    get(sid) {
        return this.sessions[sid];
    }
    /**
     * Get sessions by userId.
     *
     * @param {Number} uid User id associated with the session
     * @return {Array} list of session binded with the uid
     *
     * @memberOf SessionService
     * @api private
     */
    getByUid(uid) {
        return this.uidMap[uid];
    }
    /**
     * Remove session by key.
     *
     * @param {Number} sid The session id
     *
     * @memberOf SessionService
     * @api private
     */
    remove(sid) {
        let session = this.sessions[sid];
        if (session) {
            let uid = session.uid;
            delete this.sessions[session.id];
            let sessions = this.uidMap[uid];
            if (!sessions) {
                return;
            }
            for (let i = 0, l = sessions.length; i < l; i++) {
                if (sessions[i].id === sid) {
                    sessions.splice(i, 1);
                    if (sessions.length === 0) {
                        delete this.uidMap[uid];
                    }
                    break;
                }
            }
        }
    }
    /**
     * Import the key/value into session.
     *
     * @api private
     */
    import(sid, key, value, cb) {
        let session = this.sessions[sid];
        if (!session) {
            utils.invokeCallback(cb, new Error('session does not exist, sid: ' + sid));
            return;
        }
        session.set(key, value);
        utils.invokeCallback(cb);
    }
    /**
     * Import new value for the existed session.
     *
     * @memberOf SessionService
     * @api private
     */
    importAll(sid, settings, cb) {
        let session = this.sessions[sid];
        if (!session) {
            utils.invokeCallback(cb, new Error('session does not exist, sid: ' + sid));
            return;
        }
        for (let f in settings) {
            session.set(f, settings[f]);
        }
        utils.invokeCallback(cb);
    }
    /**
     * Kick all the session offline under the user id.
     *
     * @param {Number}   uid user id asscociated with the session
     * @param {Function} cb  callback function
     *
     * @memberOf SessionService
     */
    kick(uid, reason = 'kick') {
        let sessions = this.getByUid(uid);
        if (sessions) {
            // notify client
            let sids = [];
            for (let i = 0; i < sessions.length; ++i) {
                sids.push(sessions[i].id);
            }
            for (let i = 0; i < sids.length; ++i) {
                const sid = sids[i];
                this.sessions[sid].closed(reason);
            }
        }
    }
    /**
     * Kick a user offline by session id.
     *
     * @param {Number}   sid session id
     * @param {Function} cb  callback function
     *
     * @memberOf SessionService
     */
    kickBySessionId(sid, reason = 'kick') {
        let session = this.get(sid);
        if (session) {
            // notify client
            session.closed(reason);
        }
    }
    /**
     * Get client remote address by session id.
     *
     * @param {Number}   sid session id
     * @return {Object} remote address of client
     *
     * @memberOf SessionService
     */
    getClientAddressBySessionId(sid) {
        let session = this.get(sid);
        if (session) {
            let socket = session.__socket__;
            return socket.remoteAddress;
        }
        else {
            return null;
        }
    }
    /**
     * Send message to the client by session id.
     *
     * @param {String} sid session id
     * @param {Object} msg message to send
     *
     * @memberOf SessionService
     * @api private
     */
    sendMessage(sid, msg) {
        let session = this.sessions[sid];
        if (!session) {
            logger.debug('Fail to send message for non-existing session, sid: ' + sid + ' msg: ' + msg);
            return false;
        }
        return send(this, session, msg);
    }
    /**
     * Send message to the client by user id.
     *
     * @param {String} uid userId
     * @param {Object} msg message to send
     *
     * @memberOf SessionService
     * @api private
     */
    sendMessageByUid(uid, msg) {
        let sessions = this.uidMap[uid];
        if (!sessions) {
            logger.debug('fail to send message by uid for non-existing session. uid: %j', uid);
            return false;
        }
        for (let i = 0, l = sessions.length; i < l; i++) {
            send(this, sessions[i], msg);
        }
    }
    /**
     * Iterate all the session in the session service.
     *
     * @param  {Function} cb callback function to fetch session
     * @api private
     */
    forEachSession(cb) {
        for (let sid in this.sessions) {
            cb(this.sessions[sid]);
        }
    }
    /**
     * Iterate all the binded session in the session service.
     *
     * @param  {Function} cb callback function to fetch session
     * @api private
     */
    forEachBindedSession(cb) {
        let i, l, sessions;
        for (let uid in this.uidMap) {
            sessions = this.uidMap[uid];
            for (i = 0, l = sessions.length; i < l; i++) {
                cb(sessions[i]);
            }
        }
    }
    /**
     * Get sessions' quantity in specified server.
     *
     */
    getSessionsCount() {
        return Object.keys(this.sessions).length;
    }
}
exports.SessionService = SessionService;
/**
 * Send message to the client that associated with the session.
 *
 * @api private
 */
let send = function (service, session, msg) {
    session.send(msg);
    return true;
};
/**
 * Session maintains the relationship between client connection and user information.
 * There is a session associated with each client connection. And it should bind to a
 * user id after the client passes the identification.
 *
 * Session is created in frontend server and should not be accessed in handler.
 * There is a proxy class called BackendSession in backend servers and FrontendSession
 * in frontend servers.
 */
class Session extends events_1.EventEmitter {
    constructor(sid, frontendId, socket, service) {
        super();
        this.id = sid; // r
        this.frontendId = frontendId; // r
        this.uid = ''; // r
        this.settings = {};
        // private
        this.__socket__ = socket;
        this.__sessionService__ = service;
        this.__state__ = ST_INITED;
    }
    /*
     * Export current session as frontend session.
     */
    toFrontendSession() {
        return new FrontendSession(this);
    }
    /**
     * Bind the session with the the uid.
     *
     * @param {Number} uid User id
     * @api public
     */
    bind(uid) {
        this.uid = uid;
        this.emit('bind', uid);
    }
    /**
     * Unbind the session with the the uid.
     *
     * @param {Number} uid User id
     * @api private
     */
    unbind(uid) {
        this.uid = '';
        this.emit('unbind', uid);
    }
    set(keyOrValues, value) {
        if (utils.isObject(keyOrValues)) {
            let values = keyOrValues;
            for (let i in values) {
                this.settings[i] = values[i];
            }
        }
        else {
            this.settings[keyOrValues] = value;
        }
    }
    /**
     * Remove value from the session.
     *
     * @param {String} key session key
     * @api public
     */
    remove(key) {
        delete this.settings[key];
    }
    /**
     * Get value from the session.
     *
     * @param {String} key session key
     * @return {Object} value associated with session key
     * @api public
     */
    get(key) {
        return this.settings[key];
    }
    /**
     * Send message to the session.
     *
     * @param  {Object} msg final message sent to client
     */
    send(msg) {
        this.__socket__.send(msg);
    }
    /**
     * Send message to the session in batch.
     *
     * @param  {Array} msgs list of message
     */
    sendBatch(msgs) {
        this.__socket__.sendBatch(msgs);
    }
    /**
     * Closed callback for the session which would disconnect client in next tick.
     *
     * @api public
     */
    closed(reason) {
        if (this.__state__ === ST_CLOSED) {
            return;
        }
        logger.debug('session on [%s] is closed with session id: %s,uid:%s,reason:%j', this.frontendId, this.id, this.uid, reason);
        this.__state__ = ST_CLOSED;
        this.__sessionService__.remove(this.id);
        this.emit('closed', this.toFrontendSession(), reason);
        this.__socket__.emit('closing', reason);
        let self = this;
        // give a chance to send disconnect message to client
        process.nextTick(function () {
            self.__socket__.disconnect();
        });
    }
    /**
     * 是否在线
     */
    get isOnline() {
        return this.__state__ !== ST_CLOSED;
    }
    /**
     * 获取客户端的地址
     */
    get remoteAddress() {
        return this.__socket__.remoteAddress;
    }
}
exports.Session = Session;
/**
 * Frontend session for frontend server.
 */
class FrontendSession extends events_1.EventEmitter {
    constructor(session) {
        super();
        this.id = 0;
        this.uid = '';
        this.frontendId = '';
        clone(session, this, FRONTEND_SESSION_FIELDS);
        // deep copy for settings
        this.settings = dclone(session.settings);
        this.__session__ = session;
    }
    bind(uid) {
        var _a;
        (_a = this.__sessionService__) === null || _a === void 0 ? void 0 : _a.bind(this.id, uid);
    }
    unbind(uid) {
        var _a;
        (_a = this.__sessionService__) === null || _a === void 0 ? void 0 : _a.unbind(this.id, uid);
        this.uid = '';
    }
    set(key, value) {
        this.settings[key] = value;
    }
    get(key) {
        return this.settings[key];
    }
    push(key, cb) {
        var _a;
        (_a = this.__sessionService__) === null || _a === void 0 ? void 0 : _a.import(this.id, key, this.get(key), cb);
    }
    pushAll(cb) {
        var _a;
        (_a = this.__sessionService__) === null || _a === void 0 ? void 0 : _a.importAll(this.id, this.settings, cb);
    }
    on(event, listener) {
        this.__session__.on(event, listener);
        return super.on(event, listener);
    }
    /**
     *
     * @deprecated
     */
    abind(uid) {
        this.bind(uid);
    }
    /**
     *
     * @deprecated
     */
    aunbind(uid) {
        this.unbind(uid);
    }
    apush(key) {
        return new Promise((resolve, reject) => this.push(key, (err, ret) => err ? reject(err) : resolve(ret)));
    }
    apushAll() {
        return new Promise((resolve, reject) => this.pushAll((err, ret) => err ? reject(err) : resolve(ret)));
    }
    // abind = utils.promisify(this.bind.bind(this));
    // aunbind = utils.promisify(this.unbind.bind(this));
    // apush = utils.promisify(this.push.bind(this));
    // apushAll = utils.promisify(this.pushAll.bind(this));
    /**
     * Export the key/values for serialization.
     *
     * @api private
     */
    export() {
        let res = {};
        clone(this, res, EXPORTED_SESSION_FIELDS);
        return res;
    }
    /**
     * 是否在线
     */
    get isOnline() {
        return this.__session__.isOnline;
    }
    /**
     * 获取客户端的地址
     */
    get remoteAddress() {
        return this.__session__.remoteAddress;
    }
}
exports.FrontendSession = FrontendSession;
let clone = function (src, dest, includes) {
    let f;
    for (let i = 0, l = includes.length; i < l; i++) {
        f = includes[i];
        dest[f] = src[f];
    }
};
let dclone = function (src) {
    let res = {};
    for (let f in src) {
        res[f] = src[f];
    }
    return res;
};
//# sourceMappingURL=sessionService.js.map