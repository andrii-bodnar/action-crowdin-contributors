interface ContributorsTableConfig {
  maxContributors: number;
  minWordsContributed: number;
  contributorsPerLine: number;
  imageSize: number;
  crowdinProjectLink: string;
  includeLanguages: boolean;
  files: string[];
  placeholderStart: string;
  placeholderEnd: string;
}

interface CredentialsConfig {
  projectId: number;
  token: string;
  organization?: string;
}

export type { ContributorsTableConfig, CredentialsConfig };
