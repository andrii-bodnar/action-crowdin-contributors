import axios from 'axios';
import * as core from '@actions/core';
import { ContributorsTableConfig, CredentialsConfig } from './config.js';
import { Language, User } from './contributors.js';
import { formatUserName } from './utils.js';

interface UserWithBase64 extends User {
  pictureBase64: string;
}

export class SvgGenerator {
  private config: ContributorsTableConfig;
  private credentials: CredentialsConfig;

  private readonly CELL_PADDING = 20;
  private readonly TEXT_HEIGHT = 70;
  private readonly LANGUAGES_LINE_HEIGHT = 20;
  // Approximate character width of the 12px languages font, used to fit the line into the cell
  private readonly LANGUAGES_CHAR_WIDTH = 7;
  private readonly FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  constructor(credentials: CredentialsConfig, config: ContributorsTableConfig) {
    this.credentials = credentials;
    this.config = config;
  }

  public async generateSvg(users: User[]): Promise<string> {
    core.info('Fetching avatar images...');
    const usersWithImages = await this.fetchAvatars(users);

    const imageSize = this.config.imageSize;
    const perLine = this.config.contributorsPerLine;
    const showLanguages =
      this.config.includeLanguages && users.some((user) => user.languages && user.languages.length > 0);
    const cellWidth = imageSize + this.CELL_PADDING * 2;
    const cellHeight =
      imageSize + this.TEXT_HEIGHT + (showLanguages ? this.LANGUAGES_LINE_HEIGHT : 0) + this.CELL_PADDING * 2;

    const rows = Math.ceil(users.length / perLine);
    const cols = users.length === 0 ? 0 : perLine;

    const width = cols * cellWidth;
    const height = rows * cellHeight;

    let contributorsContent = '';

    usersWithImages.forEach((user, index) => {
      const col = index % perLine;
      const row = Math.floor(index / perLine);

      const x = col * cellWidth + this.CELL_PADDING;
      const y = row * cellHeight + this.CELL_PADDING;

      contributorsContent += this.renderContributor(user, x, y, imageSize);
    });

    return this.renderSvg(width, height, contributorsContent);
  }

  private async fetchAvatars(users: User[]): Promise<UserWithBase64[]> {
    const results: UserWithBase64[] = [];

    for (const user of users) {
      let pictureBase64 = '';

      try {
        const response = await axios.get(user.picture, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });

        const contentType = response.headers['content-type'] || 'image/png';
        const base64 = Buffer.from(response.data).toString('base64');
        pictureBase64 = `data:${contentType};base64,${base64}`;
      } catch {
        core.warning(`Failed to fetch avatar for ${user.username}, using placeholder`);
        pictureBase64 = this.getPlaceholderAvatar();
      }

      results.push({
        ...user,
        pictureBase64,
      });
    }

