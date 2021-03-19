'use strict';
const path = require('path');
const childProcess = require('child_process');
const ora = require('ora');
const fs = require('fs-extra');
const promise = require('promise');

const isFileExist = require('../util/isFileExist.js');

async function download(
    repository,
    {
        branchName = 'master',
        destDir = false,
        removeReadme = false,
        mergeEnvSample = true
    } = {}
) {
    const spinner = ora(`[download] ${repository}`).start();
    const result = childProcess.spawnSync('git', ["clone", "--depth", "1", repository, process.argv[2] + "/tmp", "-b", branchName]);
    const tmpDir = path.join(process.cwd(), process.argv[2], 'tmp');
    const projectDir = path.join(process.cwd(), process.argv[2]);
    const destPath = (destDir === false) ? path.join(projectDir) : path.join(projectDir, destDir);

    if (result.status !== 0) {
        process.stderr.write(result.stderr);
        process.exit(result.status);
    } else {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        spinner.succeed();

        const removeGitFiles = new Promise(function (resolve, reject) {
            if (removeReadme) {
                try {
                    const readmePath = path.join(tmpDir, 'README.md');
                    fs.removeSync(readmePath);
                } catch (e) {
                    console.log("couldn't remove README.md");
                    console.log(e);
                }
            }

            try {
                const dotGitPath = path.join(tmpDir, '.git');
                fs.removeSync(dotGitPath);
            } catch (e) {
                console.log("couldn't remove .git");
                console.log(e);
            }
        });

        const mergeEnv = new Promise(function () {
            const srcPath = path.join(tmpDir, '.env-sample');
            const destPath = path.join(projectDir, '.env-sample');
            const envDestPath = path.join(projectDir, '.env');
            if (!isFileExist(destPath)) {
                fs.appendFileSync(destPath, "", function (err) {
                    if (err) {
                        throw err;
                    }
                });
            }
            if (isFileExist(srcPath)) {
                const destData = fs.readFileSync(destPath, {encoding: "utf-8"});
                let destDataArr = destData.split(/\r\n|\r|\n/)
                const srcData = fs.readFileSync(srcPath, {encoding: "utf-8"});
                let srcDataArr = srcData.split(/\r\n|\r|\n/)

                if ( !srcDataArr.length ) return
                srcDataArr.forEach(data => {
                    if ( !destDataArr.includes(data) ) {
                        destDataArr.push(data)
                    }
                })
                fs.removeSync(srcPath);
                fs.writeFileSync(destPath,destDataArr.join("\n"))
                fs.copyFile(destPath,envDestPath)
            }
        });

        const mergeGitignore = new Promise(function () {
            const srcPath = path.join(tmpDir, '.gitignore');
            const destPath = path.join(projectDir, '.gitignore');
            if (!isFileExist(destPath)) {
                fs.appendFileSync(destPath, "", function (err) {
                    if (err) {
                        throw err;
                    }
                });
            }
            if (isFileExist(srcPath)) {
                const destData = fs.readFileSync(destPath, {encoding: "utf-8"});
                let destDataArr = destData.split(/\r\n|\r|\n/)
                const srcData = fs.readFileSync(srcPath, {encoding: "utf-8"});
                let srcDataArr = srcData.split(/\r\n|\r|\n/)

                if ( !srcDataArr.length ) return
                srcDataArr.forEach(data => {
                    if ( !destDataArr.includes(data) ) {
                        destDataArr.push(data)
                    }
                })
                fs.removeSync(srcPath);
                fs.writeFileSync(destPath,destDataArr.join("\n"))
            }
        });

        const moveFiles = new Promise(function (resolve, reject) {
            if (destDir !== false) {
                fs.mkdirsSync(destPath);
            }
            fs.copySync(tmpDir, destPath);
            fs.removeSync(tmpDir);
        });

        const afterClone = new Promise(function (resolve, reject) {
            if (fs.existsSync(path.join(destPath, 'after_clone.sh'))) {
                childProcess.execSync('$SHELL ' + path.join(destPath, 'after_clone.sh') + ' ' + destPath)
                fs.removeSync(path.join(destPath, 'after_clone.sh'))
            }
        });

        removeGitFiles.then(mergeEnv).then(mergeGitignore).then(moveFiles).then(afterClone);
        return await destPath
    }
}

module.exports = download;
