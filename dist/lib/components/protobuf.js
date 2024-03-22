"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtobufComponent = void 0;
const fs = require("fs");
const path = require("path");
const pinus_protobuf_1 = require("pinus-protobuf");
const Constants = require("../util/constants");
const crypto = require("crypto");
const pinus_logger_1 = require("pinus-logger");
const events_1 = require("../util/events");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
class ProtobufComponent {
    constructor(app, opts) {
        this.watchers = {};
        this.serverProtos = {};
        this.clientProtos = {};
        this.version = '';
        this.name = '__protobuf__';
        this.app = app;
        opts = opts || {};
        logger.debug('ProtobufComponent options:', opts);
        let env = app.get(Constants.RESERVED.ENV);
        let originServerPath = path.join(app.getBase(), Constants.FILEPATH.SERVER_PROTOS);
        let presentServerPath = path.join(Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.SERVER_PROTOS));
        let originClientPath = path.join(app.getBase(), Constants.FILEPATH.CLIENT_PROTOS);
        let presentClientPath = path.join(Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.CLIENT_PROTOS));
        this.serverProtosPath = opts.serverProtos || (this._canRequire(originServerPath) ? Constants.FILEPATH.SERVER_PROTOS : presentServerPath);
        this.clientProtosPath = opts.clientProtos || (this._canRequire(originClientPath) ? Constants.FILEPATH.CLIENT_PROTOS : presentClientPath);
        this.setProtos(Constants.RESERVED.SERVER, path.join(app.getBase(), this.serverProtosPath));
        this.setProtos(Constants.RESERVED.CLIENT, path.join(app.getBase(), this.clientProtosPath));
        this.protobuf = new pinus_protobuf_1.Protobuf({
            encoderProtos: this.serverProtos,
            decoderProtos: this.clientProtos,
            encoderCacheSize: opts.encoderCacheSize,
            decodeCheckMsg: opts.decodeCheckMsg,
        });
    }
    _canRequire(path) {
        try {
            require.resolve(path);
        }
        catch (err) {
            return false;
        }
        return true;
    }
    encode(key, msg) {
        return this.protobuf.encode(key, msg);
    }
    encode2Bytes(key, msg) {
        return this.protobuf.encode2Bytes(key, msg);
    }
    decode(key, msg) {
        return this.protobuf.decode(key, msg);
    }
    getProtos() {
        return {
            server: this.serverProtos,
            client: this.clientProtos,
            version: this.version
        };
    }
    getVersion() {
        return this.version;
    }
    // 手动重新加载协议文件。
    manualReloadProtos() {
        let truePath = path.join(this.app.getBase(), this.serverProtosPath);
        truePath = require.resolve(truePath);
        this.onUpdate(Constants.RESERVED.SERVER, truePath, 'change');
        truePath = path.join(this.app.getBase(), this.clientProtosPath);
        truePath = require.resolve(truePath);
        this.onUpdate(Constants.RESERVED.CLIENT, truePath, 'change');
    }
    setProtos(type, path) {
        if (!this._canRequire(path)) {
            return;
        }
        if (type === Constants.RESERVED.SERVER) {
            this.serverProtos = pinus_protobuf_1.Protobuf.parse(require(path));
        }
        if (type === Constants.RESERVED.CLIENT) {
            this.clientProtos = pinus_protobuf_1.Protobuf.parse(require(path));
        }
        let protoStr = JSON.stringify(this.clientProtos) + JSON.stringify(this.serverProtos);
        this.version = crypto.createHash('md5').update(protoStr).digest('base64');
        // Watch file
        const truePath = require.resolve(path);
        let watcher = fs.watch(truePath, this.onUpdate.bind(this, type, truePath));
        if (this.watchers[type]) {
            this.watchers[type].close();
        }
        this.watchers[type] = watcher;
    }
    clearRequireCache(path) {
        const moduleObj = require.cache[path];
        if (!moduleObj) {
            logger.warn('can not find module of truepath', path);
            return;
        }
        if (moduleObj.parent) {
            //    console.log('has parent ',moduleObj.parent);
            moduleObj.parent.children.splice(moduleObj.parent.children.indexOf(moduleObj), 1);
        }
        delete require.cache[path];
    }
    onUpdate(type, path, event, filename, errTry) {
        if (event !== 'change') {
            return;
        }
        let self = this;
        this.clearRequireCache(path);
        try {
            let protos = pinus_protobuf_1.Protobuf.parse(require(path));
            // 预防 git checkout这样的操作导致获得的数据为空的情况
            if (!protos || !Object.keys(protos).length) {
                // retry.
                throw new Error('protos error');
            }
            if (type === Constants.RESERVED.SERVER) {
                this.protobuf.setEncoderProtos(protos);
                self.serverProtos = protos;
            }
            else {
                this.protobuf.setDecoderProtos(protos);
                self.clientProtos = protos;
            }
            let protoStr = JSON.stringify(self.clientProtos) + JSON.stringify(self.serverProtos);
            self.version = crypto.createHash('md5').update(protoStr).digest('base64');
            logger.info('change proto file , type : %j, path : %j, version : %j', type, path, self.version);
            // 抛出 proto 变化事件。
            self.app.event.emit(events_1.default.PROTO_CHANGED, type);
        }
        catch (e) {
            logger.error('change proto file error! path : %j', path, filename, errTry, e);
            if (!errTry) {
                logger.warn('setTimeout,try update proto');
                setTimeout(() => {
                    logger.warn('try update proto again');
                    this.onUpdate(type, path, event, filename, true);
                }, 3000);
            }
        }
        this.watchers[type].close();
        this.watchers[type] = fs.watch(path, this.onUpdate.bind(this, type, path));
    }
    async stop(force) {
        for (let type in this.watchers) {
            this.watchers[type].close();
        }
        this.watchers = {};
    }
}
exports.ProtobufComponent = ProtobufComponent;
//# sourceMappingURL=protobuf.js.map