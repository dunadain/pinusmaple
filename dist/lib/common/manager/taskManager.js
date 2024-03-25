"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeQueue = exports.addTask = exports.timeout = void 0;
let sequeue = require('seq-queue');
let queues = {};
exports.timeout = 3000;
/**
 * Add tasks into task group. Create the task group if it dose not exist.
 *
 * @param {String}   key       task key
 * @param {Function} fn        task callback
 * @param {Function} ontimeout task timeout callback
 * @param {Number}   timeout   timeout for task
 */
function addTask(key, fn, ontimeout, timeoutMs) {
    let queue = queues[key];
    if (!queue) {
        queue = sequeue.createQueue(exports.timeout);
        queues[key] = queue;
    }
    return queue.push(fn, ontimeout, timeoutMs);
}
exports.addTask = addTask;
/**
 * Destroy task group
 *
 * @param  {String} key   task key
 * @param  {Boolean} force whether close task group directly
 */
function closeQueue(key, force) {
    if (!queues[key]) {
        // ignore illeagle key
        return;
    }
    queues[key].close(force);
    delete queues[key];
}
exports.closeQueue = closeQueue;
//# sourceMappingURL=taskManager.js.map