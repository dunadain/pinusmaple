"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelComponent = void 0;
const channelService_1 = require("../common/service/channelService");
class ChannelComponent extends channelService_1.ChannelService {
    constructor(app, opts) {
        super(app, opts);
        this.name = '__channel__';
        app.set('channelService', this, true);
    }
}
exports.ChannelComponent = ChannelComponent;
//# sourceMappingURL=channel.js.map