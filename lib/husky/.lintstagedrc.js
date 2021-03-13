const {CLIEngine} = require('eslint')
const { execSync } = require('child_process')

const cli = new CLIEngine({})

module.exports = {
    // https://github.com/okonet/lint-staged#how-can-i-ignore-files-from-eslintignore-
    'resources/**/*.js': files => {
        const unignoredFiles = files.filter(file => !cli.isPathIgnored(file))
        const joinedUnignoredFiles = unignoredFiles.join(' ')
        const values = [`eslint --max-warnings=0 ${joinedUnignoredFiles}`]
        if (unignoredFiles.length) values.push(`prettier -w ${joinedUnignoredFiles}`)
        return values
    },

    'resources/**/*.{scss,css}': ['stylelint', 'prettier -w'],
}
