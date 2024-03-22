"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterComponent = void 0;
/**
 * Component for master.
 */
const master_1 = require("../master/master");
/**
* Master component class
*
* @param {Object} app current application context
*/
class MasterComponent {
    constructor(app, opts) {
        this.name = '__master__';
        this.master = new master_1.MasterServer(app, opts);
    }
    /**
     * Component lifecycle function
     *
     * @param  {Function} cb
     * @return {Void}
     */
    start() {
        return new Promise((resolve, reject) => {
            this.master.start(err => {
                if (err) {
                    reject(err);
                }
                else
                    resolve();
            });
        });
    }
    /**
     * Component lifecycle function
     *
     * @param  {Boolean}   force whether stop the component immediately
     * @param  {Function}  cb
     * @return {Void}
     */
    stop(force) {
        return new Promise((resolve) => {
            this.master.stop(resolve);
        });
    }
}
exports.MasterComponent = MasterComponent;
//# sourceMappingURL=master.js.map