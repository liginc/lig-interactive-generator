'use strict';
const fs = require('fs-extra');

function isFileExist (file) {
    try {
        fs.statSync(file);
        return true
    } catch (err) {
        if (err.code === 'ENOENT') return false
    }
}

module.exports = isFileExist;