/**
 * Component for monitor.
 * Load and start monitor client.
 */
import { Monitor, MonitorOptions } from '../monitor/monitor';
import { IComponent } from '../interfaces/IComponent';
import { Application } from '../application';
import { MasterInfo } from '../index';



export class MonitorComponent implements IComponent {
    monitor: Monitor;
    constructor(app: Application, opts ?: MonitorOptions) {
        this.monitor = new Monitor(app, opts);
    }

    name = '__monitor__';
    start() {
        return new Promise<void>((resolve, reject) => {
            this.monitor.start(err => {
                if (err) {
                    reject(err);
                } else resolve();
            });
        });
    }

    stop(force: boolean) {
        return new Promise<void>((resolve) => {
            this.monitor.stop(resolve);
        });
    }

    reconnect(masterInfo: MasterInfo) {
        this.monitor.reconnect(masterInfo);
    }
}