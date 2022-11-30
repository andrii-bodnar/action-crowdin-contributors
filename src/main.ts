import * as core from '@actions/core';
import * as dotenv from 'dotenv';
import {ContributorsTableConfig, CredentialsConfig} from './config';
import {Contributors} from './contributors';

dotenv.config();

async function run(): Promise<void> {
    try {
        const tableConfig: ContributorsTableConfig = {
            maxContributors: +core.getInput('max_contributors'),
            minWordsContributed: +core.getInput('min_words_contributed'),
            contributorsPerLine: +core.getInput('contributors_per_line'),
            imageSize: +core.getInput('image_size'),
            crowdinProjectLink: core.getInput('crowdin_project_link').trim(),
            files: core.getMultilineInput('files'),
            placeholderStart: core.getInput('placeholder_start'),
            placeholderEnd: core.getInput('placeholder_end')
        };

        let credentialsConfig: CredentialsConfig = {
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

        const contributors = new Contributors(credentialsConfig, tableConfig);

        await contributors.generate();
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

function validateCredentials(credentialsConfig: CredentialsConfig): void {
    if (credentialsConfig.projectId && credentialsConfig.token) {
        return;
    }

    let missingVariables = [];

    if (!credentialsConfig.projectId) {
        missingVariables.push('CROWDIN_PROJECT_ID');
    }

    if (!credentialsConfig.token) {
        missingVariables.push('CROWDIN_PERSONAL_TOKEN');
    }

    throw Error('Missing environment variable(s): ' + missingVariables.join(', '));
}

run();
