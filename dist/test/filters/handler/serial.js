"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let serialFilter = require('../../../lib/filters/handler/serial').SerialFilter;
let FilterService = require('../../../lib/common/service/filterService').FilterService;
let util = require('util');
let mockSession = {
    key: '123'
};
let WAIT_TIME = 100;
describe('#serialFilter', function () {
    it('should do before filter ok', function (done) {
        let service = new FilterService();
        let filter = new serialFilter();
        service.before(filter);
        service.beforeFilter(null, {}, mockSession, function () {
            should.exist(mockSession);
            should.exist(mockSession.__serialTask__);
            done();
        });
    });
    it('should do after filter by doing before filter ok', function (done) {
        let service = new FilterService();
        let filter = new serialFilter();
        let _session;
        service.before(filter);
        service.afterFilter(null, null, {}, mockSession, {}, function () {
            should.exist(mockSession);
            should.exist(mockSession.__serialTask__);
            _session = mockSession;
        });
        service.after(filter);
        service.afterFilter(null, null, {}, mockSession, {}, function () {
            should.exist(mockSession);
            should.strictEqual(mockSession, _session);
        });
        setTimeout(done, WAIT_TIME);
    });
});
//# sourceMappingURL=serial.js.map