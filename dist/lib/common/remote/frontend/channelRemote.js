"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRemote = void 0;
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
function default_1(app) {
    return new ChannelRemote(app);
}
exports.default = default_1;
class ChannelRemote {
    constructor(app) {
        this.app = app;
    }
    /**
     * Push message to client by uids.
     *
     * @param  {String}   route route string of message
     * @param  {Object}   msg   message
     * @param  {Array}    uids  user ids that would receive the message
     * @param  {Object}   opts  push options
     * @param  {Function} cb    callback function
     */
    pushMessage(route, msg, uids, opts) {
        return new Promise((resolve, reject) => {
            if (!msg) {
                logger.error('Can not send empty message! route : %j, compressed msg : %j', route, msg);
                return reject(new Error('can not send empty message.'));
            }
            let connector = this.app.components.__connector__;
            let sessionService = this.app.get('sessionService');
            let fails = [], sids = [], sessions, j, k;
            for (let i = 0, l = uids.length; i < l; i++) {
                sessions = sessionService.getByUid(uids[i]);
                if (!sessions) {
                    fails.push(uids[i]);
                }
                else {
                    for (j = 0, k = sessions.length; j < k; j++) {
                        sids.push(sessions[j].id);
                    }
                }
            }
            logger.debug('[%s] pushMessage uids: %j, msg: %j, sids: %j', this.app.serverId, uids, msg, sids);
            connector.send(0, route, msg, sids, opts, function (err) {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve(fails);
                }
            });
        });
    }
    /**
     * Broadcast to all the client connectd with current frontend server.
     *
     * @param  {String}    route  route string
     * @param  {Object}    msg    message
     * @param  {Boolean}   opts   broadcast options.
     * @param  {Function}  cb     callback function
     */
    broadcast(route, msg, opts) {
        return new Promise((resolve, reject) => {
            let connector = this.app.components.__connector__;
            connector.send(0, route, msg, null, opts, function (err, resp) {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve(resp);
                }
            });
        });
    }
}
exports.ChannelRemote = ChannelRemote;
//# sourceMappingURL=channelRemote.js.map