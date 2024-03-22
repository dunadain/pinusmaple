"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorComponent = void 0;
const pinus_logger_1 = require("pinus-logger");
const taskManager = require("../common/manager/taskManager");
const pinus_1 = require("../pinus");
let rsa = require('node-bignumber');
const events_1 = require("../util/events");
const utils = require("../util/utils");
const sioconnector_1 = require("../connectors/sioconnector");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Connector component. Receive client requests and attach session with socket.
 *
 * @param {Object} app  current application context
 * @param {Object} opts attach parameters
 *                      opts.connector {Object} provides low level network and protocol details implementation between server and clients.
 */
class ConnectorComponent {
    constructor(app, opts) {
        this.keys = {};
        this.blacklist = [];
        this.name = '__connector__';
        opts = opts || {};
        this.app = app;
        this.connector = getConnector(app, opts);
        this.encode = opts.encode;
        this.decode = opts.decode;
        this.useCrypto = opts.useCrypto;
        this.useHostFilter = opts.useHostFilter;
        this.useAsyncCoder = opts.useAsyncCoder;
        this.blacklistFun = opts.blacklistFun;
        this.forwardMsg = opts.forwardMsg;
        if (opts.useDict) {
            app.load(pinus_1.pinus.components.dictionary, app.get('dictionaryConfig'));
        }
        if (opts.useProtobuf) {
            app.load(pinus_1.pinus.components.protobuf, app.get('protobufConfig'));
        }
        // component dependencies
        this.server = null;
        this.session = null;
    }
    async start() {
        this.server = this.app.components.__server__;
        this.session = this.app.components.__session__;
        this.connection = this.app.components.__connection__;
        // check component dependencies
        if (!this.server) {
            throw new Error('fail to start connector component for no server component loaded');
        }
        if (!this.session) {
            throw new Error('fail to start connector component for no session component loaded');
        }
    }
    async afterStart() {
        await this.connector.start();
        this.connector.on('connection', this.hostFilter.bind(this, this.bindEvents.bind(this)));
    }
    async stop(force) {
        if (this.connector) {
            await this.connector.stop(force);
            this.connector = null;
        }
    }
    send(reqId, route, msg, recvs, opts, cb) {
        logger.debug('[%s] send message reqId: %s, route: %s, msg: %j, receivers: %j, opts: %j', this.app.serverId, reqId, route, msg, recvs, opts);
        // if (this.useAsyncCoder) {
        //     return this.sendAsync(reqId, route, msg, recvs, opts, cb);
        // }
        let emsg = msg;
        if (this.encode) {
            // use costumized encode
            emsg = this.encode.call(this, reqId, route, msg);
        }
        else if (this.connector.encode) {
            // use connector default encode
            emsg = this.connector.encode(reqId, route, msg);
        }
        this.doSend(reqId, route, emsg, recvs, opts, cb);
    }
    sendAsync(reqId, route, msg, recvs, opts, cb) {
        let emsg = msg;
        let self = this;
        /*
        if (this.encode)
        {
            // use costumized encode
            this.encode(reqId, route, msg, function (err, encodeMsg)
            {
                if (err)
                {
                    return cb(err);
                }

                emsg = encodeMsg;
                self.doSend(reqId, route, emsg, recvs, opts, cb);
            });
        } else if (this.connector.encode)
        {
            // use connector default encode
            this.connector.encode(reqId, route, msg, function (err, encodeMsg)
            {
                if (err)
                {
                    return cb(err);
                }

                emsg = encodeMsg;
                self.doSend(reqId, route, emsg, recvs, opts, cb);
            });
        }*/
        throw new Error('not implement sendAsync');
    }
    doSend(reqId, route, emsg, recvs, opts, cb) {
        if (!emsg) {
            process.nextTick(function () {
                return cb && cb(new Error('fail to send message for encode result is empty.'));
            });
        }
        this.app.components.__pushScheduler__.schedule(reqId, route, emsg, recvs, opts, cb);
    }
    setPubKey(id, key) {
        let pubKey = new rsa.Key();
        pubKey.n = new rsa.BigInteger(key.rsa_n, 16);
        pubKey.e = key.rsa_e;
        this.keys[id] = pubKey;
    }
    getPubKey(id) {
        return this.keys[id];
    }
    hostFilter(cb, socket) {
        if (!this.useHostFilter) {
            return cb(socket);
        }
        let ip = socket.remoteAddress.ip;
        let check = function (list) {
            for (let address in list) {
                let exp = new RegExp(list[address]);
                if (exp.test(ip)) {
                    socket.disconnect();
                    return true;
                }
            }
            return false;
        };
        // dynamical check
        if (this.blacklist.length !== 0 && !!check(this.blacklist)) {
            return;
        }
        // static check
        if (!!this.blacklistFun && typeof this.blacklistFun === 'function') {
            let self = this;
            self.blacklistFun((err, list) => {
                if (!!err) {
                    logger.error('connector blacklist error: %j', err.stack);
                    utils.invokeCallback(cb, socket);
                    return;
                }
                if (!Array.isArray(list)) {
                    logger.error('connector blacklist is not array: %j', list);
                    utils.invokeCallback(cb, socket);
                    return;
                }
                if (!!check(list)) {
                    return;
                }
                else {
                    utils.invokeCallback(cb, socket);
                    return;
                }
            });
        }
        else {
            utils.invokeCallback(cb, socket);
        }
    }
    bindEvents(socket) {
        let curServer = this.app.getCurServer();
        let maxConnections = curServer['max-connections'];
        if (this.connection && maxConnections) {
            this.connection.increaseConnectionCount();
            let statisticInfo = this.connection.getStatisticsInfo();
            if (statisticInfo.totalConnCount > maxConnections) {
                logger.warn('the server %s has reached the max connections %s', curServer.id, maxConnections);
                socket.disconnect();
                return;
            }
        }
        // create session for connection
        let session = this.getSession(socket);
        let closed = false;
        socket.on('disconnect', () => {
            if (closed) {
                return;
            }
            closed = true;
            if (this.connection) {
                this.connection.decreaseConnectionCount(session.uid);
            }
        });
        socket.on('error', () => {
            if (closed) {
                return;
            }
            closed = true;
            if (this.connection) {
                this.connection.decreaseConnectionCount(session.uid);
            }
        });
        // new message
        socket.on('message', (msg) => {
            let dmsg = msg;
            // if (this.useAsyncCoder) {
            //     return this.handleMessageAsync(msg, session, socket);
            // }
            if (this.decode) {
                dmsg = this.decode(msg);
            }
            else if (this.connector.decode) {
                dmsg = this.connector.decode(msg);
                // Perhaps protobuf decoder error can be captured here.
                // if (dmsg && dmsg.body === null) {
                //     // protobuf decode error
                //     logger.error('fail to decode the msg body received from client. msg:', dmsg);
                //     return;
                // }
            }
            if (!dmsg) {
                // discard invalid message
                return;
            }
            // use rsa crypto
            if (this.useCrypto) {
                let verified = this.verifyMessage(session, dmsg);
                if (!verified) {
                    logger.error('fail to verify the data received from client.');
                    return;
                }
            }
            this.handleMessage(session, dmsg);
        }); // on message end
    }
    handleMessageAsync(msg, session, socket) {
        /*
        if (this.decode)
        {
            this.decode(msg, session, function (err, dmsg)
            {
                if (err)
                {
                    logger.error('fail to decode message from client %s .', err.stack);
                    return;
                }

                doHandleMessage(this, dmsg, session);
            });
        } else if (this.connector.decode)
        {
            this.connector.decode(msg, socket, function (err, dmsg)
            {
                if (err)
                {
                    logger.error('fail to decode message from client %s .', err.stack);
                    return;
                }

                doHandleMessage(this, dmsg, session);
            });
        }*/
        throw new Error('not implement handleMessageAsync');
    }
    doHandleMessage(dmsg, session) {
        if (!dmsg) {
            // discard invalid message
            return;
        }
        // use rsa crypto
        if (this.useCrypto) {
            let verified = this.verifyMessage(session, dmsg);
            if (!verified) {
                logger.error('fail to verify the data received from client.');
                return;
            }
        }
        this.handleMessage(session, dmsg);
    }
    /**
     * get session for current connection
     */
    getSession(socket) {
        let app = this.app, sid = socket.id;
        let session = this.session.get(sid);
        if (session) {
            return session;
        }
        session = this.session.create(sid, app.getServerId(), socket);
        logger.debug('[%s] getSession session is created with session id: %s', app.getServerId(), sid);
        // bind events for session
        socket.on('disconnect', session.closed.bind(session));
        socket.on('error', session.closed.bind(session));
        session.on('closed', this.onSessionClose.bind(this, app));
        session.on('bind', (uid) => {
            logger.debug('session on [%s] bind with uid: %s', this.app.serverId, uid);
            // update connection statistics if necessary
            if (this.connection) {
                this.connection.addLoginedUser(uid, {
                    loginTime: Date.now(),
                    uid: uid,
                    address: socket.remoteAddress.ip + ':' + socket.remoteAddress.port
                });
            }
            this.app.event.emit(events_1.default.BIND_SESSION, session);
        });
        session.on('unbind', (uid) => {
            if (this.connection) {
                this.connection.removeLoginedUser(uid);
            }
            this.app.event.emit(events_1.default.UNBIND_SESSION, session);
        });
        return session;
    }
    onSessionClose(app, session, reason) {
        taskManager.closeQueue(session.id, true);
        app.event.emit(events_1.default.CLOSE_SESSION, session);
    }
    handleMessage(session, msg) {
        // logger.debug('[%s] handleMessage session id: %s, msg: %j', this.app.serverId, session.id, msg);
        let type = this.checkServerType(msg.route);
        if (!type) {
            logger.error('invalid route string. route : %j', msg.route);
            return;
        }
        // only stop forwarding message when forwardMsg === false;
        if (this.forwardMsg === false && type !== this.app.getServerType()) {
            logger.warn('illegal route. forwardMsg=false route=', msg.route, 'sessionid=', session.id);
            // kick client requests for illegal route request.
            this.session.kickBySessionId(session.id);
            return;
        }
        this.server.globalHandle(msg, session.toFrontendSession(), (err, resp) => {
            if (resp && !msg.id) {
                logger.warn('try to response to a notify: %j', msg.route);
                return;
            }
            if (!msg.id && !resp)
                return;
            if (!resp)
                resp = {};
            if (!!err && !resp.code) {
                resp.code = 500;
            }
            let opts = {
                type: 'response'
            };
            this.send(msg.id, msg.route, resp, [session.id], opts, function () {
            });
        });
    }
    /**
     * Get server type form request message.
     */
    checkServerType(route) {
        if (!route) {
            return null;
        }
        let idx = route.indexOf('.');
        if (idx < 0) {
            return null;
        }
        return route.substring(0, idx);
    }
    verifyMessage(session, msg) {
        let sig = msg.body.__crypto__;
        if (!sig) {
            logger.error('receive data from client has no signature [%s]', this.app.serverId);
            return false;
        }
        let pubKey;
        if (!session) {
            logger.error('could not find session.');
            return false;
        }
        if (!session.get('pubKey')) {
            pubKey = this.getPubKey(session.id);
            if (!!pubKey) {
                delete this.keys[session.id];
                session.set('pubKey', pubKey);
            }
            else {
                logger.error('could not get public key, session id is %s', session.id);
                return false;
            }
        }
        else {
            pubKey = session.get('pubKey');
        }
        if (!pubKey.n || !pubKey.e) {
            logger.error('could not verify message without public key [%s]', this.app.serverId);
            return false;
        }
        delete msg.body.__crypto__;
        let message = JSON.stringify(msg.body);
        if (utils.hasChineseChar(message))
            message = utils.unicodeToUtf8(message);
        return pubKey.verifyString(message, sig);
    }
}
exports.ConnectorComponent = ConnectorComponent;
let getConnector = function (app, opts) {
    let connector = opts.connector;
    if (!connector) {
        return getDefaultConnector(app, opts);
    }
    if (typeof connector !== 'function') {
        return connector;
    }
    let curServer = app.getCurServer();
    return new connector(curServer.clientPort, curServer.host, opts);
};
let getDefaultConnector = function (app, opts) {
    let curServer = app.getCurServer();
    return new sioconnector_1.SIOConnector(curServer.clientPort, curServer.host, opts);
};
//# sourceMappingURL=connector.js.map