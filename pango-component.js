const pangoGcc = require('.');

module.exports = {
    targets: {
        'generate-sources': {
            preRequisites: ['initialize']
        },
        'gcc-add-source-files': new pangoGcc.GccAddSourceFilesTarget(),
        compile: {
            preRequisites: ['generate-sources']
        },
        link: new pangoGcc.GccLinkTarget(),
        build: {
            preRequisites: ['link']
        }
    }
};

