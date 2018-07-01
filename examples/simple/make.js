'use strict';
const path = require('path');

require('pango').run({
    projectDir: __dirname,
    buildDir: path.join(__dirname, 'build'),
    components: [
        'pango',
        'main'
    ]
});
