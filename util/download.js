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
        removeGitignore = true,
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
            if (removeGitignore) {
                try {
                    const gitignorePath = path.join(tmpDir, '.gitignore');
                    fs.removeSync(gitignorePath);
                } catch (e) {
                    console.log("couldn't remove .gitignore");
                    console.log(e);
                }
            }
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
            const samplePath = path.join(tmpDir, '.env-sample');
            const envPath = path.join(projectDir, '.env-sample');
            if (!isFileExist(envPath)) {
                fs.appendFileSync(envPath, "", function (err) {
                    if (err) {
                        throw err;
                    }
                });
            }
            if (mergeEnvSample !== false && isFileExist(samplePath)) {
                const envData = fs.readFileSync(envPath, {encoding: "utf-8"});
                let envDataArr = envData.split(/\r\n|\r|\n/)
                const envDataTmp = fs.readFileSync(samplePath, {encoding: "utf-8"});
                let envDataTmpArr = envDataTmp.split(/\r\n|\r|\n/)

                if ( !envDataTmpArr.length ) return
                envDataTmpArr.forEach(data => {
                    if ( !envDataArr.includes(data) ) {
                        envDataArr.push(data)
                    }
                })
                fs.removeSync(samplePath);
                fs.writeFileSync(envPath,envDataArr.join("\n"))
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

        removeGitFiles.then(mergeEnv).then(moveFiles).then(afterClone);
        return await destPath
    }
}

module.exports = download;
