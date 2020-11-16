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

const projectName = process.argv[2];
const rootDir = path.join(process.cwd(), projectName);
const env = path.join(rootDir, ".env");

inquirer.prompt([{
    name: 'wordpress_ver',
    message: 'Type WordPress version (Empty will be "latest")',
    type: 'input',
}, {
    name: 'wordpress_type',
    message: 'Choose WP including file type',
    type: 'list',
    choices: ['with theme sample', 'only functions']
}, {
    name: 'php_ver',
    message: 'Type PHP version (Empty will be "7.3")',
    type: 'input',
}, {
    name: 'mysql_ver',
    message: 'Type MySQL version (Empty will be "5.7")',
    type: 'input',
}]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(function () {
            download('https://github.com/liginc/lig-docker-wordpress.git', {
                mergeEnvSample: true
            });
        })
        .then(function () {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', {
                mergeEnvSample: true
            })
        })
        .then(() => {
            if (answer.wordpress_type == 'only functions') {
                fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/input-theme-name'), path.join(rootDir, 'wp/wp-content/themes', projectName));
                fs.renameSync(path.join(rootDir, 'resources/themes/input-theme-name'), path.join(rootDir, 'resources/themes', projectName));
                download('https://github.com/liginc/lig-wordpress-functions.git', {
                    destDir: 'wp/wp-content/themes/' + projectName,
                });
            } else {
                fs.removeSync(path.join(rootDir, "resources"))
                fs.removeSync(path.join(rootDir, "wp/wp-content/themes/input-theme-name"))
                fs.removeSync(path.join(rootDir, "sql"))
                fs.removeSync(path.join(rootDir, "package.json"))
                fs.removeSync(path.join(rootDir, "package-lock.json"))
                download('https://github.com/liginc/lig-wordpress-template.git').then(() => {
                    fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/lig-wordpress-template'), path.join(rootDir, 'wp/wp-content/themes', projectName));
                    fs.renameSync(path.join(rootDir, 'resources/themes/lig-wordpress-template'), path.join(rootDir, 'resources/themes', projectName));
                });
            }
        })
        .then(function () {
            preparing.start();

            // Replace text on .env
            if (answer.php_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|PHP_VER=.*$|PHP_VER=" + answer.php_ver + "|g", env]);
            if (answer.mysql_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|MYSQL_VER=.*$|MYSQL_VER=" + answer.mysql_ver + "|g", env]);
            if (answer.wordpress_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_VERSION=.*$|WP_VERSION=" + WP_VER + "|g", env]);

            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_THEME_NAME=.*$|WP_THEME_NAME=" + projectName + "|g", env]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|input-theme-name|" + projectName + "|g", env]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|wordpress.test|localhost|g", env]);

            preparing.succeed();
        })
});
