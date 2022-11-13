import crowdin from '@crowdin/crowdin-api-client';
import axios from 'axios';
import * as fs from 'fs';
import * as core from '@actions/core';
import {ContributorsTableConfig, CredentialsConfig} from './config';
import {wait} from './wait';

export interface User {
    id: number;
    username: string;
    name: string;
    translated: string;
    approved: string;
    picture: string;
}

export class Contributors {
    private credentials: CredentialsConfig;
    private config: ContributorsTableConfig;

    constructor(credentials: CredentialsConfig, config: ContributorsTableConfig) {
        this.credentials = credentials;
        this.config = config;
    }

    public async generate(): Promise<void> {
        this.validateFiles();

        await this.getReport();
    }

    private async getReport(): Promise<void> {
        core.info('Downloading the report...');

        const {reportsApi} = new crowdin({
            token: this.credentials.token,
            organization: this.credentials.organization
        });

        let report;
        try {
            report = await reportsApi.generateReport(this.credentials.projectId, {
                name: 'top-members',
                schema: {
                    unit: 'words',
                    format: 'json'
                }
            });
        } catch (e) {
            Contributors.throwError('Cannot generate report', e);
        }

        while (true) {
            try {
                const reportStatus = await reportsApi.checkReportStatus(
                    this.credentials.projectId,
                    report.data.identifier
                );

                if (reportStatus.data.status === 'finished') {
                    const reportJSON = await reportsApi.downloadReport(
                        this.credentials.projectId,
                        report.data.identifier
                    );

                    const results = await axios.get(reportJSON.data.url);

                    await this.prepareData(results);

                    break;
                }
            } catch (e) {
                Contributors.throwError('Cannot download report', e);
            }

            await wait(2000);
        }
    }

    private async prepareData(report: any): Promise<void> {
        const {usersApi} = new crowdin({
            token: this.credentials.token,
            organization: this.credentials.organization
        });

        let result: User[] = [];

        for (let i in report.data.data) {
            const user = report.data.data[i];

            if (user.username === 'REMOVED_USER') {
                continue;
            }

            if (
                this.config.minWordsContributed !== null &&
                +user.translated + +user.approved < this.config.minWordsContributed
            ) {
                continue;
            }

            let picture;

            try {
                const crowdinMember = await usersApi.getProjectMemberPermissions(
                    this.credentials.projectId,
                    user.user.id
                );

                picture = crowdinMember.data.avatarUrl;
            } catch (e) {
                //the account might be private, that produces 404 exception
                picture = 'https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1';
            }

            result.push({
                id: user.user.id,
                username: user.user.username,
                name: user.user.fullName,
                translated: user.translated,
                approved: user.approved,
                picture: picture
            });

            if (result.length === this.config.maxContributors) {
                break;
            }
        }

        this.renderReport(result);
    }

    private renderReport(report: any[]): void {
        let result = [];
        let html = '';

        for (let i = 0; i < report.length; i += this.config.contributorsPerLine) {
            result.push(report.slice(i, i + this.config.contributorsPerLine));
        }

        html = `<table>`;

        for (let i in result) {
            html += '<tr>';
            for (let j in result[i]) {
                // TODO: imageSize
                let tda = `<img alt="logo" style="width: 100px" src="${result[i][j].picture}"/>`;

                if (!this.credentials.organization) {
                    tda = `<a href="https://crowdin.com/profile/${result[i][j].username}">${tda}</a>`;
                }

                html += `<td style="text-align:center; vertical-align: top;">
                  ${tda}
                  <br />
                  <sub><b>${result[i][j].name}</b></sub>
                  <br />
                  <sub><b>${+result[i][j].translated + +result[i][j].approved} words</b></sub>
              </td>`;
            }
            html += '</tr>';
        }
        html += '</table>';

        core.info(`Writing result to ${this.config.files.join(', ')}`);

        this.config.files.map((file: string) => {
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

            fileContents = fileContents.slice(0, sliceFrom) + '\n' + html + '\n' + fileContents.slice(sliceTo);

            fs.writeFileSync(file, fileContents);
        });
    }

    private validateFiles(): void {
        core.info('Validating files...');

        const files = this.config.files.filter((file: string) => {
            if (!fs.existsSync(file)) {
                core.warning(`The file ${file} does not exist!`);

                return false;
            }

            return true;
        });

        if (files.length === 0) {
            throw Error("Can't find any acceptable file!");
        }

        this.config.files = files;
    }

    private static throwError(message: string, e: any): never {
        let finalMessage = message;

        if (core.isDebug() && e.message) {
            finalMessage += `. Message: ${e.message}`;
        }

        throw new Error(finalMessage);
    }
}
