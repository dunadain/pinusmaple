"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let pinus = require('../lib/index').pinus;
const should = require("should");
let mockBase = process.cwd() + '/test';
// import { describe, it } from "mocha-typescript"
describe('pinus', function () {
    describe('#createApp', function () {
        it('should create and get app, be the same instance', function (done) {
            let app = pinus.createApp({ base: mockBase });
            should.exist(app);
            let app2 = pinus.app;
            should.exist(app2);
            should.strictEqual(app, app2);
            done();
        });
    });
});
//# sourceMappingURL=pomelo.js.map