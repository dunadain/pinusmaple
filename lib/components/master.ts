/**
 * Component for master.
 */
import { MasterServer, MasterServerOptions } from '../master/master';
import { IComponent } from '../interfaces/IComponent';
import { Application } from '../application';

/**
* Master component class
*
* @param {Object} app current application context
*/
export class MasterComponent implements IComponent {
    name = '__master__';
    master: MasterServer;
    constructor(app: Application, opts: MasterServerOptions) {
        this.master = new MasterServer(app, opts);
    }

    /**
     * Component lifecycle function
     *
     * @param  {Function} cb
     * @return {Void}
     */
    start() {
        return new Promise<void>((resolve, reject) => {
            this.master.start(err => {
                if (err) {
                    reject(err);
                } else resolve();
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
    stop(force: boolean) {
        return new Promise<void>((resolve) => {
            this.master.stop(resolve);
        });
    }

}