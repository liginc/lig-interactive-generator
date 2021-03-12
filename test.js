#!/usr/bin/env node
'use strict';
const promise = require('promise');
const childProcess = require('child_process');
const wpLatestVersion = childProcess.spawnSync('git', ["ls-remote", "--tags", "--refs", "--sort='v:refname'", "https://github.com/WordPress/WordPress", "|", "tail", "-n1", "|","sed", "'s/.*\\///'"],{
    shell: true
});