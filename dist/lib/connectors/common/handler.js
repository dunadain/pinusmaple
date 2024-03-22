"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pinus_protocol_1 = require("pinus-protocol");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let handlers = {};
let ST_INITED = 0;
let ST_WAIT_ACK = 1;
let ST_WORKING = 2;
let ST_CLOSED = 3;
let handleHandshake = function (socket, pkg) {
    if (socket.state !== ST_INITED) {
        return;
    }
    try {
        socket.emit('handshake', JSON.parse(pinus_protocol_1.Protocol.strdecode(pkg.body)));
    }
    catch (ex) {
        socket.emit('handshake', {});
    }
};
let handleHandshakeAck = function (socket, pkg) {
    if (socket.state !== ST_WAIT_ACK) {
        return;
    }
    socket.state = ST_WORKING;
    socket.emit('heartbeat');
};
let handleHeartbeat = function (socket, pkg) {
    if (socket.state !== ST_WORKING) {
        return;
    }
    socket.emit('heartbeat');
};
let handleData = function (socket, pkg) {
    if (socket.state !== ST_WORKING) {
        return;
    }
    socket.emit('message', pkg);
};
handlers[pinus_protocol_1.Package.TYPE_HANDSHAKE] = handleHandshake;
handlers[pinus_protocol_1.Package.TYPE_HANDSHAKE_ACK] = handleHandshakeAck;
handlers[pinus_protocol_1.Package.TYPE_HEARTBEAT] = handleHeartbeat;
handlers[pinus_protocol_1.Package.TYPE_DATA] = handleData;
function default_1(socket, pkg) {
    let handler = handlers[pkg.type];
    if (!!handler) {
        handler(socket, pkg);
    }
    else {
        logger.error('could not find handle invalid data package.');
        socket.disconnect();
    }
}
exports.default = default_1;
//# sourceMappingURL=handler.js.map