'use strict';
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');

function setHusky(rootDir, scriptPath) {

    // husky用のdevDependenciesをpackage.jsonに追加
    const pkgPath = path.join(rootDir, 'package.json')
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const huskyLibPath = path.join(scriptPath, 'lib/husky')
    const pkgHuskyPath = path.join(huskyLibPath, 'package.json')
    const pkgHusky = JSON.parse(fs.readFileSync(pkgHuskyPath, 'utf8'))
    for (let k of Object.keys(pkgHusky.devDependencies)) {
        if (!(k in pkg.devDependencies)) {
            pkg.devDependencies[k] = pkgHusky.devDependencies[k]
        }
    }

    // scriptsを追加
    pkg.scripts.prepare = "husky install"
    pkg.scripts.test = "lint-staged -c .lintstagedrc.js"
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    ora(`Update package.json`).succeed()

    ora(`Update package-lock.json`).start()
    const pkgLockPath = path.join(rootDir, 'package-lock.json')
    let pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'))
    const pkgLockHuskyPath = path.join(huskyLibPath, 'package-lock.json')
    const pkgLockHusky = JSON.parse(fs.readFileSync(pkgLockHuskyPath, 'utf8'))
    for (let k of Object.keys(pkgLockHusky.dependencies)) {
        // package-lock.jsonはバージョン比較をする
        if (!(k in pkgLock.dependencies) || pkgLock.dependencies[k]['version'] < pkgLockHusky.dependencies[k]['version']) {
            pkgLock.dependencies[k] = pkgLockHusky.dependencies[k]
        }
    }
    fs.writeFileSync(pkgLockPath, JSON.stringify(pkgLock, null, 2))
    ora(`Update package-lock.json`).succeed()

    ora('Copying husky setting files').start()
    const files = fs.readdirSync(huskyLibPath)
    files.forEach(file => {
        if (file != "package.json" && file != "package-lock.json") {
            fs.copyFileSync(path.join(huskyLibPath, file), path.join(rootDir, file))
        }
    })
    ora('Copying husky setting files').succeed()
}

module.exports = setHusky;