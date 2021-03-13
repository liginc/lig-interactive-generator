#!/usr/bin/env node
'use strict';
const inquirer = require('inquirer');
const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const stable = require('node-latest-stable-version')
const setHusky = require('../util/husky');
const childProcess = require('child_process')

const TYPES = [
    'wordpress',
    'static-html',
];

const questionType = {
    name: 'type',
    message: 'Choose Environment Type',
    type: 'list',
    choices: TYPES
};

const questionHusky = {
    name: 'husky',
    message: 'Use husky?',
    type: 'list',
    choices: [
        'yes',
        'no'
    ]
};

const questionNodeVersion = {
    name: 'node',
    message: 'Type Node Version(Empty will be latest stable version)',
    type: 'input',
};

const questionName = {
    name: 'name',
    message: 'Type Project( You can use only a-z0-9 and "-")',
    type: 'input',
};

module.exports = function (argv) {
    process.stdout.write('Current local node version is ' + process.version + "\n")
    inquirer.prompt([questionType, questionName, questionNodeVersion, questionHusky]).then((answers) => {
        const projectName = (answers.name !== '') ? answers.name : 'new-project';
        const projectDir = path.join(process.cwd(), projectName);
        let projectNode = (answers.node !== '') ? answers.node : 'stable';

        //Create Project Directory
        try {
            fs.mkdirSync(projectName);
        } catch (e) {
            console.log("couldn't create '" + projectName + "'");
            console.log(e);
            process.exit();
        }

        //Rename default .gitignore
        fs.copySync(path.join(__dirname, '../default-assets', answers.type, '_gitignore'), path.join(projectDir, '.gitignore'));

        const scriptPath = path.join(__dirname, '../script', answers.type + '.js');

        if (projectNode != "stable") {
            CreateEnvironment(scriptPath, projectName, projectNode.replace('/^v/', ''), answers.husky)
        } else {
            stable.then((version) => {
                process.stdout.write('Node version will set to ' + version + "\n")
                CreateEnvironment(scriptPath, projectName, version, answers.husky)
            })
        }
    });
};

function CreateEnvironment(scriptPath, projectName, projectNode,husky) {
    // childProcess.s
    spawn('node', [scriptPath, projectName, projectNode,husky], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit'
    }).on('exit', (code) => {
        if (husky === "yes") {
            setHusky(path.join(process.cwd(), projectName), path.join(scriptPath,'../../'))
        }
        process.exit(code);
    });
}