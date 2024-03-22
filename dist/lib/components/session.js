"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionComponent = void 0;
const sessionService_1 = require("../common/service/sessionService");
/**
 * Session component. Manage sessions.
 *
 * @param {Object} app  current application context
 * @param {Object} opts attach parameters
 */
class SessionComponent extends sessionService_1.SessionService {
    constructor(app, opts) {
        super(opts);
        this.name = '__session__';
        this.app = app;
        app.set('sessionService', this, true);
    }
}
exports.SessionComponent = SessionComponent;
//# sourceMappingURL=session.js.map