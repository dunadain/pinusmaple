"use strict";
/* Protocol - protocol constants */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLEAN_SESSION_MASK = exports.WILL_FLAG_MASK = exports.WILL_QOS_SHIFT = exports.WILL_QOS_MASK = exports.WILL_RETAIN_MASK = exports.PASSWORD_MASK = exports.USERNAME_MASK = exports.LENGTH_FIN_MASK = exports.LENGTH_MASK = exports.RETAIN_MASK = exports.QOS_SHIFT = exports.QOS_MASK = exports.DUP_MASK = exports.CMD_MASK = exports.CMD_SHIFT = exports.codes = exports.types = void 0;
/* Command code => mnemonic */
exports.types = {
    0: 'reserved',
    1: 'connect',
    2: 'connack',
    3: 'publish',
    4: 'puback',
    5: 'pubrec',
    6: 'pubrel',
    7: 'pubcomp',
    8: 'subscribe',
    9: 'suback',
    10: 'unsubscribe',
    11: 'unsuback',
    12: 'pingreq',
    13: 'pingresp',
    14: 'disconnect',
    15: 'reserved'
};
/* Mnemonic => Command code */
exports.codes = {};
for (let k in exports.types) {
    let v = exports.types[k];
    exports.codes[v] = Number(k);
}
/* Header */
exports.CMD_SHIFT = 4;
exports.CMD_MASK = 0xF0;
exports.DUP_MASK = 0x08;
exports.QOS_MASK = 0x03;
exports.QOS_SHIFT = 1;
exports.RETAIN_MASK = 0x01;
/* Length */
exports.LENGTH_MASK = 0x7F;
exports.LENGTH_FIN_MASK = 0x80;
/* Connect */
exports.USERNAME_MASK = 0x80;
exports.PASSWORD_MASK = 0x40;
exports.WILL_RETAIN_MASK = 0x20;
exports.WILL_QOS_MASK = 0x18;
exports.WILL_QOS_SHIFT = 3;
exports.WILL_FLAG_MASK = 0x04;
exports.CLEAN_SESSION_MASK = 0x02;
//# sourceMappingURL=protocol.js.map