"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let HandlerService = require('../../lib/common/service/handlerService').HandlerService;
class MockApp {
    constructor() {
        this.serverType = 'connector';
        this.usedPlugins = [];
    }
    get(key) {
        return this[key];
    }
    getCurrentServer() {
        return {};
    }
}
let mockApp = new MockApp();
let mockSession = {
    exportSession: function () {
        return this;
    }
};
let mockMsg = { key: 'some request message' };
let mockRouteRecord = { serverType: 'connector', handler: 'testHandler', method: 'testMethod' };
describe('handler service test', function () {
    describe('handle', function () {
        it('should dispatch the request to the handler if the route match current server type', function (done) {
            let invoke1Count = 0, invoke2Count = 0;
            // mock datas
            let mockHandlers = {
                testHandler: {
                    testMethod: async function (msg, session, next) {
                        invoke1Count++;
                        msg.should.eql(mockMsg);
                    }
                },
                test2Handler: {
                    testMethod: async function (msg, session, next) {
                        invoke2Count++;
                    }
                }
            };
            let mockOpts = {};
            let service = new HandlerService(mockApp, mockOpts);
            service.handlerMap = { connector: mockHandlers };
            service.handle(mockRouteRecord, mockMsg, mockSession, function () {
                invoke1Count.should.equal(1);
                invoke2Count.should.equal(0);
                done();
            });
        });
        it('should return an error if can not find the appropriate handler locally', function (done) {
            let mockHandlers = {};
            let mockOpts = {};
            let service = new HandlerService(mockApp, mockOpts);
            service.handlerMap = { connector: mockHandlers };
            service.handle(mockRouteRecord, mockMsg, mockSession, function (err) {
                should.exist(err);
                done();
            });
        });
    });
});
//# sourceMappingURL=handlerService.js.map