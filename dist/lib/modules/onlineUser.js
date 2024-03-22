"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlineUserModule = void 0;
/*!
 * Pomelo -- consoleModule onlineUser
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
const pinus_logger_1 = require("pinus-logger");
const utils = require("../util/utils");
const pinus_admin_1 = require("pinus-admin");
const pinus_1 = require("../pinus");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class OnlineUserModule {
    constructor(opts) {
        opts = opts || {};
        this.app = pinus_1.pinus.app;
        this.type = opts.type || pinus_admin_1.ModuleType.pull;
        this.interval = opts.interval || 5;
    }
    /**
    * collect monitor data from monitor
    *
    * @param {Object} agent monitorAgent object
    * @param {Object} msg client message
    * @param {Function} cb callback function
    * @api public
    */
    monitorHandler(agent, msg, cb) {
        let connectionService = this.app.components.__connection__;
        if (!connectionService) {
            logger.error('not support connection: %j', agent.id);
            return;
        }
        agent.notify(OnlineUserModule.moduleId, connectionService.getStatisticsInfo());
    }
    masterHandler(agent, msg) {
        if (!msg) {
            // pull interval callback
            let list = agent.typeMap['connector'];
            if (!list || list.length === 0) {
                return;
            }
            agent.notifyByType('connector', OnlineUserModule.moduleId, msg);
            return;
        }
        let data = agent.get(OnlineUserModule.moduleId);
        if (!data) {
            data = {};
            agent.set(OnlineUserModule.moduleId, data);
        }
        data[msg.serverId] = msg;
    }
    /**
     * Handle client request
     *
     * @param {Object} agent masterAgent object
     * @param {Object} msg client message
     * @param {Function} cb callback function
     * @api public
     */
    clientHandler(agent, msg, cb) {
        utils.invokeCallback(cb, null, agent.get(OnlineUserModule.moduleId));
    }
}
exports.OnlineUserModule = OnlineUserModule;
OnlineUserModule.moduleId = 'onlineUser';
//# sourceMappingURL=onlineUser.js.map