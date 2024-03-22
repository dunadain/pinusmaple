"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockManager = void 0;
let DEFAULT_PREFIX = 'PINUS:CHANNEL';
let utils = require('../../lib/util/utils');
class MockManager {
    constructor(app, opts) {
        this.app = app;
        this.opts = opts || {};
        this.prefix = opts.prefix || DEFAULT_PREFIX;
    }
    start(cb) {
        this.usersMap = {};
        utils.invokeCallback(cb);
    }
    stop(force, cb) {
        this.usersMap = null;
        utils.invokeCallback(cb);
    }
    add(name, uid, sid, cb) {
        let key = genKey(this, name, sid);
        if (!this.usersMap[key]) {
            this.usersMap[key] = [];
        }
        this.usersMap[key].push(uid);
        utils.invokeCallback(cb);
    }
    leave(name, uid, sid, cb) {
        let key = genKey(this, name, sid);
        let res = deleteFrom(uid, this.usersMap[key]);
        if (this.usersMap[key] && this.usersMap[key].length === 0) {
            delete this.usersMap[sid];
        }
        utils.invokeCallback(cb);
    }
    getMembersBySid(name, sid, cb) {
        let key = genKey(this, name, sid);
        if (!this.usersMap[key])
            this.usersMap[key] = [];
        utils.invokeCallback(cb, null, this.usersMap[key]);
    }
    destroyChannel(name, cb) {
        let servers = this.app.getServers();
        let server, removes = [];
        for (let sid in servers) {
            server = servers[sid];
            if (this.app.isFrontend(server)) {
                removes.push(genKey(this, name, sid));
            }
        }
        if (removes.length === 0) {
            utils.invokeCallback(cb);
            return;
        }
        for (let i = 0; i < removes.length; i++) {
            delete this.usersMap[removes[i]];
        }
        utils.invokeCallback(cb);
    }
}
exports.MockManager = MockManager;
let genKey = function (self, name, sid) {
    return self.prefix + ':' + name + ':' + sid;
};
let deleteFrom = function (uid, group) {
    if (!group) {
        return true;
    }
    for (let i = 0, l = group.length; i < l; i++) {
        if (group[i] === uid) {
            group.splice(i, 1);
            return true;
        }
    }
    return false;
};
//# sourceMappingURL=mockChannelManager.js.map