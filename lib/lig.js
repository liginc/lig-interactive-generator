#!/usr/bin/env node
'use strict';
const path = require('path');
const yargs = require("yargs");

const argv = yargs.usage('lig <command> [options]')
    .version()
    .help('help')
    .alias('help', 'h')
    .alias('version', 'v')
    .argv;

if (argv._.length === 0) {
    require('./interaction')(argv);
}