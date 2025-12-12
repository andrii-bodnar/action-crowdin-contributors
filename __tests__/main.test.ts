import { expect, describe, jest, beforeEach, afterEach, test } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  getMultilineInput: jest.fn(),
  setSecret: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
}));

jest.unstable_mockModule('../src/contributors', () => ({
  Contributors: jest.fn(),
}));

jest.unstable_mockModule('dotenv', () => ({
  config: jest.fn(),
}));

describe('run', () => {
  const originalEnv = process.env;
  let mockedCore: {
    getInput: jest.Mock;
    getMultilineInput: jest.Mock;
    setSecret: jest.Mock;
    setFailed: jest.Mock;
    info: jest.Mock;
  };
  let MockedContributors: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {};

    mockedCore = (await import('@actions/core')) as unknown as typeof mockedCore;
    const contributorsModule = await import('../src/contributors');
    MockedContributors = contributorsModule.Contributors as unknown as jest.Mock;

    mockedCore.getInput.mockImplementation((name: unknown) => {
      const inputs: Record<string, string> = {
        max_contributors: '10',
        min_words_contributed: '100',
        contributors_per_line: '5',
        image_size: '64',
        crowdin_project_link: 'https://crowdin.com/project/test',
        include_languages: 'true',
        placeholder_start: '<!-- CROWDIN-CONTRIBUTORS-START -->',
        placeholder_end: '<!-- CROWDIN-CONTRIBUTORS-END -->',
        svg: 'false',
        svg_output_path: 'CONTRIBUTORS.svg',
      };
      return inputs[name as string] || '';
    });

    mockedCore.getMultilineInput.mockImplementation((name: unknown) => {
      const inputs: Record<string, string[]> = {
        excluded_users: [],
        files: ['README.md'],
      };
      return inputs[name as string] || [];
    });

    MockedContributors.mockImplementation(() => {
      return {
        generate: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  test('should fail when CROWDIN_PROJECT_ID is missing', async () => {
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';

    const { run } = await import('../src/main');
    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('Missing environment variable(s): CROWDIN_PROJECT_ID');
  });

  test('should fail when CROWDIN_PERSONAL_TOKEN is missing', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';

    const { run } = await import('../src/main');
    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('Missing environment variable(s): CROWDIN_PERSONAL_TOKEN');
  });

  test('should fail when both CROWDIN_PROJECT_ID and CROWDIN_PERSONAL_TOKEN are missing', async () => {
    const { run } = await import('../src/main');
    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      'Missing environment variable(s): CROWDIN_PROJECT_ID, CROWDIN_PERSONAL_TOKEN',
    );
  });

  test('should run successfully with valid credentials', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';

    const { run } = await import('../src/main');
    await run();

    expect(MockedContributors).toHaveBeenCalledWith(
      {
        projectId: 123,
        token: 'test-token',
        organization: '',
      },
      expect.objectContaining({
        maxContributors: 10,
        minWordsContributed: 100,
        contributorsPerLine: 5,
        imageSize: 64,
      }),
    );
    expect(mockedCore.setFailed).not.toHaveBeenCalled();
  });

  test('should run successfully with organization', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';
    process.env.CROWDIN_ORGANIZATION = 'my-org';

    const { run } = await import('../src/main');
    await run();

    expect(MockedContributors).toHaveBeenCalledWith(
      {
        projectId: 123,
        token: 'test-token',
        organization: 'my-org',
      },
      expect.any(Object),
    );
    expect(mockedCore.setSecret).toHaveBeenCalledWith('test-token');
    expect(mockedCore.setSecret).toHaveBeenCalledWith('my-org');
  });

  test('should extract organization from full URL', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';
    process.env.CROWDIN_ORGANIZATION = 'https://my-org.crowdin.com/';

    const { run } = await import('../src/main');
    await run();

    expect(MockedContributors).toHaveBeenCalledWith(
      {
        projectId: 123,
        token: 'test-token',
        organization: 'my-org',
      },
      expect.any(Object),
    );
  });

  test('should call generate on Contributors instance', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';

    const mockGenerate = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    MockedContributors.mockImplementation(() => {
      return {
        generate: mockGenerate,
      };
    });

    const { run } = await import('../src/main');
    await run();

    expect(mockGenerate).toHaveBeenCalled();
  });

  test('should handle error from Contributors.generate', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';

    const mockGenerate = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('API error'));
    MockedContributors.mockImplementation(() => {
      return {
        generate: mockGenerate,
      };
    });

    const { run } = await import('../src/main');
    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('API error');
  });

  test('should parse table config from inputs correctly', async () => {
    process.env.CROWDIN_PROJECT_ID = '123';
    process.env.CROWDIN_PERSONAL_TOKEN = 'test-token';

    mockedCore.getInput.mockImplementation((name: unknown) => {
      const inputs: Record<string, string> = {
        max_contributors: '25',
        min_words_contributed: '50',
        contributors_per_line: '8',
        image_size: '100',
        crowdin_project_link: '  https://crowdin.com/project/myproject  ',
        include_languages: 'false',
        placeholder_start: '<!-- START -->',
        placeholder_end: '<!-- END -->',
        svg: 'true',
        svg_output_path: 'output/contributors.svg',
      };
      return inputs[name as string] || '';
    });

    mockedCore.getMultilineInput.mockImplementation((name: unknown) => {
      const inputs: Record<string, string[]> = {
        excluded_users: ['user1', 'user2'],
        files: ['README.md', 'docs/CONTRIBUTORS.md'],
      };
      return inputs[name as string] || [];
    });

    const { run } = await import('../src/main');
    await run();

    expect(MockedContributors).toHaveBeenCalledWith(expect.any(Object), {
      maxContributors: 25,
      minWordsContributed: 50,
      contributorsPerLine: 8,
      imageSize: 100,
      crowdinProjectLink: 'https://crowdin.com/project/myproject',
      includeLanguages: false,
      excludedUsers: ['user1', 'user2'],
      files: ['README.md', 'docs/CONTRIBUTORS.md'],
      placeholderStart: '<!-- START -->',
      placeholderEnd: '<!-- END -->',
      svg: true,
      svgOutputPath: 'output/contributors.svg',
    });
  });
});
