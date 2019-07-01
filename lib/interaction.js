#!/usr/bin/env node
'use strict';
const inquirer = require('inquirer');
const path = require('path');
const spawn = require('cross-spawn');
const TYPES = [
    'static',
    'wordpress',
    'php'
];

module.exports = function (argv) {
    inquirer.prompt([{
        name: 'type',
        message: 'Choose Environment Type',
        type: 'list',
        choices: TYPES
    },]).then((answers) => {
        let scriptPath = path.join(__dirname, '../script', answers.type + '.js');
        spawn('node', [scriptPath], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'inherit'
        }).on('exit', (code) => {
            process.exit(code);
        });
    });
}