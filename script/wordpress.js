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

const scriptPath = process.argv[1];
const projectName = process.argv[2];
const rootDir = path.join(process.cwd(), projectName);
const pkgPath = path.join(rootDir, 'package.json')
const nodeVersion = process.argv[3];
const env = path.join(rootDir, ".env-sample");
const webpackMixJs = path.join(rootDir, "webpack.mix.js");

inquirer.prompt([{
    name: 'wordpress_ver',
    message: 'Type WordPress version (Empty will be "latest")',
    type: 'input',
}, {
    name: 'wordpress_type',
    message: 'Choose WP including file type',
    type: 'list',
    choices: ['with theme', 'only functions']
}, {
    name: 'php_ver',
    message: 'Type PHP version (Empty will be "7.4")',
    type: 'input',
}, {
    name: 'mysql_ver',
    message: 'Type MySQL version (Empty will be "8.0")',
    type: 'input',
}]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(() => {
            download('https://github.com/liginc/lig-docker-wordpress.git', {
                mergeEnvSample: true
            });
        })
        .then(() => {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', {
                mergeEnvSample: true
            })
        })
        .then(() => {
            if (answer.wordpress_type == 'with theme') {
                fs.removeSync(path.join(rootDir, "resources"))
                fs.removeSync(path.join(rootDir, "wp/wp-content/themes/input-theme-name"))
                download('https://github.com/liginc/lig-wordpress-template.git').then(() => {
                    fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/lig-wordpress-template'), path.join(rootDir, 'wp/wp-content/themes', projectName));
                    fs.renameSync(path.join(rootDir, 'resources/themes/lig-wordpress-template'), path.join(rootDir, 'resources/themes', projectName));
                }).then(()=>{
                    download('https://github.com/liginc/lig-wordpress-functions.git', {
                        destDir: 'wp/wp-content/themes/' + projectName,
                    });
                });
            } else {
                fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/input-theme-name'), path.join(rootDir, 'wp/wp-content/themes', projectName));
                fs.renameSync(path.join(rootDir, 'resources/themes/input-theme-name'), path.join(rootDir, 'resources/themes', projectName));
                download('https://github.com/liginc/lig-wordpress-functions.git', {
                    destDir: 'wp/wp-content/themes/' + projectName,
                });
            }
        })
        .then(() => {
            preparing.start();

            // Replace text on .env
            if (answer.php_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|PHP_VER=.*$|PHP_VER=" + answer.php_ver + "|g", env]);
            if (answer.mysql_ver !== '') childProcess.spawnSync('sed', ["-i", "", "-e", "s|MYSQL_VER=.*$|MYSQL_VER=" + answer.mysql_ver + "|g", env]);
            if (answer.wordpress_ver !== '') {
                childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_VERSION=.*$|WP_VERSION=" + answer.wordpress_ver + "|g", env]);
            } else {
                const wpLatestVersion = childProcess.spawnSync('git', ["ls-remote", "--tags", "--refs", "--sort='v:refname'", "https://github.com/WordPress/WordPress", "|", "tail", "-n1", "|","sed", "'s/.*\\///'"],{
                    shell: true
                });
                childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_VERSION=.*$|WP_VERSION=" + wpLatestVersion.stdout.toString().replace(/\r?\n/g,"") + "|g", env]).stderr.toString();
                process.stdout.write('WP version will set to ' + wpLatestVersion.stdout.toString() + "\n")
            }

            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_THEME_NAME=.*$|WP_THEME_NAME=" + projectName + "|g", env]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|input-theme-name|" + projectName + "|g", env]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|wordpress.test|localhost|g", env]);

            fs.readFile(webpackMixJs, 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                data = data.replace(/(const srcRelativePath =).+?\((.+?)\s.+?.replace\(.+?\)/s, '$1 $2;');
                data = data.replace(/(const distRelativePath =).+?\((.+?)\s.+?.replace\(.+?\)/s, '$1 $2;');
                fs.writeFile(webpackMixJs, data, 'utf8', function (err) {
                    if (err) return console.log(err);
                });
            });

            preparing.succeed();
        })
        .then(() => {
            let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
            pkg.engineStrict = true
            pkg.engines.node = nodeVersion
            fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2));
            process.stdout.write("Set node version into package.json \n")
        })
});
