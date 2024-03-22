"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let serialFilter = require('../../../lib/filters/handler/time').TimeFilter;
let FilterService = require('../../../lib/common/service/filterService').FilterService;
let util = require('util');
let mockSession = {
    key: '123'
};
let WAIT_TIME = 100;
describe('#timeFilter', function () {
    it('should do before filter ok', function (done) {
        let service = new FilterService();
        let filter = new serialFilter();
        service.before(filter);
        service.beforeFilter(null, mockSession, mockSession, function () {
            should.exist(mockSession);
            should.exist(mockSession.__startTime__);
            done();
        });
    });
    it('should do after filter by doing before filter ok', function (done) {
        let service = new FilterService();
        let filter = new serialFilter();
        let _session;
        service.before(filter);
        service.afterFilter(null, {}, {}, mockSession, {}, function () {
            should.exist(mockSession);
            should.exist(mockSession.__startTime__);
            _session = mockSession;
        });
        service.after(filter);
        service.afterFilter(null, { route: 'hello' }, {}, mockSession, {}, function () {
            should.exist(mockSession);
            should.strictEqual(mockSession, _session);
        });
        setTimeout(done, WAIT_TIME);
    });
});
//# sourceMappingURL=time.js.map