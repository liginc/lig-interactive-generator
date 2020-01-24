'use strict';
const path = require('path');
const childProcess = require('child_process');
const ora = require('ora');
const fs = require('fs-extra');
const promise = require('promise');

const isFileExist = require('../util/isFileExist.js');

function download(
    repository,
    {
        branchName = 'master',
        destDir = false,
        removeGitignore = true,
        removeReadme = true,
        mergeEnvSample = false
    } = {}
) {
    const spinner = ora(`[download] ${repository}`).start();
    const result = childProcess.spawnSync('git', ["clone", "--depth", "1", repository, "tmp", "-b", branchName]);
    const tmpPath = path.join(process.cwd(), 'tmp');
    const rootDir = (process.argv[2] === 'true') ? path.join(process.cwd(), 'lig-interactive-generator') : path.join(process.cwd());
    const destPath = (destDir === false) ? path.join(rootDir) : path.join(rootDir, destDir);
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

        const mergeEnv = new Promise(function () {
            const samplePath = path.join(tmpPath, '.env-sample');
            const envPath = path.join(rootDir, '.env');
            if (mergeEnvSample !== false && isFileExist(samplePath)) {
                const envData = fs.readFileSync(samplePath, {encoding: "utf-8"});
                if (!isFileExist(envPath)) {
                    fs.writeFileSync(envPath, envData, function (err) {
                        if (err) {
                            throw err;
                        }
                    });
                } else {
                    fs.appendFileSync(envPath, "\n\n"+envData, function (err) {
                        if (err) {
                            throw err;
                        }
                    });
                }
                fs.removeSync(samplePath);
            }
        });

        const moveFiles = new Promise(function (resolve, reject) {
            if (destDir !== false) {
                fs.mkdirsSync(destPath);
            }
            fs.copySync(tmpPath, destPath);
            fs.removeSync(tmpPath);
        });

        removeGitFiles.then(mergeEnv).then(moveFiles);
    }
}

module.exports = download;
