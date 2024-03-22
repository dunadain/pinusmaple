"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIOConnector = void 0;
const events_1 = require("events");
const http_1 = require("http");
let httpServer = (0, http_1.createServer)();
const siosocket_1 = require("./siosocket");
const socket_io_1 = require("socket.io");
let PKG_ID_BYTES = 4;
let PKG_ROUTE_LENGTH_BYTES = 1;
let PKG_HEAD_BYTES = PKG_ID_BYTES + PKG_ROUTE_LENGTH_BYTES;
let curId = 1;
/**
 * Connector that manager low level connection and protocol bewteen server and client.
 * Develper can provide their own connector to switch the low level prototol, such as tcp or probuf.
 */
class SIOConnector extends events_1.EventEmitter {
    constructor(port, host, opts) {
        super();
        this.port = port;
        this.host = host;
        this.opts = opts;
        opts.pingTimeout = opts.pingTimeout || 60;
        opts.pingInterval = opts.pingInterval || 25;
    }
    /**
     * Start connector to listen the specified port
     */
    async start() {
        let self = this;
        // issue https://github.com/NetEase/pinus-cn/issues/174
        let opts;
        if (!!this.opts) {
            opts = this.opts;
        }
        else {
            opts = {
                transports: [
                    'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
                ]
            };
        }
        opts.path = '/socket.io';
        let sio = new socket_io_1.Server(httpServer, opts);
        let port = this.port;
        httpServer.listen(port, function () {
            console.log('sio Server listening at port %d', port);
        });
        sio.on('connection', (socket) => {
            // this.wsocket.sockets.on('connection', function (socket) {
            let siosocket = new siosocket_1.SioSocket(curId++, socket);
            self.emit('connection', siosocket);
            siosocket.on('closing', function (reason) {
                siosocket.send({ route: 'onKick', reason: reason });
            });
        });
    }
    /**
     * Stop connector
     */
    async stop(force) {
        this.server.close();
    }
    encode(reqId, route, msg) {
        if (reqId) {
            return composeResponse(reqId, route, msg);
        }
        else {
            return composePush(route, msg);
        }
    }
    /**
     * Decode client message package.
     *
     * Package format:
     *   message id: 4bytes big-endian integer
     *   route length: 1byte
     *   route: route length bytes
     *   body: the rest bytes
     *
     * @param  {String} data socket.io package from client
     * @return {Object}      message object
     */
    decode(msg) {
        let index = 0;
        let id = parseIntField(msg, index, PKG_ID_BYTES);
        index += PKG_ID_BYTES;
        let routeLen = parseIntField(msg, index, PKG_ROUTE_LENGTH_BYTES);
        let route = msg.substr(PKG_HEAD_BYTES, routeLen);
        let body = msg.substr(PKG_HEAD_BYTES + routeLen);
        return {
            id: id,
            route: route,
            body: JSON.parse(body)
        };
    }
}
exports.SIOConnector = SIOConnector;
let composeResponse = function (msgId, route, msgBody) {
    return {
        id: msgId,
        body: msgBody
    };
};
let composePush = function (route, msgBody) {
    return JSON.stringify({ route: route, body: msgBody });
};
let parseIntField = function (str, offset, len) {
    let res = 0;
    for (let i = 0; i < len; i++) {
        if (i > 0) {
            res <<= 8;
        }
        res |= str.charCodeAt(offset + i) & 0xff;
    }
    return res;
};
//# sourceMappingURL=sioconnector.js.map