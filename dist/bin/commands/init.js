"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyDirectory = void 0;
const constants_1 = require("../utils/constants");
const utils_1 = require("../utils/utils");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
function default_1(program) {
    program.command('init [path]')
        .description('create a new application')
        .action(function (path) {
        init(path || constants_1.CUR_DIR);
    });
}
exports.default = default_1;
/**
 * Get user's choice on connector selecting
 *
 * @param {Function} cb
 */
function connectorType(cb) {
    (0, utils_1.prompt)('Please select underly connector, 1 for websocket(native socket), 2 for socket.io, 3 for wss, 4 for socket.io(wss), 5 for udp, 6 for mqtt: [1]', function (msg) {
        console.log('selected', msg);
        switch (msg.trim()) {
            case '':
                cb(1);
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                cb(msg.trim());
                break;
            default:
                console.log('Invalid choice! Please input 1 - 5.'.red + '\n');
                connectorType(cb);
                break;
        }
    });
}
/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
function emptyDirectory(path) {
    if (!fs.existsSync(path))
        return true;
    let files = fs.readdirSync(path);
    return (!files || !files.length);
}
exports.emptyDirectory = emptyDirectory;
/**
 * Init application at the given directory `path`.
 *
 * @param {String} path
 */
function init(path) {
    console.log(constants_1.INIT_PROJ_NOTICE);
    connectorType(function (type) {
        let empty = emptyDirectory(path);
        if (empty) {
            process.stdin.destroy();
            console.log('start createApplication');
            createApplicationAt(path, type);
        }
        else {
            (0, utils_1.confirm)('Destination is not empty, continue? (y/n) [no] ', function (force) {
                process.stdin.destroy();
                if (force) {
                    createApplicationAt(path, type);
                }
                else {
                    (0, utils_1.abort)('Fail to init a project'.red);
                }
            });
        }
    });
}
/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir(path) {
    let err = mkdirp.sync(path, 0o755);
    console.log('   create : '.green + path);
}
/**
 * Copy template files to project.
 *
 * @param {String} origin
 * @param {String} target
 */
function copy(origin, target) {
    if (!fs.existsSync(origin)) {
        (0, utils_1.abort)(origin + 'does not exist.');
    }
    if (!fs.existsSync(target)) {
        mkdir(target);
        console.log('   create : '.green + target);
    }
    let datalist = fs.readdirSync(origin);
    for (let i = 0; i < datalist.length; i++) {
        let oCurrent = path.resolve(origin, datalist[i]);
        let tCurrent = path.resolve(target, datalist[i]);
        if (fs.statSync(oCurrent).isFile()) {
            console.log('   create : '.green + tCurrent + ' from : ' + oCurrent);
            fs.writeFileSync(tCurrent, fs.readFileSync(oCurrent));
        }
        else if (fs.statSync(oCurrent).isDirectory()) {
            copy(oCurrent, tCurrent);
        }
    }
}
/**
 * Create directory and files at the given directory `path`.
 *
 * @param {String} ph
 */
