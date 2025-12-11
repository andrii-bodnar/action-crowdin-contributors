interface ContributorsTableConfig {
  maxContributors: number;
  minWordsContributed: number;
  contributorsPerLine: number;
  imageSize: number;
  crowdinProjectLink: string;
  includeLanguages: boolean;
  excludedUsers: string[];
  files: string[];
  placeholderStart: string;
  placeholderEnd: string;
  svg: boolean;
  svgOutputPath: string;
}

interface CredentialsConfig {
  projectId: number;
  token: string;
  organization?: string;
}

export type { ContributorsTableConfig, CredentialsConfig };
