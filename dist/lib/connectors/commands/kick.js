"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const pinus_protocol_1 = require("pinus-protocol");
function handle(socket, reason) {
    // websocket close code 1000 would emit when client close the connection
    if (typeof reason === 'string') {
        let res = {
            reason: reason
        };
        socket.sendRaw(pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_KICK, Buffer.from(JSON.stringify(res))));
    }
}
exports.handle = handle;
//# sourceMappingURL=kick.js.map