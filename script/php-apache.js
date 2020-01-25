#!/usr/bin/env node
'use strict';
const path = require('path');
const download = require('../util/download');

download('https://github.com/liginc/laravel-mix-boilerplate-static.git',{mergeEnvSample:true});
