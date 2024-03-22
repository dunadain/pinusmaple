"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTSocket = void 0;
const events_1 = require("events");
let ST_INITED = 1;
let ST_CLOSED = 2;
/**
 * Socket class that wraps socket and websocket to provide unified interface for up level.
 */
class MQTTSocket extends events_1.EventEmitter {
    constructor(id, socket, adaptor) {
        super();
        this.sendRaw = this.send;
        this.id = id;
        this.socket = socket;
        this.remoteAddress = {
            ip: socket.stream.remoteAddress,
            port: socket.stream.remotePort
        };
        this.adaptor = adaptor;
        let self = this;
        socket.on('close', this.emit.bind(this, 'disconnect'));
        socket.on('error', this.emit.bind(this, 'disconnect'));
        socket.on('disconnect', this.emit.bind(this, 'disconnect'));
        socket.on('pingreq', function (packet) {
            socket.pingresp();
        });
        socket.on('subscribe', this.adaptor.onSubscribe.bind(this.adaptor, this));
        socket.on('publish', this.adaptor.onPublish.bind(this.adaptor, this));
        this.state = ST_INITED;
        // TODO: any other events?
    }
    send(msg) {
        if (this.state !== ST_INITED) {
            return;
        }
        if (msg instanceof Buffer) {
            // if encoded, send directly
            this.socket.stream.write(msg);
        }
        else {
            this.adaptor.publish(this, msg);
        }
    }
    sendBatch(msgs) {
        for (let i = 0, l = msgs.length; i < l; i++) {
            this.send(msgs[i]);
        }
    }
    disconnect() {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.state = ST_CLOSED;
        this.socket.stream.destroy();
    }
}
exports.MQTTSocket = MQTTSocket;
//# sourceMappingURL=mqttsocket.js.map