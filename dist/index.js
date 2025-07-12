Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const dotenv = tslib_1.__importStar(require("dotenv"));
const contributors_1 = require("./contributors");
dotenv.config();
async function run() {
    try {
        const tableConfig = {
            maxContributors: +core.getInput('max_contributors'),
            minWordsContributed: +core.getInput('min_words_contributed'),
            contributorsPerLine: +core.getInput('contributors_per_line'),
            imageSize: +core.getInput('image_size'),
            crowdinProjectLink: core.getInput('crowdin_project_link').trim(),
            includeLanguages: core.getInput('include_languages') === 'true',
            files: core.getMultilineInput('files'),
            placeholderStart: core.getInput('placeholder_start'),
            placeholderEnd: core.getInput('placeholder_end'),
        };
        const credentialsConfig = {
            projectId: 0,
            token: '',
            organization: '',
        };
        if (process.env.CROWDIN_PROJECT_ID) {
            credentialsConfig.projectId = +process.env.CROWDIN_PROJECT_ID;
        }
        if (process.env.CROWDIN_PERSONAL_TOKEN) {
            credentialsConfig.token = process.env.CROWDIN_PERSONAL_TOKEN;
            core.setSecret(String(credentialsConfig.token));
        }
        if (process.env.CROWDIN_ORGANIZATION) {
            credentialsConfig.organization = process.env.CROWDIN_ORGANIZATION;
            core.setSecret(String(credentialsConfig.organization));
        }
        validateCredentials(credentialsConfig);
        const contributors = new contributors_1.Contributors(credentialsConfig, tableConfig);
        await contributors.generate();
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
function validateCredentials(credentialsConfig) {
    if (credentialsConfig.projectId && credentialsConfig.token) {
        return;
    }
    const missingVariables = [];
    if (!credentialsConfig.projectId) {
        missingVariables.push('CROWDIN_PROJECT_ID');
    }
    if (!credentialsConfig.token) {
        missingVariables.push('CROWDIN_PERSONAL_TOKEN');
    }
    throw Error('Missing environment variable(s): ' + missingVariables.join(', '));
}
run();
//# sourceMappingURL=index.js.map
