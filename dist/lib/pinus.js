"use strict";
/*!
 * Pinus
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinus = exports.Pinus = void 0;
const application_1 = require("./application");
const hybridconnector_1 = require("./connectors/hybridconnector");
const udpconnector_1 = require("./connectors/udpconnector");
const mqttconnector_1 = require("./connectors/mqttconnector");
const sioconnector_1 = require("./connectors/sioconnector");
const direct_1 = require("./pushSchedulers/direct");
const buffer_1 = require("./pushSchedulers/buffer");
const connection_1 = require("./components/connection");
const connector_1 = require("./components/connector");
const dictionary_1 = require("./components/dictionary");
const master_1 = require("./components/master");
const monitor_1 = require("./components/monitor");
const protobuf_1 = require("./components/protobuf");
const proxy_1 = require("./components/proxy");
const pushScheduler_1 = require("./components/pushScheduler");
const remote_1 = require("./components/remote");
const server_1 = require("./components/server");
const session_1 = require("./components/session");
const toobusy_1 = require("./filters/rpc/toobusy");
const rpcLog_1 = require("./filters/rpc/rpcLog");
const toobusy_2 = require("./filters/handler/toobusy");
const time_1 = require("./filters/handler/time");
const serial_1 = require("./filters/handler/serial");
const timeout_1 = require("./filters/handler/timeout");
let Package = require('../../package');
const events_1 = require("./util/events");
const backendSession_1 = require("./components/backendSession");
const channel_1 = require("./components/channel");
/**
 * Expose `createApplication()`.
 *
 * @module
 */
class Pinus {
    constructor() {
        /**
         * Framework version.
         */
        this.version = Package.version;
        /**
         * Event definitions that would be emitted by app.event
         */
        this.events = events_1.default;
        /**
         * auto loaded components
         */
        this.components = {
            backendSession: backendSession_1.BackendSessionComponent,
            channel: channel_1.ChannelComponent,
            connection: connection_1.ConnectionComponent,
            connector: connector_1.ConnectorComponent,
            dictionary: dictionary_1.DictionaryComponent,
            master: master_1.MasterComponent,
            monitor: monitor_1.MonitorComponent,
            protobuf: protobuf_1.ProtobufComponent,
            proxy: proxy_1.ProxyComponent,
            pushScheduler: pushScheduler_1.PushSchedulerComponent,
            remote: remote_1.RemoteComponent,
            server: server_1.ServerComponent,
            session: session_1.SessionComponent,
        };
        /**
         * auto loaded filters
         */
        this.filters = {
            serial: serial_1.SerialFilter,
            time: time_1.TimeFilter,
            timeout: timeout_1.TimeoutFilter,
            toobusy: toobusy_2.ToobusyFilter,
        };
        /**
         * auto loaded rpc filters
         */
        this.rpcFilters = {
            rpcLog: rpcLog_1.RpcLogFilter,
            toobusy: toobusy_1.RpcToobusyFilter,
        };
        /**
         * connectors
         */
        this.connectors = {
            sioconnector: sioconnector_1.SIOConnector,
            hybridconnector: hybridconnector_1.HybridConnector,
            udpconnector: udpconnector_1.UDPConnector,
            mqttconnector: mqttconnector_1.MQTTConnector,
        };
        /**
         * pushSchedulers
         */
        this.pushSchedulers = {
            direct: direct_1.DirectPushScheduler,
            buffer: buffer_1.BufferPushScheduler,
        };
    }
    /**
     * Create an pinus application.
     *
     * @return {Application}
     * @memberOf Pinus
     * @api public
     */
    createApp(opts) {
        let app = new application_1.Application();
        app.init(opts);
        this._app = app;
        return app;
    }
    /**
     * Get application
     */
    get app() {
        return this._app;
    }
}
exports.Pinus = Pinus;
exports.pinus = new Pinus();
//# sourceMappingURL=pinus.js.map