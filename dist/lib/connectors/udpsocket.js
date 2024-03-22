"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UdpSocket = void 0;
const handler_1 = require("./common/handler");
const pinus_protocol_1 = require("pinus-protocol");
const events_1 = require("events");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let ST_INITED = 0;
let ST_WAIT_ACK = 1;
let ST_WORKING = 2;
let ST_CLOSED = 3;
class UdpSocket extends events_1.EventEmitter {
    constructor(id, socket, peer) {
        super();
        this.id = id;
        this.socket = socket;
        this.peer = peer;
        this.host = peer.address;
        this.port = peer.port;
        this.remoteAddress = {
            ip: this.host,
            port: this.port
        };
        let self = this;
        this.on('package', function (pkg) {
            if (!!pkg) {
                pkg = pinus_protocol_1.Package.decode(pkg);
                (0, handler_1.default)(self, pkg);
            }
        });
        this.state = ST_INITED;
    }
    /**
     * Send byte data package to client.
     *
     * @param  {Buffer} msg byte data
     */
    send(msg) {
        if (this.state !== ST_WORKING) {
            return;
        }
        if (msg instanceof String) {
            msg = Buffer.from(msg);
        }
        else if (!(msg instanceof Buffer)) {
            msg = Buffer.from(JSON.stringify(msg));
        }
        this.sendRaw(pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_DATA, msg));
    }
    sendRaw(msg) {
        this.socket.send(msg, 0, msg.length, this.port, this.host, function (err, bytes) {
            if (!!err) {
                logger.error('send msg to remote with err: %j', err.stack);
                return;
            }
        });
    }
    sendForce(msg) {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.sendRaw(msg);
    }
    handshakeResponse(resp) {
        if (this.state !== ST_INITED) {
            return;
        }
        this.sendRaw(resp);
        this.state = ST_WAIT_ACK;
    }
    sendBatch(msgs) {
        if (this.state !== ST_WORKING) {
            return;
        }
        let rs = [];
        for (let i = 0; i < msgs.length; i++) {
            let src = pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_DATA, msgs[i]);
            rs.push(src);
        }
        this.sendRaw(Buffer.concat(rs));
    }
    disconnect() {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.state = ST_CLOSED;
        this.emit('disconnect', 'the connection is disconnected.');
    }
}
exports.UdpSocket = UdpSocket;
//# sourceMappingURL=udpsocket.js.map