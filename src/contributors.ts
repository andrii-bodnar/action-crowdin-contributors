import crowdin from '@crowdin/crowdin-api-client';
import axios from 'axios';
import * as fs from 'fs';
import * as util from 'util';
import * as core from '@actions/core';
import {ContributorsTableConfig, CredentialsConfig} from './config';
import {wait} from './wait';
import {Writer} from './writer';

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
    private writer: Writer;

    constructor(credentials: CredentialsConfig, config: ContributorsTableConfig) {
        this.credentials = credentials;
        this.config = config;

        this.writer = new Writer(credentials, config);
    }

    public async generate(): Promise<void> {
        this.validateFiles();

        const reportResults = await this.downloadReport();

        core.info(`Found ${reportResults.length} user(s), preparing the data...`);

        const preparedData = await this.prepareData(reportResults);

        this.writer.updateContributorsTable(preparedData);

        core.setOutput('contributors_table', this.writer.getTableContent());
    }

    private async downloadReport(): Promise<any[]> {
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

        let progress = 0;
        while (true) {
            try {
                core.info(`Checking report generation status ${progress}%...`);

                const reportStatus = await reportsApi.checkReportStatus(
                    this.credentials.projectId,
                    report.data.identifier
                );

                progress = +reportStatus.data.progress;

                if (reportStatus.data.status === 'finished') {
                    core.info('Downloading report...');

                    const reportJSON = await reportsApi.downloadReport(
                        this.credentials.projectId,
                        report.data.identifier
                    );

                    const results = await axios.get(reportJSON.data.url);

                    core.info('Successfully downloaded!');

                    return results.data.data;
                }
            } catch (e) {
                Contributors.throwError('Cannot download report', e);
            }

            await wait(2000);
        }
    }

    private async prepareData(report: any[]): Promise<User[]> {
        const {usersApi} = new crowdin({
            token: this.credentials.token,
            organization: this.credentials.organization
        });

        let result: User[] = [];

        for (let i in report) {
            const user = report[i];

            if (user.user.username === 'REMOVED_USER') {
                continue;
            }

            if (
                this.config.minWordsContributed !== null &&
                +user.translated + +user.approved < this.config.minWordsContributed
            ) {
                continue;
            }

            let picture = 'https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1';

            try {
                const crowdinMember = await usersApi.getProjectMemberPermissions(
                    this.credentials.projectId,
                    user.user.id
                );

                if (crowdinMember.data.avatarUrl) {
                    picture = crowdinMember.data.avatarUrl;
                }
            } catch (e) {
                //the account might be private, that produces 404 exception
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

        return result;
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
            finalMessage += `. Message: ${util.inspect(e, true, 8)}`;
        }

        throw new Error(finalMessage);
    }
}
