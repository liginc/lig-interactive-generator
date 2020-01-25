#!/usr/bin/env node
'use strict';
const path = require('path');
const spawn = require('cross-spawn');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

const notifier = updateNotifier({pkg,
    updateCheckInterval:1000 * 60 * 60 * 24 * 3
}).notify();

if (notifier.update) {
    console.log(`Please update "lig interactive generator"`);
    process.exit();
}

const localScript = path.join(__dirname, 'lib/lig.js');
let argv = process.argv;
let env = process.env;
let modulePath = [
    path.join(__dirname,'node_modules'),
    path.join(process.cwd(),'node_modules')
];
argv[1] = localScript;
env.NODE_PATH = modulePath.join(path.delimiter);
spawn(argv.shift(), argv, {
    cwd: process.cwd(),
    env: env,
    stdio: 'inherit'
}).on('exit', (code) => {
    process.exit(code);
});
