#!/usr/bin/env node
'use strict';
const promise = require('promise');
const childProcess = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');

const download = require('../util/download');
const preparing = ora(`[preparing]`);
const rootDir = (process.argv[2] === 'true') ? path.join(process.cwd(), 'lig-interactive-generator') : path.join(process.cwd());

inquirer.prompt([{
    name: 'name',
    message: 'Type theme name',
    type: 'input',
},]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(function () {
            download('https://github.com/liginc/lig-docker-wordpress.git', 'master', false, false, false, true);
        })
        .then(function () {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', 'feature/optimize-directory-for-docker', false, true, true, true);
        })
        .then(function () {
            download('https://github.com/liginc/lig-wordpress-template.git', 'master', 'wp/wp-content/themes/lig', false);
        })
        .then(function () {
            preparing.start();
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_THEME_NAME=lig|WP_THEME_NAME=" + answer.name + "|g", path.join(rootDir, ".env")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|!/wp/wp-content/themes/lig/|!/wp/wp-content/themes/" + answer.name + "/|g", path.join(rootDir, ".gitignore")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|'input-theme-name'|'" + answer.name + "'|g", path.join(rootDir, "webpack.mix.js")]);
            childProcess.spawnSync('mv', [path.join(rootDir, "wp/wp-content/themes/input-theme-name/inc"), path.join(rootDir, "wp/wp-content/themes/lig/")]);
            childProcess.spawnSync('rm', ["-Rf", path.join(rootDir, "wp/wp-content/themes/input-theme-name")]);
            fs.renameSync(path.join(rootDir, 'resources/themes/input-theme-name'), path.join(rootDir, 'resources/themes', answer.name));
            fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/lig'), path.join(rootDir, 'wp/wp-content/themes', answer.name));
            preparing.succeed();
        });
});
