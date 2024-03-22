#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 */
const fs = require("fs");
const constants_1 = require("./utils/constants");
const utils_1 = require("./utils/utils");
const util_1 = require("util");
const program = require("commander");
program.version(utils_1.version);
program.command('*')
    .action(function () {
    console.log(constants_1.COMMAND_ERROR);
});
fs.readdirSync(__dirname + '/commands').forEach(function (filename) {
    if (/\.js$/.test(filename)) {
        let name = filename.substr(0, filename.lastIndexOf('.'));
        let _command = require('./commands/' + name).default;
        if ((0, util_1.isFunction)(_command)) {
            _command(program);
        }
    }
});
program.parse(process.argv);
//# sourceMappingURL=pinus.js.map