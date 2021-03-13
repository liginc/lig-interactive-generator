'use strict';
const fs = require('fs-extra');
const path = require('path');
fs.readdir('.', function(err, files){
    console.log(files);
});