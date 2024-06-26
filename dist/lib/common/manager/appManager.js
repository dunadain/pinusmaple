"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = void 0;
const async = require("async");
const utils = require("../../util/utils");
const pinus_logger_1 = require("pinus-logger");
let logger = (0, pinus_logger_1.getLogger)('pinus', __filename);
let transactionLogger = (0, pinus_logger_1.getLogger)('transaction-log', __filename);
let transactionErrorLogger = (0, pinus_logger_1.getLogger)('transaction-error-log', __filename);
function transaction(name, conditions, handlers, retry) {
    if (!retry) {
        retry = 1;
    }
    if (typeof name !== 'string') {
        logger.error('transaction name is error format, name: %s.', name);
        return;
    }
    if (typeof conditions !== 'object' || typeof handlers !== 'object') {
        logger.error('transaction conditions parameter is error format, conditions: %j, handlers: %j.', conditions, handlers);
        return;
    }
    let cmethods = [];
    let dmethods = [];
    let cnames = [];
    let dnames = [];
    for (let key in conditions) {
        if (typeof key !== 'string' || typeof conditions[key] !== 'function') {
            logger.error('transaction conditions parameter is error format, condition name: %s, condition function: %j.', key, conditions[key]);
            return;
        }
        cnames.push(key);
        cmethods.push(conditions[key]);
    }
    let i = 0;
    // execute conditions
    async.forEachSeries(cmethods, function (method, cb) {
        method(cb);
        transactionLogger.info('[%s]:[%s] condition is executed.', name, cnames[i]);
        i++;
    }, function (err) {
        if (err) {
            process.nextTick(function () {
                transactionLogger.error('[%s]:[%s] condition is executed with err: %j.', name, cnames[--i], err.stack);
                let log = {
                    name: name,
                    method: cnames[i],
                    time: Date.now(),
                    type: 'condition',
                    description: err.stack
                };
                transactionErrorLogger.error(JSON.stringify(log));
            });
            return;
        }
        else {
            // execute handlers
            process.nextTick(function () {
                for (let key in handlers) {
                    if (typeof key !== 'string' || typeof handlers[key] !== 'function') {
                        logger.error('transcation handlers parameter is error format, handler name: %s, handler function: %j.', key, handlers[key]);
                        return;
                    }
                    dnames.push(key);
                    dmethods.push(handlers[key]);
                }
                let flag = true;
                let times = retry;
                // do retry if failed util retry times
                async.whilst(function () {
                    return retry > 0 && flag;
                }, function (callback) {
                    let j = 0;
                    retry--;
                    async.forEachSeries(dmethods, function (method, cb) {
                        method(cb);
                        transactionLogger.info('[%s]:[%s] handler is executed.', name, dnames[j]);
                        j++;
                    }, function (err) {
                        if (err) {
                            process.nextTick(function () {
                                transactionLogger.error('[%s]:[%s]:[%s] handler is executed with err: %j.', name, dnames[--j], times - retry, err.stack);
                                let log = {
                                    name: name,
                                    method: dnames[j],
                                    retry: times - retry,
                                    time: Date.now(),
                                    type: 'handler',
                                    description: err.stack
                                };
                                transactionErrorLogger.error(JSON.stringify(log));
                                utils.invokeCallback(callback);
                            });
                            return;
                        }
                        flag = false;
                        utils.invokeCallback(callback);
                        process.nextTick(function () {
                            transactionLogger.info('[%s] all conditions and handlers are executed successfully.', name);
                        });
                    });
                }, function (err) {
                    if (err) {
                        logger.error('transaction process is executed with error: %j', err);
                    }
                    // callback will not pass error
                });
            });
        }
    });
}
exports.transaction = transaction;
//# sourceMappingURL=appManager.js.map