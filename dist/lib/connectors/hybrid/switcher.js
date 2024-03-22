"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridSwitcher = void 0;
const events_1 = require("events");
const wsprocessor_1 = require("./wsprocessor");
const tcpprocessor_1 = require("./tcpprocessor");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let HTTP_METHODS = [
    'GET', 'POST', 'DELETE', 'PUT', 'HEAD'
];
// max length of 'DELETE'
let MAX_HTTP_METHODS_LEN = 6;
let ST_STARTED = 1;
let ST_CLOSED = 2;
let DEFAULT_TIMEOUT = 90;
/**
 * Switcher for tcp and websocket protocol
 *
 * @param {Object} server tcp server instance from node.js net module
 */
class HybridSwitcher extends events_1.EventEmitter {
    constructor(server, opts) {
        super();
        this.server = server;
        this.wsprocessor = new wsprocessor_1.WSProcessor();
        this.tcpprocessor = new tcpprocessor_1.TCPProcessor(opts.closeMethod);
        this.id = 1;
        this.timeout = (opts.timeout || DEFAULT_TIMEOUT) * 1000;
        this.setNoDelay = opts.setNoDelay;
        if (!opts.ssl) {
            this.server.on('connection', this.newSocket.bind(this));
        }
        else {
            this.server.on('secureConnection', this.newSocket.bind(this));
            this.server.on('clientError', function (e, tlsSo) {
                logger.warn('an ssl error occured before handshake established: ', e);
                tlsSo.destroy();
            });
        }
        this.wsprocessor.on('connection', this.emit.bind(this, 'connection'));
        this.tcpprocessor.on('connection', this.emit.bind(this, 'connection'));
        this.state = ST_STARTED;
    }
    newSocket(socket) {
        if (this.state !== ST_STARTED) {
            return;
        }
        socket.on('error', (err) => {
            logger.debug('connection error:%s, the remote ip is %s && port is %s', err.message, socket.remoteAddress, socket.remotePort);
            socket.destroy();
        });
        socket.on('close', () => {
            socket.destroy();
        });
        socket.setTimeout(this.timeout, function () {
            logger.warn('connection is timeout without communication, the remote ip is %s && port is %s', socket.remoteAddress, socket.remotePort);
            socket.destroy();
        });
        let self = this;
        socket.once('data', (data) => {
            // FIXME: handle incomplete HTTP method
            if (isHttp(data)) {
                this.processHttp(self.wsprocessor, socket, data);
            }
            else {
                if (!!self.setNoDelay) {
                    socket.setNoDelay(true);
                }
                this.processTcp(self.tcpprocessor, socket, data);
            }
        });
    }
    close() {
        if (this.state !== ST_STARTED) {
            return;
        }
        this.state = ST_CLOSED;
        this.wsprocessor.close();
        this.tcpprocessor.close();
    }
    processHttp(processor, socket, data) {
        processor.add(socket, data);
    }
    processTcp(processor, socket, data) {
        processor.add(socket, data);
    }
}
exports.HybridSwitcher = HybridSwitcher;
let isHttp = function (data) {
    let head = data.toString('utf8', 0, MAX_HTTP_METHODS_LEN - 1);
    for (let i = 0, l = HTTP_METHODS.length; i < l; i++) {
        if (head.indexOf(HTTP_METHODS[i]) === 0) {
            return true;
        }
    }
    return false;
};
//# sourceMappingURL=switcher.js.map