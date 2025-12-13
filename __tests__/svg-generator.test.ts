import { SvgGenerator } from '../src/svg-generator';
import { expect, describe, beforeEach, it, jest, afterEach } from '@jest/globals';
import { ContributorsTableConfig, CredentialsConfig } from '../src/config';
import { User } from '../src/contributors';

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
}));

const mockGet = jest.fn<() => Promise<{ data: Buffer; headers: { 'content-type': string } }>>();
jest.mock('axios', () => ({
  default: {
    get: mockGet,
  },
}));

describe('SvgGenerator', () => {
  let svgGenerator: SvgGenerator;
  let credentials: CredentialsConfig;
  let config: ContributorsTableConfig;

  const mockImageResponse = {
    data: Buffer.from('fake-image-data'),
    headers: { 'content-type': 'image/png' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(mockImageResponse);

    credentials = {
      projectId: 1,
      token: 'token',
    };
    config = {
      maxContributors: 10,
      minWordsContributed: 10,
      contributorsPerLine: 5,
      imageSize: 100,
      crowdinProjectLink: '',
      includeLanguages: true,
      excludedUsers: [],
      files: ['README.md'],
      placeholderStart: '<!-- CROWDIN-CONTRIBUTORS-START -->',
      placeholderEnd: '<!-- CROWDIN-CONTRIBUTORS-END -->',
      svg: true,
      svgOutputPath: 'CONTRIBUTORS.svg',
    };
    svgGenerator = new SvgGenerator(credentials, config);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateSvg', () => {
    it('should generate a valid SVG structure', async () => {
      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).toContain('<svg');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
      expect(result).toContain('</svg>');
    });

    it('should include contributor data in SVG', async () => {
      const users: User[] = [
        {
          id: 1,
          username: 'testuser',
          name: 'Test User',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).toContain('Test User');
      expect(result).toContain('150 words');
      expect(result).toContain('https://crowdin.com/profile/testuser');
      // Should contain base64 embedded image (either PNG from fetch or SVG placeholder)
      expect(result).toMatch(/data:image\/(png|svg\+xml);base64,/);
    });

    it('should render multiple contributors in a grid', async () => {
      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
        {
          id: 2,
          username: 'user2',
          name: 'User Two',
          translated: '200',
          approved: '100',
          picture: 'https://example.com/avatar2.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).toContain('User One');
      expect(result).toContain('User Two');
      expect(result).toContain('150 words');
      expect(result).toContain('300 words');
    });

    it('should not include profile links for organization projects', async () => {
      credentials.organization = 'test-org';
      svgGenerator = new SvgGenerator(credentials, config);

      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).not.toContain('xlink:href="https://crowdin.com/profile/user1"');
    });

    it('should include project link when configured', async () => {
      config.crowdinProjectLink = 'https://crowdin.com/project/test';
      svgGenerator = new SvgGenerator(credentials, config);

      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).toContain('https://crowdin.com/project/test');
      expect(result).toContain('Translate in Crowdin');
    });

    it('should escape XML special characters in names', async () => {
      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User <script>alert("xss")</script>',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should calculate correct dimensions for grid layout', async () => {
      config.contributorsPerLine = 2;
      svgGenerator = new SvgGenerator(credentials, config);

      const users: User[] = Array(4)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          username: `user${i + 1}`,
          name: `User ${i + 1}`,
          translated: '100',
          approved: '50',
          picture: `https://example.com/avatar${i + 1}.png`,
          languages: [],
        }));

      const result = await svgGenerator.generateSvg(users);

      // With 2 per line and 4 users, we should have 2 rows
      // Width should be 2 * (100 + 40) = 280 (imageSize + padding*2)
      expect(result).toContain('width="280"');
    });

    it('should handle empty users array', async () => {
      const result = await svgGenerator.generateSvg([]);

      expect(result).toContain('<svg');
      expect(result).toContain('width="0"');
      expect(result).toContain('height="0"');
    });

    it('should use placeholder when avatar fetch fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const users: User[] = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          translated: '100',
          approved: '50',
          picture: 'https://example.com/avatar1.png',
          languages: [],
        },
      ];

      const result = await svgGenerator.generateSvg(users);

      // Should still generate SVG with placeholder
      expect(result).toContain('<svg');
      expect(result).toContain('User One');
      // Placeholder is an SVG data URI
      expect(result).toContain('data:image/svg+xml;base64,');
    });
  });
});
