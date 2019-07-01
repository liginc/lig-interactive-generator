'use strict';
const path = require('path');
const childProcess = require('child_process');
const ora = require('ora');
const fs = require('fs-extra');
const promise = require('promise');

function download(repository, branchName = 'master', destDir = false, removeGitignore = true, removeReadme = true) {
    const spinner = ora(`[download] ${repository}`).start();
    const result = childProcess.spawnSync('git', ["clone", "--depth", "1", repository, "tmp", "-b", branchName]);
    const tmpPath = path.join(process.cwd(), 'tmp');
    const destPath = (destDir === false) ? path.join(process.cwd()) : path.join(process.cwd(), destDir);
    if (result.status !== 0) {
        process.stderr.write(result.stderr);
        process.exit(result.status);
    } else {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        spinner.succeed();

        const removeGitFiles = new Promise(function (resolve, reject) {
            if (removeGitignore) {
                try {
                    const gitignorePath = path.join(tmpPath, '.gitignore');
                    fs.removeSync(gitignorePath);
                } catch (e) {
                    console.log("couldn't remove .gitignore");
                    console.log(e);
                }
            }
            if (removeReadme) {
                try {
                    const readmePath = path.join(tmpPath, 'README.md');
                    fs.removeSync(readmePath);
                } catch (e) {
                    console.log("couldn't remove README.md");
                    console.log(e);
                }
            }

            try {
                const dotGitPath = path.join(tmpPath, '.git');
                fs.removeSync(dotGitPath);
            } catch (e) {
                console.log("couldn't remove .git");
                console.log(e);
            }
        });

        const moveFiles = new Promise(function (resolve, reject) {
            if (destDir !== false) {
                fs.mkdirsSync(destPath);
            }
            fs.copySync(tmpPath, destPath);
            fs.removeSync(tmpPath);
        });

        removeGitFiles.then(moveFiles);
    }
}

module.exports = download;