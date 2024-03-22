"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendSessionComponent = void 0;
const backendSessionService_1 = require("../common/service/backendSessionService");
class BackendSessionComponent extends backendSessionService_1.BackendSessionService {
    constructor(app) {
        super(app);
        this.name = '__backendSession__';
        // export backend session service to the application context.
        app.set('backendSessionService', this, true);
    }
}
exports.BackendSessionComponent = BackendSessionComponent;
//# sourceMappingURL=backendSession.js.map