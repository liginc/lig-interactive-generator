#!/usr/bin/env node
'use strict';
const inquirer = require('inquirer');
const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');

const TYPES = [
    'wordpress',
    'static-html',
    'php'
];

const questionType = {
    name: 'type',
    message: 'Choose Environment Type',
    type: 'list',
    choices: TYPES
};

const questionName = {
    name: 'name',
    message: 'Type Project( You can use only a-z0-9 and "-")',
    type: 'input',
};

module.exports = function (argv) {
    inquirer.prompt([questionType, questionName]).then((answers) => {
        const projectName = (answers.name !== '') ? answers.name : 'new-project';
        try {
            fs.mkdirSync(projectName);
        } catch (e) {
            console.log("couldn't create '" + projectName + "'");
            console.log(e);
            process.exit();
        }
        const scriptPath = path.join(__dirname, '../script', answers.type + '.js');
        spawn('node', [scriptPath, projectName], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'inherit'
        }).on('exit', (code) => {
            process.exit(code);
        });
    });
};