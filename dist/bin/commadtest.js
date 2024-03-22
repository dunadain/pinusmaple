"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const stop_1 = require("./commands/stop");
program.version("1.2.3");
(0, stop_1.default)(program);
process.argv.push("stop", "-P", "3006", "server1", "server2");
program.parse(process.argv);
//# sourceMappingURL=commadtest.js.map