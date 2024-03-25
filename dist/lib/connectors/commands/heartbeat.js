"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatCommand = void 0;
const pinus_protocol_1 = require("pinus-protocol");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Process heartbeat request.
 *
 * @param {Object} opts option request
 *                      opts.heartbeat heartbeat interval
 */
class HeartbeatCommand {
    constructor(opts) {
        this.heartbeat = 0;
        this.timeout = 0;
        this.timeouts = {};
        this.clients = {};
        opts = opts || {};
        this.disconnectOnTimeout = !!opts.disconnectOnTimeout;
        if (opts.heartbeat) {
            this.heartbeat = opts.heartbeat * 1000; // heartbeat interval
            if (opts.timeout)
                this.timeout = opts.timeout * 1000; // max heartbeat message timeout
            else
                this.timeout = this.heartbeat * 2;
            this.disconnectOnTimeout = true;
        }
    }
    handle(socket) {
        if (!this.heartbeat) {
            // no heartbeat setting
            return;
        }
        let self = this;
        if (socket.id) {
            if (!this.clients[socket.id]) {
                // clear timers when socket disconnect or error
                this.clients[socket.id] = 1;
                socket.once('disconnect', this.clearTimers.bind(this, socket.id));
                socket.once('error', this.clearTimers.bind(this, socket.id));
            }
        }
        // clear timeout timer
        if (self.disconnectOnTimeout && socket.id) {
            this.clear(socket.id);
        }
        socket.sendRaw(pinus_protocol_1.Package.encode(pinus_protocol_1.Package.TYPE_HEARTBEAT));
        if (self.disconnectOnTimeout) {
            if (socket.id) {
                self.timeouts[socket.id] = setTimeout(function () {
                    logger.info('client %j heartbeat timeout.', socket.id);
                    socket.disconnect();
                }, self.timeout);
            }
        }
    }
    clear(id) {
        let tid = this.timeouts[id];
        if (tid) {
            clearTimeout(tid);
            delete this.timeouts[id];
        }
    }
    clearTimers(id) {
        delete this.clients[id];
        let tid = this.timeouts[id];
        if (tid) {
            clearTimeout(tid);
            delete this.timeouts[id];
        }
    }
}
exports.HeartbeatCommand = HeartbeatCommand;
//# sourceMappingURL=heartbeat.js.map