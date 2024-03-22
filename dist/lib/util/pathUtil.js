"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginCronPath = exports.getPluginHandlerPath = exports.getPluginRemotePath = exports.getLogPath = exports.getScriptPath = exports.getHandlerPath = exports.remotePathRecord = exports.listUserRemoteDir = exports.getCronPath = exports.getUserRemotePath = exports.getSysRemotePath = exports.getRelativePath = void 0;
const fs = require("fs");
const path = require("path");
const Constants = require("./constants");
const constants_1 = require("./constants");
/**
 * Get relative path
 *
 * @param  {String} path full path
 * @return {String} relative path
 */
function getRelativePath(path) {
    return path.replace(process.cwd(), '');
}
exports.getRelativePath = getRelativePath;
/**
 * Get system remote service path
 *
 * @param  {String} role server role: frontend, backend
 * @return {String}      path string if the path exist else null
 */
function getSysRemotePath(role) {
    let p = path.join(__dirname, '/../common/remote/', role);
    return fs.existsSync(p) ? p : null;
}
exports.getSysRemotePath = getSysRemotePath;
/**
 * Get user remote service path
 *
 * @param  {String} appBase    application base path
 * @param  {String} serverType server type
 * @return {String}            path string if the path exist else null
 */
function getUserRemotePath(appBase, serverType) {
    let p = path.join(appBase, '/app/servers/', serverType, Constants.DIR.REMOTE);
    return fs.existsSync(p) ? p : null;
}
exports.getUserRemotePath = getUserRemotePath;
/**
 * Get user remote cron path
 *
 * @param  {String} appBase    application base path
 * @param  {String} serverType server type
 * @return {String}            path string if the path exist else null
 */
function getCronPath(appBase, serverType) {
    let p = path.join(appBase, '/app/servers/', serverType, Constants.DIR.CRON);
    return fs.existsSync(p) ? p : null;
}
exports.getCronPath = getCronPath;
/**
 * List all the subdirectory names of user remote directory
 * which hold the codes for all the server types.
 *
 * @param  {String} appBase application base path
 * @return {Array}         all the subdiretory name under servers/
 */
function listUserRemoteDir(appBase) {
    let base = path.join(appBase, '/app/servers/');
    let files = fs.readdirSync(base);
    return files.filter(function (fn) {
        if (fn.charAt(0) === '.') {
            return false;
        }
        return fs.statSync(path.join(base, fn)).isDirectory();
    });
}
exports.listUserRemoteDir = listUserRemoteDir;
/**
 * Compose remote path record
 *
 * @param  {String} namespace  remote path namespace, such as: 'sys', 'user'
 * @param  {String} serverType
 * @param  {String} path       remote service source path
 * @param  {Boolean} relativePath       convert path to relative path
 * @return {Object}            remote path record
 */
function remotePathRecord(namespace, serverType, path, relativePath) {
    if (relativePath) {
        path = getRelativePath(path);
    }
    return { namespace: namespace, serverType: serverType, path: path };
}
exports.remotePathRecord = remotePathRecord;
/**
 * Get handler path
 *
 * @param  {String} appBase    application base path
 * @param  {String} serverType server type
 * @return {String}            path string if the path exist else null
 */
function getHandlerPath(appBase, serverType) {
    let p = path.join(appBase, '/app/servers/', serverType, Constants.DIR.HANDLER);
    return fs.existsSync(p) ? p : null;
}
exports.getHandlerPath = getHandlerPath;
/**
 * Get admin script root path.
 *
 * @param  {String} appBase application base path
 * @return {String}         script path string
 */
function getScriptPath(appBase) {
    return path.join(appBase, Constants.DIR.SCRIPT);
}
exports.getScriptPath = getScriptPath;
/**
 * Get logs path.
 *
 * @param  {String} appBase application base path
 * @return {String}         logs path string
 */
function getLogPath(appBase) {
    return path.join(appBase, Constants.DIR.LOG);
}
exports.getLogPath = getLogPath;
function getPluginRemotePath(basePath) {
    let p = path.join(basePath, constants_1.DIR.REMOTE);
    return fs.existsSync(p) ? p : null;
}
exports.getPluginRemotePath = getPluginRemotePath;
function getPluginHandlerPath(basePath) {
    let p = path.join(basePath, constants_1.DIR.HANDLER);
    return fs.existsSync(p) ? p : null;
}
exports.getPluginHandlerPath = getPluginHandlerPath;
function getPluginCronPath(basePath) {
    let p = path.join(basePath, constants_1.DIR.CRON);
    return fs.existsSync(p) ? p : null;
}
exports.getPluginCronPath = getPluginCronPath;
//# sourceMappingURL=pathUtil.js.map