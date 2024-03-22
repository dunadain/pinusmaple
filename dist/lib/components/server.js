"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerComponent = void 0;
/**
 * Component for server starup.
 */
const server_1 = require("../server/server");
/**
 * Server component class
 *
 * @param {Object} app  current application context
 */
class ServerComponent {
    constructor(app, opts) {
        this.name = '__server__';
        this.server = (0, server_1.create)(app, opts);
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    async start() {
        this.server.start();
    }
    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    async afterStart() {
        this.server.afterStart();
    }
    /**
     * Component lifecycle function
     *
     * @param {Boolean}  force whether stop the component immediately
     * @param {Function}  cb
     * @return {Void}
     */
    async stop(force) {
        this.server.stop();
    }
    /**
     * Proxy server handle
     */
    handle(msg, session, cb) {
        this.server.handle(msg, session, cb);
    }
    /**
     * Proxy server global handle
     */
    globalHandle(msg, session, cb) {
        this.server.globalHandle(msg, session, cb);
    }
}
exports.ServerComponent = ServerComponent;
//# sourceMappingURL=server.js.map