const pangoGcc = require('.');

module.exports = {
    targets: {
        'gcc-initialize': new pangoGcc.GccInitializeTarget(),
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