    return results;
  }

  private getPlaceholderAvatar(): string {
    // Simple gray circle placeholder as base64 SVG
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#e1e4e8"/>
      <circle cx="50" cy="40" r="18" fill="#959da5"/>
      <ellipse cx="50" cy="85" rx="28" ry="22" fill="#959da5"/>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(placeholderSvg).toString('base64')}`;
  }

  private renderContributor(user: UserWithBase64, x: number, y: number, size: number): string {
    const centerX = x + size / 2;
    const textY = y + size + 30;
    const usernameY = textY + 20;
    const wordsY = usernameY + 20;
    const languagesY = wordsY + this.LANGUAGES_LINE_HEIGHT;
    const words = +user.translated + +user.approved;

    const clipPathId = `clip-${user.id}`;
    const profileUrl = this.getProfileUrl(user.username);

    const { displayName, usernameDisplay } = formatUserName(user.name, user.username);

    const escapedDisplayName = this.escapeXml(displayName);
    const escapedUsername = this.escapeXml(usernameDisplay);
    const escapedFullName = this.escapeXml(user.name);

    let content = `
    <g class="contributor">
      <defs>
        <clipPath id="${clipPathId}">
          <circle cx="${centerX}" cy="${y + size / 2}" r="${size / 2}"/>
        </clipPath>
      </defs>`;

    if (profileUrl) {
      content += `
      <a xlink:href="${profileUrl}" target="_blank">
        <title>${escapedFullName}</title>
        <image 
          x="${x}" 
          y="${y}" 
          width="${size}" 
          height="${size}" 
          xlink:href="${user.pictureBase64}"
          clip-path="url(#${clipPathId})"
          preserveAspectRatio="xMidYMid slice"
        />
        <text x="${centerX}" y="${textY}" class="name">${escapedDisplayName}</text>
        <text x="${centerX}" y="${usernameY}" class="username">${escapedUsername}</text>
        <text x="${centerX}" y="${wordsY}" class="words">${words.toLocaleString()} words</text>${this.renderLanguages(user, centerX, languagesY, size)}
      </a>`;
    } else {
      content += `
      <title>${escapedFullName}</title>
      <image 
        x="${x}" 
        y="${y}" 
        width="${size}" 
        height="${size}" 
        xlink:href="${user.pictureBase64}"
        clip-path="url(#${clipPathId})"
        preserveAspectRatio="xMidYMid slice"
      />
      <text x="${centerX}" y="${textY}" class="name">${escapedDisplayName}</text>`;

      // Only show username if it exists
      if (escapedUsername) {
        content += `
      <text x="${centerX}" y="${usernameY}" class="username">${escapedUsername}</text>
      <text x="${centerX}" y="${wordsY}" class="words">${words.toLocaleString()} words</text>${this.renderLanguages(user, centerX, languagesY, size)}`;
      } else {
        // If no username, show words directly below name
        content += `
      <text x="${centerX}" y="${usernameY}" class="words">${words.toLocaleString()} words</text>${this.renderLanguages(user, centerX, wordsY, size)}`;
      }
    }

    content += `
    </g>`;

    return content;
  }

  private renderLanguages(user: User, centerX: number, y: number, size: number): string {
    if (!this.config.includeLanguages || !user.languages || user.languages.length === 0) {
      return '';
    }

    const cellWidth = size + this.CELL_PADDING * 2;
    const maxChars = Math.floor(cellWidth / this.LANGUAGES_CHAR_WIDTH);

    const ids = user.languages.map((language: Language) => language.id);

    // Fit as many language ids as possible into the cell, the rest is shown as "+N"
    let shown = 1;
    while (shown < ids.length && ids.slice(0, shown + 1).join(', ').length <= maxChars) {
      shown++;
    }

    let display = ids.slice(0, shown).join(', ');
    if (shown < ids.length) {
      display += ` +${ids.length - shown}`;
    }

    const title = user.languages.map((language: Language) => language.name).join(', ');

    return `
      <text x="${centerX}" y="${y}" class="languages"><title>${this.escapeXml(title)}</title>${this.escapeXml(display)}</text>`;
  }

  private getProfileUrl(username: string): string | null {
    if (this.credentials.organization) {
      return null;
    }
    return `https://crowdin.com/profile/${username}`;
  }

  private renderSvg(width: number, height: number, contributors: string): string {
    let projectLink = '';
    if (this.config.crowdinProjectLink.length > 0) {
      const linkY = height + 25;
      projectLink = `
  <a xlink:href="${this.config.crowdinProjectLink}" target="_blank">
    <text x="${width / 2}" y="${linkY}" class="project-link">Translate in Crowdin 🚀</text>
  </a>`;
      height += 40;
    }

    return `<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>
  <style>
    .contributor { cursor: pointer; }
    .name {
      font-size: 14px;
      font-family: ${this.FONT_FAMILY};
      font-weight: bold;
      fill: #6B6B6C;
      text-anchor: middle;
    }
    .username {
      font-size: 14px;
      font-family: ${this.FONT_FAMILY};
      font-weight: bold;
      fill: #6B6B6C;
      text-anchor: middle;
    }
    .words {
      font-size: 14px;
      font-family: ${this.FONT_FAMILY};
      font-weight: bold;
      fill: #6B6B6C;
      text-anchor: middle;
    }
    .languages {
      font-size: 12px;
      font-family: ${this.FONT_FAMILY};
      fill: #6B6B6C;
      text-anchor: middle;
    }
    .project-link {
      font-size: 14px;
      font-family: ${this.FONT_FAMILY};
      fill: #3b82f6;
      text-anchor: middle;
    }
    .project-link:hover {
      text-decoration: underline;
    }
  </style>
  ${contributors}${projectLink}
</svg>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
