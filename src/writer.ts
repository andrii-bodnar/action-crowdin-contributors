import fs from 'fs';
import pretty from 'pretty';
import {ContributorsTableConfig, CredentialsConfig} from './config';
import {Language, User} from './contributors';
import {Logger} from './logger';

export class Writer {
    private credentials: CredentialsConfig;
    private config: ContributorsTableConfig;
    private logger: Logger;
    private tableContent = '';

    private PROJECT_LINK_TEXT = 'Translate in Crowdin 🚀';

    constructor(credentials: CredentialsConfig, config: ContributorsTableConfig, logger: Logger) {
        this.credentials = credentials;
        this.config = config;
        this.logger = logger;
    }

    public getTableContent(): string {
        return this.tableContent;
    }

    public setTableContent(tableContent: string): void {
        this.tableContent = tableContent;
    }

    public updateContributorsTable(report: any[]): void {
        this.logger.log('info', `Rendering table with ${report.length} contributor(s)...`);

        const tableContent = this.renderReport(report);
        this.writeFiles(tableContent);

        this.tableContent = tableContent;

        this.logger.log('info', 'The contributors table successfully updated!');
    }

    public renderReport(report: any[]): string {
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
                  <sub><b>${+result[i][j].translated + +result[i][j].approved} words</b></sub>${this.formatLanguages(result[i][j])}
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

    public formatLanguages(userData: User): string {
        if (!this.config.includeLanguages || !userData.languages || userData.languages.length === 0) {
            return '';
        }

        let languages: string[] = [];

        userData.languages.map((language: Language) => {
            languages.push(`<b><code title="${language.name}">${language.id}</code></b>`);
        });

        return `\n<br /><sub>${languages.join(', ')}</sub>`;
    }

    public writeFiles(tableContent: string): void {
        this.config.files.map((file: string) => {
            this.logger.log('info', `Writing result to ${file}`);

            let fileContents = fs.readFileSync(file).toString();

            if (
                !fileContents.includes(this.config.placeholderStart) ||
                !fileContents.includes(this.config.placeholderEnd)
            ) {
                this.logger.log('warning', `Unable to locate start or end tag in ${file}`);
                return;
            }

            const sliceFrom = fileContents.indexOf(this.config.placeholderStart) + this.config.placeholderStart.length;
            const sliceTo = fileContents.indexOf(this.config.placeholderEnd);

            fileContents = `${fileContents.slice(0, sliceFrom)}\n${tableContent}\n${fileContents.slice(sliceTo)}`;

            this.logger.log('debug', fileContents);
            fs.writeFileSync(file, fileContents);
        });
    }
}
