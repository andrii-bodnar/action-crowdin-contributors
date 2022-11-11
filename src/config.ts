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

export {ContributorsTableConfig, CredentialsConfig};
