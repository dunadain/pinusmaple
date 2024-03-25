"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpSocket = void 0;
const stream_1 = require("stream");
const pinus_protocol_1 = require("pinus-protocol");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Work states
 */
let ST_HEAD = 1; // wait for head
let ST_BODY = 2; // wait for body
let ST_CLOSED = 3; // closed
/**
 * Tcp socket wrapper with package compositing.
 * Collect the package from socket and emit a completed package with 'data' event.
 * Uniform with ws.WebSocket interfaces.
 *
 * @param {Object} socket origin socket from node.js net module
 * @param {Object} opts   options parameter.
 *                        opts.headSize size of package head
 *                        opts.headHandler(headBuffer) handler for package head. caculate and return body size from head data.
 */
class TcpSocket extends stream_1.Stream {
    constructor(socket, opts) {
        // stream style interfaces.
        // TODO: need to port to stream2 after node 0.9
        super();
        if (!socket || !opts) {
            throw new Error('invalid socket or opts');
        }
        if (!opts.headSize || typeof opts.headHandler !== 'function') {
            throw new Error('invalid opts.headSize or opts.headHandler');
        }
        this.readable = true;
        this.writeable = true;
        this._socket = socket;
        this.headSize = opts.headSize;
        this.closeMethod = opts.closeMethod;
        this.headBuffer = Buffer.alloc(opts.headSize);
        this.headHandler = opts.headHandler;
        this.headOffset = 0;
        this.packageOffset = 0;
        this.packageSize = 0;
        this.packageBuffer = null;
        // bind event form the origin socket
        this._socket.on('data', this.ondata.bind(this));
        this._socket.on('end', this.onend.bind(this));
        this._socket.on('error', this.emit.bind(this, 'error'));
        this._socket.on('close', this.emit.bind(this, 'close'));
        this.state = ST_HEAD;
    }
    send(msg, options, cb) {
        this._socket.write(msg, options.binary ? 'binary' : 'utf8', cb);
    }
    close() {
        if (!!this.closeMethod && this.closeMethod === 'end') {
            this._socket.end();
        }
        else {
            try {
                this._socket.destroy();
            }
            catch (e) {
                logger.error('socket close with destroy error: %j', e.stack);
            }
        }
    }
    ondata(chunk) {
        if (this.state === ST_CLOSED) {
            throw new Error('socket has closed');
        }
        if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
            throw new Error('invalid data');
        }
        if (typeof chunk === 'string') {
            chunk = Buffer.from(chunk, 'utf8');
        }
        let offset = 0, end = chunk.length;
        while (offset < end && this.state !== ST_CLOSED) {
            if (this.state === ST_HEAD) {
                offset = this.readHead(chunk, offset);
            }
            if (this.state === ST_BODY) {
                offset = this.readBody(chunk, offset);
            }
        }
        return true;
    }
    onend(chunk) {
        if (chunk) {
            this._socket.write(chunk);
        }
        this.state = ST_CLOSED;
        this.reset();
        this.emit('end');
    }
    /**
     * Read head segment from data to socket.headBuffer.
     *
     * @param  {Object} socket Socket instance
     * @param  {Object} data   Buffer instance
     * @param  {Number} offset offset read star from data
     * @return {Number}        new offset of data after read
     */
    readHead(data, offset) {
        let hlen = this.headSize - this.headOffset;
        let dlen = data.length - offset;
        let len = Math.min(hlen, dlen);
        let dend = offset + len;
        data.copy(this.headBuffer, this.headOffset, offset, dend);
        this.headOffset += len;
        if (this.headOffset === this.headSize) {
            // if head segment finished
            let size = this.headHandler(this.headBuffer);
            if (size < 0) {
                throw new Error('invalid body size: ' + size);
            }
            // check if header contains a valid type
            if (checkTypeData(this.headBuffer[0])) {
                this.packageSize = size + this.headSize;
                this.packageBuffer = Buffer.alloc(this.packageSize);
                this.headBuffer.copy(this.packageBuffer, 0, 0, this.headSize);
                this.packageOffset = this.headSize;
                this.state = ST_BODY;
            }
            else {
                dend = data.length;
                logger.error('close the connection with invalid head message, the remote ip is %s && port is %s && message is %j', this._socket.remoteAddress, this._socket.remotePort, data);
                this.close();
            }
        }
        return dend;
    }
    /**
     * Read body segment from data buffer to socket.packageBuffer;
     *
     * @param  {Object} socket Socket instance
     * @param  {Object} data   Buffer instance
     * @param  {Number} offset offset read star from data
     * @return {Number}        new offset of data after read
     */
    readBody(data, offset) {
        let blen = this.packageSize - this.packageOffset;
        let dlen = data.length - offset;
        let len = Math.min(blen, dlen);
        let dend = offset + len;
        if (this.packageBuffer)
            data.copy(this.packageBuffer, this.packageOffset, offset, dend);
        this.packageOffset += len;
        if (this.packageOffset === this.packageSize) {
            // if all the package finished
            let buffer = this.packageBuffer;
            this.emit('message', buffer);
            this.reset();
        }
        return dend;
    }
    reset() {
        this.headOffset = 0;
        this.packageOffset = 0;
        this.packageSize = 0;
        this.packageBuffer = null;
        this.state = ST_HEAD;
    }
}
exports.TcpSocket = TcpSocket;
let checkTypeData = function (data) {
    return data === pinus_protocol_1.Package.TYPE_HANDSHAKE || data === pinus_protocol_1.Package.TYPE_HANDSHAKE_ACK || data === pinus_protocol_1.Package.TYPE_HEARTBEAT || data === pinus_protocol_1.Package.TYPE_DATA || data === pinus_protocol_1.Package.TYPE_KICK;
};
//# sourceMappingURL=tcpsocket.js.map