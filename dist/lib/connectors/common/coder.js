"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = void 0;
const pinus_protocol_1 = require("pinus-protocol");
const Constants = require("../../util/constants");
const pinus_logger_1 = require("pinus-logger");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
let encode = function (reqId, route, msg) {
    if (!!reqId) {
        return composeResponse(this, reqId, route, msg);
    }
    else {
        return composePush(this, route, msg);
    }
};
exports.encode = encode;
let decode = function (msg) {
    msg = pinus_protocol_1.Message.decode(msg.body);
    let route = msg.route;
    // decode use dictionary
    if (!!msg.compressRoute) {
        if (!!this.connector.useDict) {
            let abbrs = this.dictionary.getAbbrs();
            if (!abbrs[route]) {
                logger.error('dictionary error! no abbrs for route : %s', route);
                return null;
            }
            route = msg.route = abbrs[route];
        }
        else {
            logger.error('fail to uncompress route code for msg: %j, server not enable dictionary.', msg);
            return null;
        }
    }
    // decode use protobuf
    if (!!this.protobuf && !!this.protobuf.getProtos().client[route]) {
        msg.body = this.protobuf.decode(route, msg.body);
    }
    else if (!!this.decodeIO_protobuf && !!this.decodeIO_protobuf.check(Constants.RESERVED.CLIENT, route)) {
        msg.body = this.decodeIO_protobuf.decode(route, msg.body);
    }
    else {
        try {
            msg.body = JSON.parse(msg.body.toString('utf8'));
        }
        catch (ex) {
            msg.body = {};
        }
    }
    return msg;
};
exports.decode = decode;
let composeResponse = function (server, msgId, route, msgBody) {
    if (!msgId || !route || !msgBody) {
        return null;
    }
    msgBody = encodeBody(server, route, msgBody);
    return pinus_protocol_1.Message.encode(msgId, pinus_protocol_1.Message.TYPE_RESPONSE, false, null, msgBody);
};
let composePush = function (server, route, msgBody) {
    if (!route || !msgBody) {
        return null;
    }
    msgBody = encodeBody(server, route, msgBody);
    // encode use dictionary
    let compressRoute = false;
    if (!!server.dictionary) {
        let dict = server.dictionary.getDict();
        if (!!server.connector.useDict && !!dict[route]) {
            route = dict[route];
            compressRoute = true;
        }
    }
    return pinus_protocol_1.Message.encode(0, pinus_protocol_1.Message.TYPE_PUSH, compressRoute, route, msgBody);
};
let encodeBody = function (server, route, msgBody) {
    // encode use protobuf
    if (!!server.protobuf && !!server.protobuf.getProtos().server[route]) {
        msgBody = server.protobuf.encode(route, msgBody);
    }
    else if (!!server.decodeIO_protobuf && !!server.decodeIO_protobuf.check(Constants.RESERVED.SERVER, route)) {
        msgBody = server.decodeIO_protobuf.encode(route, msgBody);
    }
    else {
        msgBody = Buffer.from(JSON.stringify(msgBody), 'utf8');
    }
    return msgBody;
};
//# sourceMappingURL=coder.js.map