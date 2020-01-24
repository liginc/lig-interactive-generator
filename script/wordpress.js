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
}, {
    name: 'wordpress_ver',
    message: 'Type WordPress version (Empty will be "latest")',
    type: 'input',
}, {
    name: 'php_ver',
    message: 'Type PHP version (Empty will be "7.3.14")',
    type: 'input',
}, {
    name: 'mysql_ver',
    message: 'Type MySQL version (Empty will be "5.7.29")',
    type: 'input',
}]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(function () {
            download('https://github.com/liginc/lig-docker-wordpress.git', {
                removeGitignore: false,
                removeReadme: false,
                mergeEnvSample: true
            });
        })
        .then(function () {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', {
                mergeEnvSample: true
            });
        })
        .then(function () {
            download('https://github.com/liginc/lig-wordpress-template.git', {
                branchName: 'master',
                destDir: 'wp/wp-content/themes/lig',
                removeGitignore: false
            });
        })
        .then(function () {
            preparing.start();
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|!/wp/wp-content/themes/lig/|!/wp/wp-content/themes/" + answer.name + "/|g", path.join(rootDir, ".gitignore")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|'input-theme-name'|'" + answer.name + "'|g", path.join(rootDir, "webpack.mix.js")]);
            childProcess.spawnSync('mv', [path.join(rootDir, "wp/wp-content/themes/input-theme-name/inc"), path.join(rootDir, "wp/wp-content/themes/lig/")]);
            childProcess.spawnSync('rm', ["-Rf", path.join(rootDir, "wp/wp-content/themes/input-theme-name")]);
            fs.renameSync(path.join(rootDir, 'resources/themes/input-theme-name'), path.join(rootDir, 'resources/themes', answer.name));
            fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/lig'), path.join(rootDir, 'wp/wp-content/themes', answer.name));

            // Edit .env
            if (answer.php_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|PHP_VER=.*$|PHP_VER=" + answer.php_ver + "|g", path.join(rootDir, ".env")]);
            if (answer.mysql_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|MYSQL_VER=.*$|MYSQL_VER=" + answer.mysql_ver + "|g", path.join(rootDir, ".env")]);
            if (answer.wordpress_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_VERSION=.*$|WP_VERSION=" + WP_VER + "|g", path.join(rootDir, ".env")]);

            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_THEME_NAME=lig|WP_THEME_NAME=" + answer.name + "|g", path.join(rootDir, ".env")]);

            preparing.succeed();
        });
});
