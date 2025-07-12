"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contributors = void 0;
const crowdin_api_client_1 = __importDefault(require("@crowdin/crowdin-api-client"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const util = __importStar(require("util"));
const core = __importStar(require("@actions/core"));
const wait_1 = require("./wait");
const writer_1 = require("./writer");
const logger_1 = require("./logger");
class Contributors {
    credentials;
    config;
    writer;
    constructor(credentials, config) {
        this.credentials = credentials;
        this.config = config;
        this.writer = new writer_1.Writer(credentials, config, new logger_1.Logger());
    }
    async generate() {
        this.validateFiles();
        const reportResults = await this.downloadReport();
        core.info(`Found ${reportResults.length} user(s), preparing the data...`);
        const preparedData = await this.prepareData(reportResults);
        this.writer.updateContributorsTable(preparedData);
        await this.addJobSummary(this.writer.getTableContent());
        core.setOutput('contributors_table', this.writer.getTableContent());
        core.setOutput('json_report', JSON.stringify(preparedData));
    }
    async downloadReport() {
        core.info('Downloading the report...');
        const { reportsApi } = new crowdin_api_client_1.default({
            token: this.credentials.token,
            organization: this.credentials.organization,
        });
        let report;
        try {
            report = await reportsApi.generateReport(this.credentials.projectId, {
                name: 'top-members',
                schema: {
                    unit: 'words',
                    format: 'json',
                },
            });
        }
        catch (e) {
            Contributors.throwError('Cannot generate report', e);
        }
        let progress = 0;
        while (true) {
            try {
                core.info(`Checking report generation status ${progress}%...`);
                const reportStatus = await reportsApi.checkReportStatus(this.credentials.projectId, report.data.identifier);
                progress = +reportStatus.data.progress;
                if (reportStatus.data.status === 'finished') {
                    core.info('Downloading report...');
                    const reportJSON = await reportsApi.downloadReport(this.credentials.projectId, report.data.identifier);
                    const results = await axios_1.default.get(reportJSON.data.url);
                    core.info('Successfully downloaded!');
                    return results.data.data;
                }
            }
            catch (e) {
                Contributors.throwError('Cannot download report', e);
            }
            await (0, wait_1.wait)(2000);
        }
    }
    async prepareData(report) {
        const { usersApi } = new crowdin_api_client_1.default({
            token: this.credentials.token,
            organization: this.credentials.organization,
        });
        const result = [];
        for (const i in report) {
            const user = report[i];
            if (user.user.username === 'REMOVED_USER') {
                continue;
            }
            if (this.config.minWordsContributed !== null &&
                +user.translated + +user.approved < this.config.minWordsContributed) {
                continue;
            }
            let picture = 'https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1';
            if ('avatarUrl' in user.user) {
                picture = user.user.avatarUrl;
            }
            try {
                const crowdinMember = await usersApi.getProjectMemberPermissions(this.credentials.projectId, user.user.id);
                if ('avatarUrl' in crowdinMember.data && crowdinMember.data.avatarUrl) {
                    picture = crowdinMember.data.avatarUrl;
                }
            }
            catch {
                //the account might be private, that produces 404 exception
            }
            result.push({
                id: user.user.id,
                username: user.user.username,
                name: user.user.fullName,
                translated: user.translated,
                approved: user.approved,
                picture: picture,
                languages: user.languages,
            });
            if (result.length === this.config.maxContributors) {
                break;
            }
        }
        return result;
    }
    validateFiles() {
        core.info('Validating files...');
        const files = this.config.files.filter((file) => {
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
    async addJobSummary(content) {
        core.info('Writing summary...');
        await core.summary.addHeading('Crowdin Contributors ✨').addRaw(content).write();
    }
    static throwError(message, e) {
        let finalMessage = message;
        if (core.isDebug() && e.message) {
            finalMessage += `. Message: ${util.inspect(e, true, 8)}`;
        }
        throw new Error(finalMessage);
    }
}
exports.Contributors = Contributors;
