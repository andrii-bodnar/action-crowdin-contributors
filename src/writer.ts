import * as core from '@actions/core';
import fs from 'fs';
import pretty from 'pretty';
import {ContributorsTableConfig, CredentialsConfig} from './config';

export class Writer {
    private credentials: CredentialsConfig;
    private config: ContributorsTableConfig;
    private tableContent = '';

    private PROJECT_LINK_TEXT = 'Translate in Crowdin 🚀';

    constructor(credentials: CredentialsConfig, config: ContributorsTableConfig) {
        this.credentials = credentials;
        this.config = config;
    }

    public getTableContent(): string {
        return this.tableContent;
    }

    public updateContributorsTable(report: any[]): void {
        core.info(`Rendering table with ${report.length} contributor(s)...`);

        const tableContent = this.renderReport(report);
        this.writeFiles(tableContent);

        this.tableContent = tableContent;

        this.addJobSummary();

        core.info('The contributors table successfully updated!');
    }

    private renderReport(report: any[]): string {
        let result = [];
        let html = '<table>';

        for (let i = 0; i < report.length; i += this.config.contributorsPerLine) {
            result.push(report.slice(i, i + this.config.contributorsPerLine));
        }

        for (let i in result) {
            html += '<tr>';

            for (let j in result[i]) {
                let userData = `<img alt="logo" style="width: ${this.config.imageSize}px" src="${result[i][j].picture}"/>
                    <br />
                    <sub><b>${result[i][j].name}</b></sub>`;

                if (!this.credentials.organization) {
                    userData = `<a href="https://crowdin.com/profile/${result[i][j].username}">${userData}</a>`;
                }

                html += `<td align="center" valign="top">
                  ${userData}
                  <br />
                  <sub><b>${+result[i][j].translated + +result[i][j].approved} words</b></sub>
              </td>`;
            }

            html += '</tr>';
        }

        html += '</table>';

        if (this.config.crowdinProjectLink.length > 0) {
            html += `<a href="${this.config.crowdinProjectLink}" target="_blank">${this.PROJECT_LINK_TEXT}</a>`;
        }

        return pretty(html);
    }

    private writeFiles(tableContent: string): void {
        this.config.files.map((file: string) => {
            core.info(`Writing result to ${file}`);

            let fileContents = fs.readFileSync(file).toString();

            if (
                !fileContents.includes(this.config.placeholderStart) ||
                !fileContents.includes(this.config.placeholderEnd)
            ) {
                core.warning(`Unable to locate start or end tag in ${file}`);
                return;
            }

            const sliceFrom = fileContents.indexOf(this.config.placeholderStart) + this.config.placeholderStart.length;
            const sliceTo = fileContents.indexOf(this.config.placeholderEnd);

            fileContents = `${fileContents.slice(0, sliceFrom)}\n${tableContent}\n${fileContents.slice(sliceTo)}`;

            core.debug(fileContents);
            fs.writeFileSync(file, fileContents);
        });
    }

    private async addJobSummary(): Promise<void> {
        core.info('Writing summary...');

        await core.summary.addHeading('Crowdin Contributors ✨').addRaw(this.tableContent).write();
    }
}
