/**
 * Component for server starup.
 */
import { Server , create as createServer, ServerOptions, FrontendOrBackendSession } from '../server/server';
import { IComponent } from '../interfaces/IComponent';
import { Application } from '../application';
import { FrontendSession } from '../common/service/sessionService';
import { HandlerCallback } from '../common/service/handlerService';
import { BackendSession } from '../common/service/backendSessionService';

/**
 * Server component class
 *
 * @param {Object} app  current application context
 */
export class ServerComponent  implements IComponent {
    server: Server;
    constructor(app: Application, opts: ServerOptions) {
        this.server = createServer(app, opts);
    }
    name = '__server__';

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
    async stop(force: boolean) {
        this.server.stop();
    }

    /**
     * Proxy server handle
     */
    handle(msg: any, session: FrontendOrBackendSession, cb: HandlerCallback) {
        this.server.handle(msg, session, cb);
    }

    /**
     * Proxy server global handle
     */
    globalHandle(msg: any, session: FrontendOrBackendSession, cb: HandlerCallback) {
        this.server.globalHandle(msg, session, cb);
    }
}