function createApplicationAt(ph, type) {
    let name = path.basename(path.resolve(constants_1.CUR_DIR, ph));
    copy(path.join(__dirname, '../../../template/'), ph);
    mkdir(path.join(ph, 'game-server/dist/logs'));
    mkdir(path.join(ph, 'shared'));
    // rmdir -r
    let rmdir = function (dir) {
        let list = fs.readdirSync(dir);
        for (let i = 0; i < list.length; i++) {
            let filename = path.join(dir, list[i]);
            let stat = fs.statSync(filename);
            if (filename === '.' || filename === '..') {
            }
            else if (stat.isDirectory()) {
                rmdir(filename);
            }
            else {
                fs.unlinkSync(filename);
            }
        }
        fs.rmdirSync(dir);
    };
    let unlinkFiles;
    switch (type) {
        case '1':
            // use websocket
            unlinkFiles = ['game-server/app.ts.sio',
                'game-server/app.ts.wss',
                'game-server/app.ts.mqtt',
                'game-server/app.ts.sio.wss',
                'game-server/app.ts.udp',
                'web-server/app.js.https',
                'web-server/public/index.html.sio',
                'web-server/public/js/lib/pinusclient.js',
                'web-server/public/js/lib/pinusclient.js.wss',
                'web-server/public/js/lib/build/build.js.wss',
                'web-server/public/js/lib/socket.io.js'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                let f = path.resolve(ph, unlinkFiles[i]);
                console.log('delete : ' + f);
                fs.unlinkSync(f);
            }
            break;
        case '2':
            // use socket.io
            unlinkFiles = ['game-server/app.ts',
                'game-server/app.ts.wss',
                'game-server/app.ts.udp',
                'game-server/app.ts.mqtt',
                'game-server/app.ts.sio.wss',
                'web-server/app.js.https',
                'web-server/public/index.html',
                'web-server/public/js/lib/component.json',
                'web-server/public/js/lib/pinusclient.js.wss'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
            }
            fs.renameSync(path.resolve(ph, 'game-server/app.ts.sio'), path.resolve(ph, 'game-server/app.ts'));
            fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
            break;
        case '3':
            // use websocket wss
            unlinkFiles = ['game-server/app.ts.sio',
                'game-server/app.ts',
                'game-server/app.ts.udp',
                'game-server/app.ts.sio.wss',
                'game-server/app.ts.mqtt',
                'web-server/app.js',
                'web-server/public/index.html.sio',
                'web-server/public/js/lib/pinusclient.js',
                'web-server/public/js/lib/pinusclient.js.wss',
                'web-server/public/js/lib/build/build.js',
                'web-server/public/js/lib/socket.io.js'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
            }
            fs.renameSync(path.resolve(ph, 'game-server/app.ts.wss'), path.resolve(ph, 'game-server/app.ts'));
            fs.renameSync(path.resolve(ph, 'web-server/app.js.https'), path.resolve(ph, 'web-server/app.js'));
            fs.renameSync(path.resolve(ph, 'web-server/public/js/lib/build/build.js.wss'), path.resolve(ph, 'web-server/public/js/lib/build/build.js'));
            break;
        case '4':
            // use socket.io wss
            unlinkFiles = ['game-server/app.ts.sio',
                'game-server/app.ts',
                'game-server/app.ts.udp',
                'game-server/app.ts.wss',
                'game-server/app.ts.mqtt',
                'web-server/app.js',
                'web-server/public/index.html',
                'web-server/public/js/lib/pinusclient.js'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
            }
            fs.renameSync(path.resolve(ph, 'game-server/app.ts.sio.wss'), path.resolve(ph, 'game-server/app.ts'));
            fs.renameSync(path.resolve(ph, 'web-server/app.js.https'), path.resolve(ph, 'web-server/app.js'));
            fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));
            fs.renameSync(path.resolve(ph, 'web-server/public/js/lib/pinusclient.js.wss'), path.resolve(ph, 'web-server/public/js/lib/pinusclient.js'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
            fs.unlinkSync(path.resolve(ph, 'web-server/public/js/lib/component.json'));
            break;
        case '5':
            // use socket.io wss
            unlinkFiles = ['game-server/app.ts.sio',
                'game-server/app.ts',
                'game-server/app.ts.wss',
                'game-server/app.ts.mqtt',
                'game-server/app.ts.sio.wss',
                'web-server/app.js.https',
                'web-server/public/index.html',
                'web-server/public/js/lib/component.json',
                'web-server/public/js/lib/pinusclient.js.wss'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
            }
            fs.renameSync(path.resolve(ph, 'game-server/app.ts.udp'), path.resolve(ph, 'game-server/app.ts'));
            fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
            break;
        case '6':
            // use socket.io
            unlinkFiles = ['game-server/app.ts',
                'game-server/app.ts.wss',
                'game-server/app.ts.udp',
                'game-server/app.ts.sio',
                'game-server/app.ts.sio.wss',
                'web-server/app.js.https',
                'web-server/public/index.html',
                'web-server/public/js/lib/component.json',
                'web-server/public/js/lib/pinusclient.js.wss'];
            for (let i = 0; i < unlinkFiles.length; ++i) {
                fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
            }
            fs.renameSync(path.resolve(ph, 'game-server/app.ts.mqtt'), path.resolve(ph, 'game-server/app.ts'));
            fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
            rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
            break;
    }
    let replaceFiles = ['game-server/app.ts',
        'game-server/package.json',
        'web-server/package.json'];
    for (let j = 0; j < replaceFiles.length; j++) {
        let str = fs.readFileSync(path.resolve(ph, replaceFiles[j])).toString();
        fs.writeFileSync(path.resolve(ph, replaceFiles[j]), str.replace('$', name));
    }
    let f = path.resolve(ph, 'game-server/package.json');
    let content = fs.readFileSync(f).toString();
    fs.writeFileSync(f, content.replace('#', utils_1.version));
}
//# sourceMappingURL=init.js.map