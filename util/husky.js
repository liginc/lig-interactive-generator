'use strict';
const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');
const ora = require('ora');

function setHusky(rootDir, scriptPath) {
    const pkgPath = path.join(rootDir, 'package.json')
    const huskyLibPath = path.join(scriptPath, 'lib/husky')
    ora(`npm ci`).start()
    childProcess.execSync('cd '+rootDir+' && npm ci')
    ora(`npm ci`).succeed()
    ora(`Installing husky packages`).start()
    childProcess.execSync('cd '+rootDir+' && npm i husky lint-staged prettier eslint-config-prettier --save-dev')
    ora(`Installing husky packages`).succeed()
    ora(`Update package.json`).start()
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.scripts.prepare = "husky install"
    pkg.scripts.test = "lint-staged -c .lintstagedrc.js"
    fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2))
    ora(`Update package.json`).succeed()
    ora('Copying husky setting files').start()
    const files = fs.readdirSync(huskyLibPath)
    files.forEach(file => {
        fs.copyFileSync(path.join(huskyLibPath, file), path.join(rootDir, file))
    })
    ora('Copying husky setting files').succeed()
}

module.exports = setHusky;
