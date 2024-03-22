"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEvents = void 0;
var AppEvents;
(function (AppEvents) {
    AppEvents["ADD_SERVERS"] = "add_servers";
    AppEvents["REMOVE_SERVERS"] = "remove_servers";
    AppEvents["REPLACE_SERVERS"] = "replace_servers";
    AppEvents["BIND_SESSION"] = "bind_session";
    AppEvents["UNBIND_SESSION"] = "unbind_session";
    AppEvents["CLOSE_SESSION"] = "close_session";
    AppEvents["ADD_CRONS"] = "add_crons";
    AppEvents["REMOVE_CRONS"] = "remove_crons";
    AppEvents["START_SERVER"] = "start_server";
    AppEvents["START_ALL"] = "start_all";
    // ProtobufComponent 组件，当协议文件热更新时 通知  参数： type(server|client)
    AppEvents["PROTO_CHANGED"] = "proto_changed";
})(AppEvents = exports.AppEvents || (exports.AppEvents = {}));
exports.default = AppEvents;
//# sourceMappingURL=events.js.map