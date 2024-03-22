"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorComponent = void 0;
/**
 * Component for monitor.
 * Load and start monitor client.
 */
const monitor_1 = require("../monitor/monitor");
class MonitorComponent {
    constructor(app, opts) {
        this.name = '__monitor__';
        this.monitor = new monitor_1.Monitor(app, opts);
    }
    start() {
        return new Promise((resolve, reject) => {
            this.monitor.start(err => {
                if (err) {
                    reject(err);
                }
                else
                    resolve();
            });
        });
    }
    stop(force) {
        return new Promise((resolve) => {
            this.monitor.stop(resolve);
        });
    }
    reconnect(masterInfo) {
        this.monitor.reconnect(masterInfo);
    }
}
exports.MonitorComponent = MonitorComponent;
//# sourceMappingURL=monitor.js.map