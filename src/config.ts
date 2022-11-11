interface ContributorsTableConfig {
    maxContributors: number;
    minWordsContributed: number;
    contributorsPerLine: number;
    imageSize: number;
    files: string[];
    placeholderStart: string;
    placeholderEnd: string;
}

interface CredentialsConfig {
    projectId: number;
    token: string;
    organization?: string;
}

interface PullRequestConfig {
    commitMessage: string;
    branchName: string;
    createPullRequest: boolean;
    baseBranchName: string;
    pullRequestTitle: string;
    pullRequestBody: string;
    pullRequestLabels: string[];
    pullRequestAssignees: string[];
    pullRequestReviewers: string[];
}

/**
 * const pullRequestConfig: PullRequestConfig = {
 *       commitMessage: core.getInput('commit_message'),
 *       branchName: core.getInput('branch_name'),
 *       createPullRequest: core.getBooleanInput('create_pull_request'),
 *       baseBranchName: core.getInput('base_branch_name'),
 *       pullRequestTitle: core.getInput('pull_request_title'),
 *       pullRequestBody: core.getInput('pull_request_body'),
 *       pullRequestLabels: core.getMultilineInput('pull_request_labels'),
 *       pullRequestAssignees: core.getMultilineInput('pull_request_assignees'),
 *       pullRequestReviewers: core.getMultilineInput('pull_request_reviewers'),
 *     };
 */

export { ContributorsTableConfig, PullRequestConfig, CredentialsConfig };
