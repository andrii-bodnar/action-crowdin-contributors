import * as core from '@actions/core'
import {ContributorsTableConfig, CredentialsConfig, PullRequestConfig} from "./config";
import {Contributors} from "./contributors";

require('dotenv').config();

async function run(): Promise<void> {
  try {
    core.setOutput('time', new Date().toTimeString())

    const tableConfig: ContributorsTableConfig = {
      maxContributors: +core.getInput('max_contributors'),
      minWordsContributed: +core.getInput('min_words_contributed'),
      contributorsPerLine: +core.getInput('contributors_per_line'),
      imageSize: +core.getInput('image_size'),
      files: core.getMultilineInput('files'),
      placeholderStart: core.getInput('placeholder_start'),
      placeholderEnd: core.getInput('placeholder_end'),
    };

    let credentialsConfig: CredentialsConfig = {projectId: 0, token: '', organization: ''};

    if (process.env.CROWDIN_PROJECT_ID) {
      credentialsConfig.projectId = +process.env.CROWDIN_PROJECT_ID;
      core.setSecret(String(credentialsConfig.projectId));
    }

    if (process.env.CROWDIN_PERSONAL_TOKEN) {
      credentialsConfig.token = process.env.CROWDIN_PERSONAL_TOKEN;
      core.setSecret(credentialsConfig.token)
    }

    if (process.env.CROWDIN_ORGANIZATION) {
      credentialsConfig.token = process.env.CROWDIN_ORGANIZATION;
      core.setSecret(credentialsConfig.token);
    }

    if (!credentialsConfig.projectId || !credentialsConfig.token) {
      core.setFailed('Missing environment variable CROWDIN_PROJECT_ID or CROWDIN_ORGANIZATION');
    }

    const contributors = new Contributors(credentialsConfig, tableConfig);

    await contributors.generate();

    core.info('Hello world');

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
