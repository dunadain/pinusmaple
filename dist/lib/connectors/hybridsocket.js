"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridSocket = void 0;
const events_1 = require("events");
const handler_1 = require("./common/handler");
const pinus_protocol_1 = require("pinus-protocol");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let ST_INITED = 0;
let ST_WAIT_ACK = 1;
let ST_WORKING = 2;
let ST_CLOSED = 3;
/**
 * Socket class that wraps socket and websocket to provide unified interface for up level.
 */
class HybridSocket extends events_1.EventEmitter {
    constructor(id, socket, request, opts) {
        super();
        this.id = id;
        this.socket = socket;
        if (request && (opts.realIPKey || opts.realPortKey)) {
            let ip = opts.realIPKey ? request['headers'][opts.realIPKey] : undefined;
            if (ip) {
                this.remoteAddress = {
                    ip: ip,
                    port: opts.realPortKey ? request['headers'][opts.realPortKey] : 0
                };
            }
        }
        if (!this.remoteAddress) {
            if (!socket._socket) {
                this.remoteAddress = {
                    ip: socket.address().address,
                    port: socket.address().port
                };
            }
            else {
                this.remoteAddress = {
                    ip: socket._socket.remoteAddress,
                    port: socket._socket.remotePort
                };
            }
        }
        let self = this;
        socket.once('close', this.emit.bind(this, 'disconnect'));
        socket.on('error', this.emit.bind(this, 'error'));
        socket.on('message', function (msg) {
            if (msg) {
                msg = pinus_protocol_1.Package.decode(msg);
                (0, handler_1.default)(self, msg);
            }
        });
        this.state = ST_INITED;
        // TODO: any other events?
    }
    /**
     * Send raw byte data.
     *
     * @api private
     */
    sendRaw(msg) {
        if (this.state !== ST_WORKING) {
            return;
        }
        let self = this;
        this.socket.send(msg, { binary: true }, (err) => {
            if (!!err) {
                logger.error('websocket send binary data failed: %j', err.stack);
                return;
            }
        });
    }
    /**
     * Send byte data package to client.
     *
     * @param  {Buffer} msg byte data
     */
    send(msg) {
        if (msg instanceof String) {
            msg = Buffer.from(msg);
        }
        else if (!(msg instanceof Buffer)) {
            msg = Buffer.from(JSON.stringify(msg));
        }
        this.sendRaw(pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_DATA, msg));
    }
    /**
     * Send byte data packages to client in batch.
     *
     * @param  {Buffer} msgs byte data
     */
    sendBatch(msgs) {
        let rs = [];
        for (let i = 0; i < msgs.length; i++) {
            let src = pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_DATA, msgs[i]);
            rs.push(src);
        }
        this.sendRaw(Buffer.concat(rs));
    }
    /**
     * Send message to client no matter whether handshake.
     *
     * @api private
     */
    sendForce(msg) {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.socket.send(msg, { binary: true });
    }
    /**
     * Response handshake request
     *
     * @api private
     */
    handshakeResponse(resp) {
        if (this.state !== ST_INITED) {
            return;
        }
        this.socket.send(resp, { binary: true });
        this.state = ST_WAIT_ACK;
    }
    /**
     * Close the connection.
     *
     * @api private
     */
    disconnect() {
        if (this.state === ST_CLOSED) {
            return;
        }
        this.state = ST_CLOSED;
        this.socket.emit('close');
        this.socket.close();
    }
}
exports.HybridSocket = HybridSocket;
//# sourceMappingURL=hybridsocket.js.map