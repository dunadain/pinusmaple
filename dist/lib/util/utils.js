"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promisify = exports.extendsObject = exports.isObject = exports.headHandler = exports.loadCluster = exports.isLocal = exports.checkPort = exports.ping = exports.unicodeToUtf8 = exports.hasChineseChar = exports.format = exports.arrayDiff = exports.startsWith = exports.endsWith = exports.size = exports.invokeCallback = void 0;
const os = require("os");
const util = require("util");
const child_process_1 = require("child_process");
const pinus_logger_1 = require("pinus-logger");
const Constants = require("./constants");
const pinus_1 = require("../pinus");
const path = require("path");
let logger = (0, pinus_logger_1.getLogger)('pinus', path.basename(__filename));
/**
 * Invoke callback with check
 */
function invokeCallback(cb, ...args) {
    if (typeof cb === 'function') {
        let len = args.length + 1;
        if (len === 1) {
            return cb();
        }
        if (len === 2) {
            return cb(args[0]);
        }
        if (len === 3) {
            return cb(args[0], args[1]);
        }
        if (len === 4) {
            return cb(args[0], args[1], args[2]);
        }
        cb.apply(null, args);
        // cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
}
exports.invokeCallback = invokeCallback;
/**
 * Get the count of elements of object
 */
function size(obj) {
    let count = 0;
    for (let i in obj) {
        if (obj.hasOwnProperty(i) && typeof obj[i] !== 'function') {
            count++;
        }
    }
    return count;
}
exports.size = size;
/**
 * Check a string whether ends with another string
 */
function endsWith(str, suffix) {
    if (typeof str !== 'string' || typeof suffix !== 'string' ||
        suffix.length > str.length) {
        return false;
    }
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
exports.endsWith = endsWith;
/**
 * Check a string whether starts with another string
 */
function startsWith(str, prefix) {
    if (typeof str !== 'string' || typeof prefix !== 'string' ||
        prefix.length > str.length) {
        return false;
    }
    return str.indexOf(prefix) === 0;
}
exports.startsWith = startsWith;
/**
 * Compare the two arrays and return the difference.
 */
function arrayDiff(array1, array2) {
    let o = {};
    for (let i = 0, len = array2.length; i < len; i++) {
        o[array2[i]] = true;
    }
    let result = [];
    for (let i = 0, len = array1.length; i < len; i++) {
        let v = array1[i];
        if (o[v])
            continue;
        result.push(v);
    }
    return result;
}
exports.arrayDiff = arrayDiff;
/*
 * Date format
 */
function format(date, format) {
    format = format || 'MMddhhmm';
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        'S': date.getMilliseconds() // millisecond
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] :
                ('00' + o[k]).substr(('' + o[k]).length));
        }
    }
    return format;
}
exports.format = format;
/**
 * check if has Chinese characters.
 */
function hasChineseChar(str) {
    if (/.*[\u4e00-\u9fa5]+.*$/.test(str)) {
        return true;
    }
    else {
        return false;
    }
}
exports.hasChineseChar = hasChineseChar;
/**
 * transform unicode to utf8
 */
function unicodeToUtf8(str) {
    let i, len, ch;
    let utf8Str = '';
    len = str.length;
    for (i = 0; i < len; i++) {
        ch = str.charCodeAt(i);
        if ((ch >= 0x0) && (ch <= 0x7F)) {
            utf8Str += str.charAt(i);
        }
        else if ((ch >= 0x80) && (ch <= 0x7FF)) {
            utf8Str += String.fromCharCode(0xc0 | ((ch >> 6) & 0x1F));
            utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));
        }
        else if ((ch >= 0x800) && (ch <= 0xFFFF)) {
            utf8Str += String.fromCharCode(0xe0 | ((ch >> 12) & 0xF));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));
        }
        else if ((ch >= 0x10000) && (ch <= 0x1FFFFF)) {
            utf8Str += String.fromCharCode(0xF0 | ((ch >> 18) & 0x7));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));
        }
        else if ((ch >= 0x200000) && (ch <= 0x3FFFFFF)) {
            utf8Str += String.fromCharCode(0xF8 | ((ch >> 24) & 0x3));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));
        }
        else if ((ch >= 0x4000000) && (ch <= 0x7FFFFFFF)) {
            utf8Str += String.fromCharCode(0xFC | ((ch >> 30) & 0x1));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 24) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
            utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));
        }
    }
    return utf8Str;
}
exports.unicodeToUtf8 = unicodeToUtf8;
/**
 * Ping server to check if network is available
 *
 */
function ping(host, cb) {
    if (!isLocal(host)) {
        let cmd = 'ping -w 15 ' + host;
        (0, child_process_1.exec)(cmd, function (err, stdout, stderr) {
            if (!!err) {
                cb(false);
                return;
            }
            cb(true);
        });
    }
    else {
        cb(true);
    }
}
exports.ping = ping;
/**
 * Check if server is exsit.
 *
 */
