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
        removeReadme = false,
        mergeEnvSample = false
    } = {}
) {
    const spinner = ora(`[download] ${repository}`).start();
    const result = childProcess.spawnSync('git', ["clone", "--depth", "1", repository, process.argv[2]+"/tmp", "-b", branchName]);
    const tmpDir = path.join(process.cwd(), process.argv[2],'tmp');
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
            const envPath = path.join(projectDir, '.env');
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
            fs.copySync(tmpDir, destPath);
            fs.removeSync(tmpDir);
        });
        removeGitFiles.then(mergeEnv).then(moveFiles);
    }
}

module.exports = download;
