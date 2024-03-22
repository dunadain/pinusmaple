"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UDPConnector = void 0;
const net = require("net");
const dgram = require("dgram");
const utils = require("../util/utils");
const Constants = require("../util/constants");
const udpsocket_1 = require("./udpsocket");
const Kick = require("./commands/kick");
const handshake_1 = require("./commands/handshake");
const heartbeat_1 = require("./commands/heartbeat");
const coder = require("./common/coder");
const events_1 = require("events");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let curId = 1;
class UDPConnector extends events_1.EventEmitter {
    constructor(port, host, opts) {
        super();
        this.decode = coder.decode;
        this.encode = coder.encode;
        this.opts = opts || {};
        this.type = opts.udpType || 'udp4';
        this.handshake = new handshake_1.HandshakeCommand(opts);
        if (!opts.heartbeat) {
            opts.heartbeat = Constants.TIME.DEFAULT_UDP_HEARTBEAT_TIME;
            opts.timeout = Constants.TIME.DEFAULT_UDP_HEARTBEAT_TIMEOUT;
        }
        this.heartbeat = new heartbeat_1.HeartbeatCommand(utils.extendsObject(opts, { disconnectOnTimeout: true }));
        this.clients = {};
        this.host = host;
        this.port = port;
    }
    async start() {
        let self = this;
        this.tcpServer = net.createServer();
        this.socket = dgram.createSocket(this.type, function (msg, peer) {
            let key = genKey(peer);
            if (!self.clients[key]) {
                let udpsocket = new udpsocket_1.UdpSocket(curId++, self.socket, peer);
                self.clients[key] = udpsocket;
                udpsocket.on('handshake', self.handshake.handle.bind(self.handshake, udpsocket));
                udpsocket.on('heartbeat', self.heartbeat.handle.bind(self.heartbeat, udpsocket));
                udpsocket.on('disconnect', self.heartbeat.clear.bind(self.heartbeat, udpsocket.id));
                udpsocket.on('disconnect', function () {
                    delete self.clients[genKey(udpsocket.peer)];
                });
                udpsocket.on('closing', Kick.handle.bind(null, udpsocket));
                self.emit('connection', udpsocket);
            }
        });
        this.socket.on('message', function (data, peer) {
            let socket = self.clients[genKey(peer)];
            if (!!socket) {
                socket.emit('package', data);
            }
        });
        this.socket.on('error', function (err) {
            logger.error('udp socket encounters with error: %j', err.stack);
            return;
        });
        this.socket.bind(this.port, this.host);
        this.tcpServer.listen(this.port);
    }
    async stop(force) {
        this.socket.close();
    }
}
exports.UDPConnector = UDPConnector;
let genKey = function (peer) {
    return peer.address + ':' + peer.port;
};
//# sourceMappingURL=udpconnector.js.map