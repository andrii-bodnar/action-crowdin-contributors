"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const dotenv = __importStar(require("dotenv"));
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
            placeholderEnd: core.getInput('placeholder_end')
        };
        const credentialsConfig = {
            projectId: 0,
            token: '',
            organization: ''
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
