"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let rpcLogFilter = require('../../../lib/filters/rpc/rpcLog').RpcLogFilter;
rpcLogFilter = new rpcLogFilter();
let mockData = {
    serverId: 'connector-server-1',
    msg: 'hello',
    opts: {}
};
describe('#rpcLogFilter', function () {
    it('should do after filter by before filter', function (done) {
        rpcLogFilter.before(mockData.serverId, mockData.msg, mockData.opts, function () {
            rpcLogFilter.after(mockData.serverId, mockData.msg, mockData.opts, function (serverId, msg, opts) {
                should.exist(mockData.opts['__start_time__']);
                done();
            });
        });
    });
});
//# sourceMappingURL=rpcLog.js.map