"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SioSocket = void 0;
const events_1 = require("events");
let ST_INITED = 0;
let ST_CLOSED = 1;
/**
 * Socket class that wraps socket.io socket to provide unified interface for up level.
 */
class SioSocket extends events_1.EventEmitter {
    constructor(id, socket) {
        super();
        this.sendRaw = this.send;
        this.id = id;
        this.socket = socket;
        this.remoteAddress = {
            ip: socket.handshake.address
        };
        let self = this;
        socket.on('disconnect', this.emit.bind(this, 'disconnect'));
        socket.on('error', this.emit.bind(this, 'error'));
        socket.on('message', function (msg) {
            self.emit('message', msg);
        });
        this.state = ST_INITED;
        // TODO: any other events?
    }
    send(msg) {
        if (this.state !== ST_INITED) {
            return;
        }
        if (typeof msg !== 'string') {
            msg = JSON.stringify(msg);
        }
        this.socket.send(msg);
    }
    disconnect() {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.state = ST_CLOSED;
        this.socket.disconnect();
    }
    sendBatch(msgs) {
        this.send(encodeBatch(msgs));
    }
}
exports.SioSocket = SioSocket;
/**
 * Encode batch msg to client
 */
let encodeBatch = function (msgs) {
    let res = '[', msg;
    for (let i = 0, l = msgs.length; i < l; i++) {
        if (i > 0) {
            res += ',';
        }
        msg = msgs[i];
        if (typeof msg === 'string') {
            res += msg;
        }
        else {
            res += JSON.stringify(msg);
        }
    }
    res += ']';
    return res;
};
//# sourceMappingURL=siosocket.js.map