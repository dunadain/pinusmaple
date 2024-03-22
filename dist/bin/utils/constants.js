"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAEMON_INFO = exports.COMMAND_ERROR = exports.MASTER_HA_NOT_FOUND = exports.SCRIPT_NOT_FOUND = exports.INIT_PROJ_NOTICE = exports.RESTART_SERVER_INFO = exports.ADD_SERVER_INFO = exports.CLOSEAPP_INFO = exports.FILEREAD_ERROR = exports.CONNECT_ERROR = exports.DEFAULT_MASTER_PORT = exports.DEFAULT_MASTER_HOST = exports.DEFAULT_ENV = exports.DEFAULT_PWD = exports.DEFAULT_USERNAME = exports.DEFAULT_GAME_SERVER_DIR = exports.CUR_DIR = exports.KILL_CMD_WIN = exports.KILL_CMD_LUX = exports.TIME_KILL_WAIT = exports.TIME_INIT = void 0;
/**
 *  Constant Variables
 */
exports.TIME_INIT = 5 * 1000;
exports.TIME_KILL_WAIT = 5 * 1000;
exports.KILL_CMD_LUX = 'kill -9 `ps -ef|grep node|awk \'{print $2}\'`';
exports.KILL_CMD_WIN = 'taskkill /im node.exe /f';
exports.CUR_DIR = process.cwd();
exports.DEFAULT_GAME_SERVER_DIR = exports.CUR_DIR;
exports.DEFAULT_USERNAME = 'admin';
exports.DEFAULT_PWD = 'admin';
exports.DEFAULT_ENV = 'development';
exports.DEFAULT_MASTER_HOST = '127.0.0.1';
exports.DEFAULT_MASTER_PORT = 3005;
exports.CONNECT_ERROR = 'Fail to connect to admin console server.';
exports.FILEREAD_ERROR = 'Fail to read the file, please check if the application is started legally.';
exports.CLOSEAPP_INFO = 'Closing the application......\nPlease wait......';
exports.ADD_SERVER_INFO = 'Successfully add server.';
exports.RESTART_SERVER_INFO = 'Successfully restart server.';
exports.INIT_PROJ_NOTICE = ('\nThe default admin user is: \n\n' + '  username').green + ': admin\n  ' + 'password'.green + ': admin\n\nYou can configure admin users by editing adminUser.json later.\n ';
exports.SCRIPT_NOT_FOUND = 'Fail to find an appropriate script to run,\nplease check the current work directory or the directory specified by option `--directory`.\n'.red;
exports.MASTER_HA_NOT_FOUND = 'Fail to find an appropriate masterha config file, \nplease check the current work directory or the arguments passed to.\n'.red;
exports.COMMAND_ERROR = 'Illegal command format. Use `pinus --help` to get more info.\n'.red;
exports.DAEMON_INFO = 'The application is running in the background now.\n';
//# sourceMappingURL=constants.js.map