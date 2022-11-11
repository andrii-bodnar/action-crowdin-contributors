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

export { ContributorsTableConfig, PullRequestConfig, CredentialsConfig };
