"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Writer = void 0;
const fs_1 = __importDefault(require("fs"));
const pretty_1 = __importDefault(require("pretty"));
class Writer {
    credentials;
    config;
    logger;
    tableContent = '';
    PROJECT_LINK_TEXT = 'Translate in Crowdin 🚀';
    constructor(credentials, config, logger) {
        this.credentials = credentials;
        this.config = config;
        this.logger = logger;
    }
    getTableContent() {
        return this.tableContent;
    }
    setTableContent(tableContent) {
        this.tableContent = tableContent;
    }
    updateContributorsTable(report) {
        this.logger.log('info', `Rendering table with ${report.length} contributor(s)...`);
        const tableContent = this.renderReport(report);
        this.writeFiles(tableContent);
        this.tableContent = tableContent;
        this.logger.log('info', 'The contributors table successfully updated!');
    }
    renderReport(report) {
        const result = [];
        let html = '<table><tbody>';
        for (let i = 0; i < report.length; i += this.config.contributorsPerLine) {
            result.push(report.slice(i, i + this.config.contributorsPerLine));
        }
        for (const i in result) {
            html += '<tr>';
            for (const j in result[i]) {
                let userData = `<img alt="logo" style="width: ${this.config.imageSize}px" src="${result[i][j].picture}"/>
                    <br />
                    <sub><b>${result[i][j].name}</b></sub>`;
                if (!this.credentials.organization) {
                    userData = `<a href="https://crowdin.com/profile/${result[i][j].username}">${userData}</a>`;
                }
                const languages = this.formatLanguages(result[i][j]);
                html += `<td align="center" valign="top">
                  ${userData}
                  <br />
                  <sub><b>${+result[i][j].translated + +result[i][j].approved} words</b></sub>${languages}
              </td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        if (this.config.crowdinProjectLink.length > 0) {
            html += `<a href="${this.config.crowdinProjectLink}" target="_blank">${this.PROJECT_LINK_TEXT}</a>`;
        }
        return (0, pretty_1.default)(html);
    }
    formatLanguages(userData) {
        if (!this.config.includeLanguages || !userData.languages || userData.languages.length === 0) {
            return '';
        }
        const languages = [];
        userData.languages.map((language) => {
            languages.push(`<b><code title="${language.name}">${language.id}</code></b>`);
        });
        return `\n<br /><sub>${languages.join(', ')}</sub>`;
    }
    writeFiles(tableContent) {
        this.config.files.map((file) => {
            this.logger.log('info', `Writing result to ${file}`);
            let fileContents = fs_1.default.readFileSync(file).toString();
            if (!fileContents.includes(this.config.placeholderStart) ||
                !fileContents.includes(this.config.placeholderEnd)) {
                this.logger.log('warning', `Unable to locate start or end tag in ${file}`);
                return;
            }
            const sliceFrom = fileContents.indexOf(this.config.placeholderStart) + this.config.placeholderStart.length;
            const sliceTo = fileContents.indexOf(this.config.placeholderEnd);
            fileContents = `${fileContents.slice(0, sliceFrom)}\n${tableContent}\n${fileContents.slice(sliceTo)}`;
            this.logger.log('debug', fileContents);
            fs_1.default.writeFileSync(file, fileContents);
        });
    }
}
exports.Writer = Writer;
