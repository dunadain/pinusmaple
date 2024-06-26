"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
// import { describe, it } from "mocha-typescript"
let pinus = require('../../lib/index');
let consoleModule = require('../../lib/modules/console').ConsoleModule;
describe('console module test', function () {
    describe('#monitorHandler', function () {
        it('should execute the corresponding command with different signals', function () {
            let flag = false;
            let rs;
            let opts = {
                app: {
                    components: {
                        __connector__: {
                            blacklist: []
                        }
                    },
                    stop: function (value) {
                        flag = value;
                    },
                    addCrons: function (array) {
                        rs = array;
                    },
                    removeCrons: function (array) {
                        rs = array;
                    },
                    isFrontend: function () {
                        return true;
                    }
                }
            };
            let module = new consoleModule(opts);
            let agent1 = {
                type: 'area'
            };
            let msg1 = { signal: 'stop' };
            module.monitorHandler(agent1, msg1);
            flag.should.eql(true);
            let msg2 = { signal: 'list' };
            let agent2 = {
                type: 'chat',
                id: 'chat-server-1'
            };
            module.monitorHandler(agent2, msg2, function (obj) {
                obj.serverId.should.eql('chat-server-1');
                obj.body.serverType.should.eql('chat');
            });
            let msg3 = { signal: 'addCron' };
            module.monitorHandler(agent2, msg3, null);
            if (rs)
                rs.length.should.eql(1);
            let msg4 = { signal: 'removeCron' };
            module.monitorHandler(agent2, msg4, null);
            if (rs)
                rs.length.should.eql(1);
            let msg5 = { signal: 'blacklist', blacklist: ['127.0.0.1'] };
            module.monitorHandler(agent1, msg5, null);
            opts.app.components.__connector__.blacklist.length.should.eql(1);
        });
    });
    describe('#clientHandler', function () {
        let _exit;
        let _setTimeout;
        let __setTimeout;
        let exitCount = 0;
        before(function (done) {
            _exit = process.exit;
            _setTimeout = __setTimeout;
            done();
        });
        after(function (done) {
            process.exit = _exit;
            __setTimeout = _setTimeout;
            done();
        });
        let opts = {
            app: {
                clusterSeq: {},
                stop: function (value) {
                    return value;
                },
                getServerById: function () {
                    return {
                        host: '127.0.0.1'
                    };
                },
                getServers: function () {
                    return {
                        'chat-server-1': {}
                    };
                },
                get: function (value) {
                    switch (value) {
                        case 'main':
                            return __dirname + '/../../index.js';
                        case 'env':
                            return 'dev';
                    }
                },
                set: function (value) {
                    return value;
                },
                getServersByType: function () {
                    return [{ id: 'chat-server-1' }];
                }
            }
        };
        let module = new consoleModule(opts);
        it('should execute kill command', function (done) {
            if (done) {
                done();
                return;
            }
            let msg = { signal: 'kill' };
            process.exit = function () {
                exitCount++;
            };
            let orgtimeout = setTimeout;
            global['setTimeout'] = function (cb, timeout) {
                if (timeout > 50) {
                    timeout = 50;
                }
                orgtimeout(cb, timeout);
            };
            let agent1 = {
                request: function (recordId, moduleId, msg, cb) {
                    cb('chat-server-1');
                },
                idMap: {
                    'chat-server-1': {
                        type: 'chat',
                        id: 'chat-server-1'
                    }
                }
            };
            module.clientHandler(agent1, msg, function (err, result) {
                console.log('!! error chat 1');
                should.not.exist(err);
                should.exist(result.code);
            });
            let agent2 = {
                request: function (recordId, moduleId, msg, cb) {
                    cb();
                },
                idMap: {
                    'chat-server-1': {
                        type: 'chat',
                        id: 'chat-server-1'
                    }
                }
            };
            module.clientHandler(agent2, msg, function (err, result) {
                console.log('!! null chat 1');
                should.not.exist(err);
                should.exist(result.code);
                result.code.should.eql('remained');
                global['setTimeout'] = orgtimeout;
                done();
            });
        });
        it('should execute stop command', function (done) {
            this.timeout(5555);
            let msg1 = { signal: 'stop', ids: ['chat-server-1'] };
            let msg2 = { signal: 'stop', ids: [] };
            let agent = {
                notifyById: function (serverId, moduleId, msg) {
                },
                notifyAll: function (moduleId, msg) {
                }
            };
            module.clientHandler(agent, msg1, function (err, result) {
                result.status.should.eql('part');
            });
            module.clientHandler(agent, msg2, function (err, result) {
                result.status.should.eql('all');
                done();
            });
        });
        it('should execute list command', function () {
            let msg = { signal: 'list' };
            let agent = {
                request: function (recordId, moduleId, msg, cb) {
                    cb({ serverId: 'chat-server-1', body: { 'server': {} } });
                },
                idMap: {
                    'chat-server-1': {
                        type: 'chat',
                        id: 'chat-server-1'
                    }
                }
            };
            module.clientHandler(agent, msg, function (err, result) {
                should.exist(result.msg);
            });
        });
        it('should execute add command', function () {
            let msg1 = { signal: 'add', args: ['host=127.0.0.1', 'port=88888', 'clusterCount=2'] };
            let msg2 = { signal: 'add', args: ['host=127.0.0.1', 'port=88888', 'id=chat-server-1', 'serverType=chat'] };
            let agent = {};
            module.clientHandler(agent, msg1, function (err, result) {
                should.not.exist(err);
                result.length.should.eql(0);
            });
            module.clientHandler(agent, msg2, function (err, result) {
                //  should.not.exist(err);
                //  result.status.should.eql('ok');
                // TODO: unknown error:
                console.log('should execute add command', err, result);
            });
        });
        it('should execute blacklist command', function () {
            let msg1 = { signal: 'blacklist', args: ['127.0.0.1'] };
            let msg2 = { signal: 'blacklist', args: ['abc'] };
            let agent = {
                notifyAll: function (moduleId, msg) {
                }
            };
            module.clientHandler(agent, msg1, function (err, result) {
                result.status.should.eql('ok');
            });
            module.clientHandler(agent, msg2, function (err, result) {
                should.exist(err);
            });
        });
        it('should execute restart command', function () {
            this.timeout(8555);
            let msg1 = { signal: 'restart', ids: ['chat-server-1'] };
            let msg2 = { signal: 'restart', type: 'chat', ids: [] };
            let agent = {
                request: function (recordId, moduleId, msg, cb) {
                    cb();
                }
            };
            module.clientHandler(agent, msg1, function (err, result) {
                should.exist(err);
            });
            module.clientHandler(agent, msg2, function (err, result) {
                should.exist(err);
            });
        });
    });
});
//# sourceMappingURL=console.js.map