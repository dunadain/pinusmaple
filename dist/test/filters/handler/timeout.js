"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let timeoutFilter = require('../../../lib/filters/handler/timeout').TimeoutFilter;
let FilterService = require('../../../lib/common/service/filterService').FilterService;
let util = require('util');
let mockSession = {
    key: '123'
};
let WAIT_TIME = 100;
describe('#timeoutFilter', function () {
    it('should do before filter ok', function (done) {
        let service = new FilterService();
        let filter = new timeoutFilter();
        service.before(filter);
        service.beforeFilter(null, {}, mockSession, function () {
            should.exist(mockSession);
            should.exist(mockSession.__timeout__);
            done();
        });
    });
    it('should do after filter by doing before filter ok', function (done) {
        let service = new FilterService();
        let filter = new timeoutFilter();
        let _session;
        service.before(filter);
        service.beforeFilter(null, {}, mockSession, function () {
            should.exist(mockSession);
            should.exist(mockSession.__timeout__);
            _session = mockSession;
        });
        service.after(filter);
        service.afterFilter(null, null, {}, mockSession, null, function () {
            should.exist(mockSession);
            should.strictEqual(mockSession, _session);
        });
        setTimeout(done, WAIT_TIME);
    });
});
//# sourceMappingURL=timeout.js.map