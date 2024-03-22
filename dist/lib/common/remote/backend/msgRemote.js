"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgRemote = void 0;
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('forward-log', path.basename(__filename));
/**
 * Remote service for backend servers.
 * Receive and handle request message forwarded from frontend server.
 */
function default_1(app) {
    return new MsgRemote(app);
}
exports.default = default_1;
class MsgRemote {
    constructor(app) {
        this.app = app;
    }
    /**
     * Forward message from frontend server to other server's handlers
     *
     * @param msg {Object} request message
     * @param session {Object} session object for current request
     * @param cb {Function} callback function
     */
    forwardMessage(msg, session) {
        return new Promise((resolve, reject) => {
            let server = this.app.components.__server__;
            let sessionService = this.app.components.__backendSession__;
            if (!server) {
                logger.error('server component not enable on %s', this.app.serverId);
                reject(new Error('server component not enable'));
                return;
            }
            if (!sessionService) {
                logger.error('backend session component not enable on %s', this.app.serverId);
                reject(new Error('backend sesssion component not enable'));
                return;
            }
            // generate backend session for current request
            let backendSession = sessionService.create(session);
            // handle the request
            logger.debug('session:[%s,%s,%s], handle message: %j', session.id, session.uid, session.frontendId, msg);
            server.handle(msg, backendSession, function (err, resp) {
                logger.debug('session:[%s,%s,%s], handle message result,err:%j,msg:%j,resp:%j', session.id, session.uid, session.frontendId, err, msg, resp);
                // 如果有给response 那就不给connector错误。给response.
                // 因为promise，所以与pomelo有点不一致，pomelo把err与resp一起传回connector了
                if (err) {
                    if (resp) {
                        logger.error('session:[%s,%s,%s], handle message %j, error:%j', session.id, session.uid, session.frontendId, msg, err);
                        return resolve(resp);
                    }
                    reject(err);
                }
                else {
                    resolve(resp);
                }
            });
        });
    }
}
exports.MsgRemote = MsgRemote;
//# sourceMappingURL=msgRemote.js.map