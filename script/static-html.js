#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs-extra')
const download = require('../util/download');
const projectName = process.argv[2];
const rootDir = path.join(process.cwd(), projectName);
const pkgPath = path.join(rootDir, 'package.json')
const nodeVersion = process.argv[3];

download('https://github.com/liginc/laravel-mix-boilerplate-static.git')
    .then((projectDir) => {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.engineStrict = true
    pkg.engines.node = nodeVersion
    fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2));
    process.stdout.write("Set node version into package.json \n")
})
