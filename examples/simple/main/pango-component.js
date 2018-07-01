const GccTargetBuilder = require('pango-gcc').GccTargetBuilder;

module.exports = {
    targets: {
        'simple-main': {
            run(projectOptions) {
                return GccTargetBuilder.createTargets(projectOptions, __dirname);
            },
            postRequisites: ['build']
        }
    }
};
