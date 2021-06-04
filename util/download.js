"use strict";
const path = require("path");
const childProcess = require("child_process");
const ora = require("ora");
const fs = require("fs-extra");
const promise = require("promise");

const isFileExist = require("../util/isFileExist.js");

async function download(
  repository,
  {
    branchName = "master",
    destDir = false,
    mergeReadme = true,
    mergeEnvSample = true,
  } = {}
) {
  const spinner = ora(`[download] ${repository}`).start();
  const result = childProcess.spawnSync("git", [
    "clone",
    "--depth",
    "1",
    repository,
    process.argv[2] + "/tmp",
    "-b",
    branchName,
  ]);
  const tmpDir = path.join(process.cwd(), process.argv[2], "tmp");
  const projectDir = path.join(process.cwd(), process.argv[2]);
  const destPath =
    destDir === false ? path.join(projectDir) : path.join(projectDir, destDir);

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status);
  } else {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    spinner.succeed();

    const removeGitFilesPromise = new Promise(function (resolve, reject) {
      try {
        const dotGitPath = path.join(tmpDir, ".git");
        fs.removeSync(dotGitPath);
      } catch (e) {
        console.log("couldn't remove .git");
        console.log(e);
      }
    });

    const mergeReadmePromise = new Promise(() => {
      const readmeSrcPath = path.join(tmpDir, "README.md");
      const readmeDistPath = path.join(projectDir, "README.md");

      if (isFileExist(readmeSrcPath)) {
        if (mergeReadme) {
          const readmeText =
            fs
              .readFileSync(readmeSrcPath, { encoding: "utf-8" })
              .replace(/^[\s\S]*?---/g, "") + "\n\n---\n";
          if (readmeText != "") {
            try {
              fs.appendFileSync(readmeDistPath, readmeText, function (err) {
                if (err) {
                  throw err;
                }
              });
            } catch (e) {
              console.log("couldn't append text README.md");
              console.log(e);
            }
          }
        }
        try {
          fs.removeSync(readmeSrcPath);
        } catch (e) {
          console.log("couldn't remove README.md");
          console.log(e);
        }
      }
    });

    const mergeEnvPromise = new Promise(function () {
      const srcPath = path.join(tmpDir, ".env-sample");
      const destPath = path.join(projectDir, ".env-sample");
      if (!isFileExist(destPath)) {
        fs.appendFileSync(destPath, "", function (err) {
          if (err) {
            throw err;
          }
        });
      }
      if (isFileExist(srcPath)) {
        const destData = fs.readFileSync(destPath, { encoding: "utf-8" });
        let destDataArr = destData.split(/\r\n|\r|\n/);
        const srcData = fs.readFileSync(srcPath, { encoding: "utf-8" });
        let srcDataArr = srcData.split(/\r\n|\r|\n/);

        if (!srcDataArr.length) return;
        srcDataArr.forEach((data) => {
          if (!destDataArr.includes(data)) {
            destDataArr.push(data);
          }
        });
        fs.removeSync(srcPath);
        fs.writeFileSync(destPath, destDataArr.join("\n"));
      }
    });

    const mergeGitignorePromise = new Promise(function () {
      const srcPath = path.join(tmpDir, ".gitignore");
      const destPath = path.join(projectDir, ".gitignore");
      if (!isFileExist(destPath)) {
        fs.appendFileSync(destPath, "", function (err) {
          if (err) {
            throw err;
          }
        });
      }
      if (isFileExist(srcPath)) {
        const destData = fs.readFileSync(destPath, { encoding: "utf-8" });
        let destDataArr = destData.split(/\r\n|\r|\n/);
        const srcData = fs.readFileSync(srcPath, { encoding: "utf-8" });
        let srcDataArr = srcData.split(/\r\n|\r|\n/);

        if (!srcDataArr.length) return;
        srcDataArr.forEach((data) => {
          if (!destDataArr.includes(data)) {
            destDataArr.push(data);
          }
        });
        fs.removeSync(srcPath);
        fs.writeFileSync(destPath, destDataArr.join("\n"));
      }
    });

    const appendPackagePromise = new Promise(function (resolve, reject) {
      const appendPackageDir = path.join(tmpDir, "append_package");
      if (!isFileExist(appendPackageDir)) return resolve();

      const packageDestPath = path.join(destPath, "package.json");
      const packageSrcPath = path.join(appendPackageDir, "package.json")
      if (isFileExist(packageDestPath) && isFileExist(packageSrcPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageDestPath, 'utf8'))
        const appendPkg = JSON.parse(fs.readFileSync(packageSrcPath, "utf8"))
        if ( (Object.keys(pkg).indexOf('dependencies') === -1)) {
          pkg.dependencies = {}
        }
        for (let k of Object.keys(appendPkg.dependencies)) {
          if (!(k in pkg.dependencies)) {
            pkg.dependencies[k] = appendPkg.dependencies[k];
          }
        }
        if ( (Object.keys(pkg).indexOf('devDependencies') === -1)) {
          pkg.devDependencies = {}
        }
        for (let k of Object.keys(appendPkg.devDependencies)) {
          if (!(k in pkg.devDependencies)) {
            pkg.devDependencies[k] = appendPkg.devDependencies[k];
          }
        }
        fs.writeFileSync(packageDestPath, JSON.stringify(pkg, null, 2))
        ora(`Update package.json`).succeed()
      }

      const packageLockDestPath = path.join(destPath, "package-lock.json");
      const packageLockSrcPath = path.join(appendPackageDir, "package-lock.json")
      if (isFileExist(packageLockDestPath) && isFileExist(packageLockSrcPath)) {
        const pkgLock = JSON.parse(fs.readFileSync(packageLockDestPath, 'utf8'))
        const appendLockPkg = JSON.parse(fs.readFileSync(packageLockSrcPath, "utf8"))
        if ( (Object.keys(pkgLock).indexOf('dependencies') === -1)) {
          pkgLock.dependencies = {}
        }
        for (let k of Object.keys(appendLockPkg.dependencies)) {
            // package-lock.jsonはバージョン比較をする
            if (!(k in pkgLock.dependencies) || pkgLock.dependencies[k]['version'] < appendLockPkg.dependencies[k]['version']) {
                pkgLock.dependencies[k] = appendLockPkg.dependencies[k]
            }
        }
        fs.writeFileSync(packageLockDestPath, JSON.stringify(pkgLock, null, 2))
        ora(`Update package-lock.json`).succeed()
      }

      fs.removeSync(appendPackageDir)
    });

    const moveFilesPromise = new Promise(function (resolve, reject) {
      if (destDir !== false) {
        fs.mkdirsSync(destPath);
      }
      fs.copySync(tmpDir, destPath);
      fs.removeSync(tmpDir);
    });

    removeGitFilesPromise
      .then(mergeEnvPromise)
      .then(mergeReadmePromise)
      .then(mergeGitignorePromise)
      .then(appendPackagePromise)
      .then(moveFilesPromise)
    return await destPath;
  }
}

module.exports = download;
