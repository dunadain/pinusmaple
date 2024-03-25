"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSProcessor = void 0;
const http_1 = require("http");
const events_1 = require("events");
const WebSocket = require("ws");
let ST_STARTED = 1;
let ST_CLOSED = 2;
/**
 * websocket protocol processor
 */
class WSProcessor extends events_1.EventEmitter {
    constructor() {
        super();
        this.httpServer = new http_1.Server();
        let self = this;
        this.wsServer = new WebSocket.Server({ server: this.httpServer });
        this.wsServer.on('connection', function (socket, request) {
            // emit socket to outside
            self.emit('connection', socket, request);
        });
        this.state = ST_STARTED;
    }
    add(socket, data) {
        var _a;
        if (this.state !== ST_STARTED) {
            return;
        }
        (_a = this.httpServer) === null || _a === void 0 ? void 0 : _a.emit('connection', socket);
        if (typeof socket.ondata === 'function') {
            // compatible with stream2
            socket.ondata(data, 0, data.length);
        }
        else {
            // compatible with old stream
            socket.emit('data', data);
        }
    }
    close() {
        var _a;
        if (this.state !== ST_STARTED) {
            return;
        }
        this.state = ST_CLOSED;
        (_a = this.wsServer) === null || _a === void 0 ? void 0 : _a.close();
        this.wsServer = null;
        this.httpServer = null;
    }
}
exports.WSProcessor = WSProcessor;
//# sourceMappingURL=wsprocessor.js.map