"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTConnector = void 0;
const events_1 = require("events");
const net = require("net");
const constants = require("../util/constants");
const mqttsocket_1 = require("./mqttsocket");
const mqttadaptor_1 = require("./mqtt/mqttadaptor");
const generate = require("./mqtt/generate");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
const mqtt_connection = require('mqtt-connection');
let curId = 1;
/**
 * Connector that manager low level connection and protocol bewteen server and client.
 * Develper can provide their own connector to switch the low level prototol, such as tcp or probuf.
 */
class MQTTConnector extends events_1.EventEmitter {
    constructor(port, host, opts) {
        super();
        this.port = port;
        this.host = host;
        this.opts = opts || {};
        this.adaptor = new mqttadaptor_1.MqttAdaptor(this.opts);
    }
    /**
     * Start connector to listen the specified port
     */
    async start() {
        let self = this;
        this.server = new net.Server();
        this.server.listen(this.port);
        logger.info('[MQTTConnector] listen on %d', this.port);
        this.server.on('error', function (err) {
            // logger.error('mqtt server is error: %j', err.stack);
            self.emit('error', err);
        });
        this.server.on('connection', (stream) => {
            let client = mqtt_connection(stream);
            client.on('error', function (err) {
                client.destroy();
            });
            client.on('close', function () {
                client.destroy();
            });
            client.on('disconnect', function (packet) {
                client.destroy();
            });
            // stream timeout
            stream.on('timeout', function () { client.destroy(); });
            // client published
            client.on('publish', function (packet) {
                // send a puback with messageId (for QoS > 0)
                client.puback({ messageId: packet.messageId });
            });
            // client pinged
            client.on('pingreq', function () {
                // send a pingresp
                client.pingresp();
            });
            if (self.opts.disconnectOnTimeout) {
                let timeout = self.opts.timeout * 1000 || constants.TIME.DEFAULT_MQTT_HEARTBEAT_TIMEOUT;
                stream.setTimeout(timeout, function () {
                    client.destroy();
                    client.emit('close');
                });
            }
            client.on('connect', function (packet) {
                client.connack({ returnCode: 0 });
                let mqttsocket = new mqttsocket_1.MQTTSocket(curId++, client, self.adaptor);
                self.emit('connection', mqttsocket);
            });
        });
    }
    async stop() {
        this.server.close();
        process.exit(0);
    }
    encode(reqId, route, msgBody) {
        if (!!reqId) {
            return composeResponse(reqId, route, msgBody);
        }
        else {
            return composePush(route, msgBody);
        }
    }
    close() {
        this.server.close();
    }
}
exports.MQTTConnector = MQTTConnector;
let composeResponse = function (msgId, route, msgBody) {
    return {
        id: msgId,
        body: msgBody
    };
};
let composePush = function (route, msgBody) {
    let msg = generate.publish(msgBody);
    if (!msg) {
        logger.error('invalid mqtt publish message: %j', msgBody);
    }
    return msg;
};
//# sourceMappingURL=mqttconnector.js.map