"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TCPProcessor = void 0;
const events_1 = require("events");
const utils = require("../../util/utils");
const tcpsocket_1 = require("./tcpsocket");
let ST_STARTED = 1;
let ST_CLOSED = 2;
// private protocol, no need exports
let HEAD_SIZE = 4;
/**
 * websocket protocol processor
 */
class TCPProcessor extends events_1.EventEmitter {
    constructor(closeMethod) {
        super();
        this.closeMethod = closeMethod;
        this.state = ST_STARTED;
    }
    add(socket, data) {
        if (this.state !== ST_STARTED) {
            return;
        }
        let tcpsocket = new tcpsocket_1.TcpSocket(socket, {
            headSize: HEAD_SIZE,
            headHandler: utils.headHandler,
            closeMethod: this.closeMethod
        });
        this.emit('connection', tcpsocket);
        socket.emit('data', data);
    }
    close() {
        if (this.state !== ST_STARTED) {
            return;
        }
        this.state = ST_CLOSED;
    }
}
exports.TCPProcessor = TCPProcessor;
//# sourceMappingURL=tcpprocessor.js.map