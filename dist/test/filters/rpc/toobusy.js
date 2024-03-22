"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { describe, it } from "mocha-typescript"
let toobusyFilter = require('../../../lib/filters/rpc/toobusy').RpcToobusyFilter;
toobusyFilter = new toobusyFilter();
let mockData = {
    serverId: 'connector-server-1',
    msg: 'hello',
    opts: {}
};
describe('#toobusyFilter', function () {
    it('should no callback for toobusy', function (done) {
        try {
            require('toobusy');
        }
        catch (e) {
            done();
            return;
        }
        function load() {
            let callbackInvoked = false;
            toobusyFilter.before(mockData.serverId, mockData.msg, mockData.opts, function (serverId, msg, opts) {
                callbackInvoked = true;
            });
            if (!callbackInvoked) {
                console.log(' logic of toobusy enterd, done!');
                return done();
            }
            let start = Date.now();
            while ((Date.now() - start) < 250) {
                for (let i = 0; i < 1e5;)
                    i++;
            }
            setTimeout(load, 0);
        }
        load();
    });
});
//# sourceMappingURL=toobusy.js.map