function checkPort(server, cb) {
    var _a, _b;
    if (!server.port && !server.clientPort) {
        invokeCallback(cb, 'leisure');
        return;
    }
    let port = (_b = (_a = server.port) !== null && _a !== void 0 ? _a : server.clientPort) !== null && _b !== void 0 ? _b : 0;
    let host = server.host;
    let generateCommand = function (host, port) {
        var _a;
        let cmd;
        let ssh_params = (_a = pinus_1.pinus.app) === null || _a === void 0 ? void 0 : _a.get(Constants.RESERVED.SSH_CONFIG_PARAMS);
        if (!!ssh_params && Array.isArray(ssh_params)) {
            ssh_params = ssh_params.join(' ');
        }
        else {
            ssh_params = '';
        }
        if (!isLocal(host)) {
            cmd = util.format('ssh %s %s "netstat -an|awk \'{print $4}\'|grep %s|wc -l"', host, ssh_params, port);
        }
        else {
            cmd = util.format('netstat -an|awk \'{print $4}\'|grep %s|wc -l', port);
        }
        return cmd;
    };
    let cmd1 = generateCommand(host, port);
    let child = (0, child_process_1.exec)(cmd1, function (err, stdout, stderr) {
        var _a;
        if (err) {
            logger.error('command %s execute with error: %j', cmd1, err.stack);
            invokeCallback(cb, 'error');
        }
        else if (stdout.trim() !== '0') {
            invokeCallback(cb, 'busy');
        }
        else {
            port = (_a = server.clientPort) !== null && _a !== void 0 ? _a : 0;
            let cmd2 = generateCommand(host, port);
            (0, child_process_1.exec)(cmd2, function (err, stdout, stderr) {
                if (err) {
                    logger.error('command %s execute with error: %j', cmd2, err.stack);
                    invokeCallback(cb, 'error');
                }
                else if (stdout.trim() !== '0') {
                    invokeCallback(cb, 'busy');
                }
                else {
                    invokeCallback(cb, 'leisure');
                }
            });
        }
    });
}
exports.checkPort = checkPort;
function isLocal(host) {
    let app = pinus_1.pinus.app;
    if (!app) {
        return host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0' || inLocal(host);
    }
    else {
        return host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0' || inLocal(host) || host === app.master.host;
    }
}
exports.isLocal = isLocal;
/**
 * Load cluster server.
 *
 */
function loadCluster(app, server, serverMap) {
    let increaseFields = {};
    let host = server.host;
    let count = Number(server[Constants.RESERVED.CLUSTER_COUNT]);
    let seq = app.clusterSeq[server.serverType];
    if (!seq) {
        seq = 0;
        app.clusterSeq[server.serverType] = count;
    }
    else {
        app.clusterSeq[server.serverType] = seq + count;
    }
    for (let key in server) {
        let value = server[key].toString();
        if (value.indexOf(Constants.RESERVED.CLUSTER_SIGNAL) > 0) {
            let base = server[key].slice(0, -2);
            increaseFields[key] = base;
        }
    }
    let clone = function (src) {
        let rs = {};
        for (let key in src) {
            rs[key] = src[key];
        }
        return rs;
    };
    for (let i = 0, l = seq; i < count; i++, l++) {
        let cserver = clone(server);
        cserver.id = Constants.RESERVED.CLUSTER_PREFIX + server.serverType + '-' + l;
        for (let k in increaseFields) {
            let v = parseInt(increaseFields[k]);
            cserver[k] = v + i;
        }
        serverMap[cserver.id] = cserver;
    }
}
exports.loadCluster = loadCluster;
// export function extends(origin, add)
// {
//    if (!add || !this.isObject(add)) return origin;
//    let keys = Object.keys(add);
//    let i = keys.length;
//    while (i--)
//    {
//        origin[keys[i]] = add[keys[i]];
//    }
//    return origin;
// };
function headHandler(headBuffer) {
    let len = 0;
    for (let i = 1; i < 4; i++) {
        if (i > 1) {
            len <<= 8;
        }
        len += headBuffer.readUInt8(i);
    }
    return len;
}
exports.headHandler = headHandler;
let inLocal = function (host) {
    for (let index in localIps) {
        if (host === localIps[index]) {
            return true;
        }
    }
    return false;
};
let localIps = function () {
    var _a;
    let ifaces = os.networkInterfaces();
    let ips = [];
    let func = function (details) {
        if (details.family === 'IPv4') {
            ips.push(details.address);
        }
    };
    if (ifaces !== undefined) {
        for (let dev in ifaces) {
            (_a = ifaces[dev]) === null || _a === void 0 ? void 0 : _a.forEach(func);
        }
    }
    return ips;
}();
function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;
function extendsObject(origin, add) {
    if (!add || !isObject(add))
        return origin;
    let keys = Object.keys(add);
    let i = keys.length;
    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
}
exports.extendsObject = extendsObject;
exports.promisify = util.promisify;
//# sourceMappingURL=utils.js.map