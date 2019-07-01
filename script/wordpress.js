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

inquirer.prompt([{
    name: 'name',
    message: 'Type theme name',
    type: 'input',
},]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(function () {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', 'master');
        })
        .then(function () {
            download('git@bitbucket.org:lig-admin/lig-wordpress-docker.git', 'master', false, false, false);
        })
        .then(function () {
            download('git@bitbucket.org:lig-admin/lig-wordpress-plugins.git', 'master', 'wp/wp-content/plugins');
        })
        .then(function () {
            download('git@bitbucket.org:lig-admin/lig-wordpress-template.git', 'master', 'wp/wp-content/themes/lig');
        })
        .then(function () {
            preparing.start();
            childProcess.spawnSync('sed', ["-i","","-e","s|WP_THEME_NAME=lig|WP_THEME_NAME="+answer.name+"|g",path.join(process.cwd(),"docker.env")]);
            childProcess.spawnSync('sed', ["-i","","-e","s|!/wp/wp-content/themes/lig/|!/wp/wp-content/themes/"+answer.name+"/|g",path.join(process.cwd(),".gitignore")]);
            childProcess.spawnSync('sed', ["-i","","-e","s|'lig'|'"+answer.name+"'|g",path.join(process.cwd(),"webpack.mix.js")]);
            childProcess.spawnSync('sed', ["-i","","-e","s|Theme Name: LIG WordPress Template|Theme Name: "+answer.name+"|g",path.join(process.cwd(),"wp/wp-content/themes/lig/style.css")]);
            childProcess.spawnSync('sed', ["-i","","-e","s|Text Domain: lig-wordpress-template|Text Domain: "+answer.name+"|g",path.join(process.cwd(),"wp/wp-content/themes/lig/style.css")]);
            fs.renameSync(path.join(process.cwd(), 'resources/themes/lig'),path.join(process.cwd(), 'resources/themes',answer.name));
            fs.renameSync(path.join(process.cwd(), 'wp/wp-content/themes/lig'),path.join(process.cwd(), 'wp/wp-content/themes',answer.name));
            preparing.succeed();
        });
});
