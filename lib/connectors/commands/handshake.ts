import { pinus } from '../../pinus';
import { Package } from 'pinus-protocol';
import { ISocket } from '../../interfaces/ISocket';
import { DictionaryComponent } from '../../components/dictionary';
import { ProtobufComponent } from '../../components/protobuf';
import { ConnectorComponent } from '../../components/connector';

let CODE_OK = 200;
let CODE_USE_ERROR = 500;
let CODE_OLD_CLIENT = 501;

export type HanshakeFunction = (msg: any , cb: (err ?: Error , resp ?: any) => void , socket: ISocket) => void;
export type CheckClientFunction = (type: string, version: string) => boolean;

export interface HandshakeCommandOptions {
    handshake ?: HanshakeFunction;
    heartbeat ?: number;
    checkClient ?: CheckClientFunction;
    useDict ?: boolean;
    useProtobuf ?: boolean;
    useCrypto ?: boolean;
}

/**
 * Process the handshake request.
 *
 * @param {Object} opts option parameters
 *                      opts.handshake(msg, cb(err, resp)) handshake callback. msg is the handshake message from client.
 *                      opts.hearbeat heartbeat interval (level?)
 *                      opts.version required client level
 */
export class HandshakeCommand {
    userHandshake: HanshakeFunction | undefined;
    heartbeatSec = 0;
    heartbeat = 0;
    checkClient: CheckClientFunction | undefined;
    useDict: boolean;
    useProtobuf: boolean;
    useCrypto: boolean;

    constructor(opts: HandshakeCommandOptions) {
        opts = opts || {};
        this.userHandshake = opts.handshake;

        if (opts.heartbeat) {
            this.heartbeatSec = opts.heartbeat;
            this.heartbeat = opts.heartbeat * 1000;
        }

        this.checkClient = opts.checkClient;

        this.useDict = !!opts.useDict;
        this.useProtobuf = !!opts.useProtobuf;
        this.useCrypto = !!opts.useCrypto;
    }

    handle(socket: ISocket, msg: any) {
        if (!msg.sys) {
            processError(socket, CODE_USE_ERROR);
            return;
        }

        if (typeof this.checkClient === 'function') {
            if (!msg || !msg.sys || !this.checkClient(msg.sys.type, msg.sys.version)) {
                processError(socket, CODE_OLD_CLIENT);
                return;
            }
        }

        let opts: any = {
            heartbeat: setupHeartbeat(this)
        };

        if (this.useDict) {
            const dict = pinus.app.components.__dictionary__ as DictionaryComponent;
            let dictVersion = dict.getVersion();
            if (!msg.sys.dictVersion || msg.sys.dictVersion !== dictVersion) {

                // may be deprecated in future
                opts.dict = dict.getDict();

                // 用不到这个。
            //    opts.routeToCode = pinus.app.components.__dictionary__.getDict();
           //     opts.codeToRoute = pinus.app.components.__dictionary__.getAbbrs();
                opts.dictVersion = dictVersion;
            }
            opts.useDict = true;
        }

        if (this.useProtobuf) {
            const pbc = pinus.app.components.__protobuf__ as ProtobufComponent;
            let protoVersion = pbc.getVersion();
            if (!msg.sys.protoVersion || msg.sys.protoVersion !== protoVersion) {
                opts.protos = pbc.getProtos();
            }
            opts.useProto = true;
        }

        if (!!pinus.app.components.__decodeIO__protobuf__) {
            if (!!this.useProtobuf) {
                throw new Error('protobuf can not be both used in the same project.');
            }
            let component = pinus.app.components.__decodeIO__protobuf__ as any;
            let version = component.getVersion();
            if (!msg.sys.protoVersion || msg.sys.protoVersion < version) {
                opts.protos = component.getProtos();
            }
            opts.useProto = true;
        }

        if (this.useCrypto) {
            if (socket.id) (pinus.app.components.__connector__ as ConnectorComponent).setPubKey(socket.id, msg.sys.rsa);
        }

        if (typeof this.userHandshake === 'function') {
            this.userHandshake(msg, function (err, resp) {
                if (err) {
                    process.nextTick(function () {
                        processError(socket, CODE_USE_ERROR);
                    });
                    return;
                }
                process.nextTick(function () {
                    response(socket, opts, resp);
                });
            }, socket);
            return;
        }

        process.nextTick(function () {
            response(socket, opts);
        });
    }

}

let setupHeartbeat = function (self: HandshakeCommand) {
    return self.heartbeatSec;
};

let response = function (socket: ISocket, sys: any, resp ?: any) {
    let res: any = {
        code: CODE_OK,
        sys: sys
    };
    if (resp) {
        res.user = resp;
    }
    if (socket.handshakeResponse) socket.handshakeResponse(Package.encode(Package.TYPE_HANDSHAKE, Buffer.from(JSON.stringify(res))));
};

let processError = function (socket: ISocket, code: number) {
    let res = {
        code: code
    };
    if (socket && socket.sendForce) socket.sendForce(Package.encode(Package.TYPE_HANDSHAKE, Buffer.from(JSON.stringify(res))));
    process.nextTick(function () {
        socket.disconnect();
    });
};
