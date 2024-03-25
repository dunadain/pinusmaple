import * as net from 'net';
import * as tls from 'tls';
import * as util from 'util';
import { EventEmitter } from 'events';

import { HybridSocket } from './hybridsocket';
import { HybridSwitcher as Switcher, HybridSwitcherOptions } from './hybrid/switcher';
import { HandshakeCommand } from './commands/handshake';
import { HeartbeatCommand } from './commands/heartbeat';
import * as Kick from './commands/kick';
import * as coder from './common/coder';
import { DictionaryComponent } from '../components/dictionary';
import { ProtobufComponent } from '../components/protobuf';
import { IComponent } from '../interfaces/IComponent';
import { pinus } from '../pinus';
import { IConnector } from '../interfaces/IConnector';
import { IHybridSocket } from './hybrid/IHybridSocket';
import { ConnectorComponent } from '../components/connector';

let curId = 1;

export interface HybridConnectorOptions extends HybridSwitcherOptions {
    useDict?: boolean;
    useProtobuf?: boolean;
    distinctHost?: boolean;
    realIPKey?: string;   // 代理过后真实客户端ip获取字段
    realPortKey?: string; // 代理过后真实客户端port获取字段
}

/**
 * Connector that manager low level connection and protocol bewteen server and client.
 * Develper can provide their own connector to switch the low level prototol, such as tcp or probuf.
 */
export class HybridConnector extends EventEmitter implements IConnector {
    opts: HybridConnectorOptions;
    port: number;
    host: string;
    useDict: boolean;
    useProtobuf: boolean;
    handshake: HandshakeCommand;
    heartbeat: HeartbeatCommand;
    distinctHost: boolean;
    ssl: tls.TlsOptions | undefined;
    switcher: Switcher | null;

    connector!: IConnector;
    dictionary!: DictionaryComponent;
    protobuf!: ProtobufComponent;
    decodeIO_protobuf!: IComponent;

    listeningServer!: net.Server | tls.Server;

    constructor(port: number, host: string, opts?: HybridConnectorOptions) {
        super();

        this.opts = opts ?? {};
        if (this.opts.realPortKey) {
            this.opts.realPortKey = this.opts.realPortKey.toLowerCase();
        }
        if (this.opts.realIPKey) {
            this.opts.realIPKey = this.opts.realIPKey.toLowerCase();
        }
        this.port = port;
        this.host = host;
        this.useDict = this.opts && !!this.opts.useDict;
        this.useProtobuf = !!this.opts.useProtobuf;
        this.handshake = new HandshakeCommand(this.opts);
        this.heartbeat = new HeartbeatCommand(this.opts);
        this.distinctHost = !!this.opts.distinctHost;
        this.ssl = this.opts.ssl;

        this.switcher = null;
    }

    /**
     * Start connector to listen the specified port
     */
    async start() {
        let app = pinus.app;
        let self = this;

        let gensocket = function (socket: IHybridSocket, request: any) {
            let hybridsocket = new HybridSocket(curId++, socket, request, self.opts);
            hybridsocket.on('handshake', self.handshake.handle.bind(self.handshake, hybridsocket));
            hybridsocket.on('heartbeat', self.heartbeat.handle.bind(self.heartbeat, hybridsocket));
            hybridsocket.on('disconnect', self.heartbeat.clear.bind(self.heartbeat, hybridsocket.id));
            hybridsocket.on('closing', Kick.handle.bind(null, hybridsocket));
            self.emit('connection', hybridsocket);
        };

        this.connector = (app.components.__connector__ as ConnectorComponent).connector!;
        this.dictionary = app.components.__dictionary__ as DictionaryComponent;
        this.protobuf = app.components.__protobuf__ as ProtobufComponent;
        this.decodeIO_protobuf = app.components.__decodeIO__protobuf__;

        if (!this.ssl) {
            this.listeningServer = net.createServer();
        } else {
            this.listeningServer = tls.createServer(this.ssl);
            if (this.opts.sslWatcher) {
                this.opts.sslWatcher((opts) => {
                    (this.listeningServer as tls.Server).setSecureContext(opts);
                });
            }
        }
        this.switcher = new Switcher(this.listeningServer, self.opts);

        this.switcher.on('connection', function (socket, request) {
            gensocket(socket, request);
        });

        if (!!this.distinctHost) {
            this.listeningServer.listen(this.port, this.host);
        } else {
            this.listeningServer.listen(this.port);
        }
    }

    async stop(force: boolean) {
        this.switcher?.close();
        this.listeningServer.close();
    }
    decode = coder.decode;

    encode = coder.encode;

}
