#!/usr/bin/env node
'use strict';
const inquirer = require('inquirer');
const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');

const TYPES = [
    'static',
    'wordpress',
    'php'
];

const DIRS = [
    'current directory',
    'create new directory'
];

let type = {
    name: 'type',
    message: 'Choose Environment Type',
    type: 'list',
    choices: TYPES
};

let mkdir = {
    name: 'mkdir',
    message: 'Choose Expand Directory',
    type: 'list',
    choices: DIRS
};

module.exports = function (argv) {
    inquirer.prompt([type, mkdir]).then((answers) => {
        if (answers.mkdir === 'create new directory') {
            fs.mkdirSync('lig-interactive-generator');
        }
        let createRootDir = (answers.mkdir === 'create new directory') ? true : false;
        let scriptPath = path.join(__dirname, '../script', answers.type + '.js');
        spawn('node', [scriptPath, createRootDir], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'inherit'
        }).on('exit', (code) => {
            process.exit(code);
        });
    });
}