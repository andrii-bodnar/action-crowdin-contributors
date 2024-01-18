import {Writer} from '../src/writer';
import {jest, expect, describe, beforeEach, afterEach, it} from '@jest/globals';
import {ContributorsTableConfig, CredentialsConfig} from '../src/config';
import {User} from '../src/contributors';
import {Logger} from '../src/logger';

const fs = require('fs');

jest.mock('fs');

describe('Writer', () => {
    let writer: Writer;
    let credentials: CredentialsConfig;
    let config: ContributorsTableConfig;
    let logger = {
        log: (type, message) => {}
    } as Logger;

    beforeEach(() => {
        credentials = {
            projectId: 1,
            token: 'token',
            organization: 'organization'
        };
        config = {
            maxContributors: 10,
            minWordsContributed: 10,
            contributorsPerLine: 5,
            imageSize: 100,
            crowdinProjectLink: 'https://crowdin.com/project',
            includeLanguages: true,
            files: ['README.md'],
            placeholderStart: '<!-- CROWDIN-CONTRIBUTORS-START -->',
            placeholderEnd: '<!-- CROWDIN-CONTRIBUTORS-END -->'
        };
        writer = new Writer(credentials, config, logger);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('setTableContent and getTableContent', () => {
        it('should return the table content', () => {
            const content = '<table>...</table>';

            writer.setTableContent(content);
            expect(writer.getTableContent()).toBe(content);
        });
    });

    describe('updateContributorsTable', () => {
        let report: any;
        let renderReportMock: any;
        let writeFilesMock: any;
        let logMock: any;
        let fsWriteFileSyncMock: any;

        beforeEach(() => {
            report = [{}];
            renderReportMock = jest.spyOn(writer, 'renderReport');
            writeFilesMock = jest.spyOn(writer, 'writeFiles');
            logMock = jest.spyOn(logger, 'log');
            fsWriteFileSyncMock = jest.spyOn(fs, 'writeFileSync');
        });

        it('should update the contributors table and set the table content', () => {
            const fileContent = `### Contributors

<!-- CROWDIN-CONTRIBUTORS-START -->
<!-- CROWDIN-CONTRIBUTORS-END -->

### License
MIT`;

            const expectedFileContent = `### Contributors

<!-- CROWDIN-CONTRIBUTORS-START -->
<table>...</table>
<!-- CROWDIN-CONTRIBUTORS-END -->

### License
MIT`;

            fs.readFileSync.mockReturnValue(fileContent);
            renderReportMock.mockReturnValue('<table>...</table>');

            writer.updateContributorsTable(report);

            expect(renderReportMock).toHaveBeenCalledWith(report);
            expect(logMock).not.toHaveBeenCalledWith('warning', 'Unable to locate start or end tag in README.md');
            expect(writeFilesMock).toHaveBeenCalledWith('<table>...</table>');
            expect(writer.getTableContent()).toBe('<table>...</table>');
            expect(fs.writeFileSync).toHaveBeenCalledWith('README.md', expectedFileContent);
        });

        it('should log a warning message about missing placeholders', () => {
            const fileContent = `### Contributors`;

            fs.readFileSync.mockReturnValue(fileContent);
            renderReportMock.mockReturnValue('<table>...</table>');

            writer.updateContributorsTable(report);

            expect(renderReportMock).toHaveBeenCalledWith(report);
            expect(logMock).toHaveBeenCalledWith('warning', 'Unable to locate start or end tag in README.md');
            expect(writeFilesMock).toHaveBeenCalledWith('<table>...</table>');
            expect(writer.getTableContent()).toBe('<table>...</table>');
        });
    });

    describe('renderReport', () => {
        it('should render the report', () => {
            const report = [
                {
                    picture: 'picture1',
                    name: 'name1',
                    username: 'username1',
                    translated: '10',
                    approved: '5',
                    languages: []
                },
                {
                    picture: 'picture2',
                    name: 'name2',
                    username: 'username2',
                    translated: '20',
                    approved: '15',
                    languages: []
                }
            ];

            const expectedTableContent = `<table>
  <tr>
    <td align="center" valign="top">
      <img alt="logo" style="width: 100px" src="picture1" />
      <br />
      <sub><b>name1</b></sub>
      <br />
      <sub><b>15 words</b></sub>
    </td>
    <td align="center" valign="top">
      <img alt="logo" style="width: 100px" src="picture2" />
      <br />
      <sub><b>name2</b></sub>
      <br />
      <sub><b>35 words</b></sub>
    </td>
  </tr>
</table><a href="https://crowdin.com/project" target="_blank">Translate in Crowdin 🚀</a>`;

            expect(writer.renderReport(report)).toBe(expectedTableContent);
        });

        it('should render the report with languages for crowdin.com', () => {
            const report = [
                {
                    picture: 'https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1',
                    name: 'name1',
                    username: 'username1',
                    translated: '10',
                    approved: '100',
                    languages: [
                        {id: 'uk', name: 'Ukrainian'},
                        {id: 'et', name: 'Estonian'}
                    ]
                },
                {
                    picture: 'https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1',
                    name: 'name2',
                    username: 'username2',
                    translated: '20',
                    approved: '15',
                    languages: [
                        {id: 'fr', name: 'French'},
                        {id: 'de', name: 'German'}
                    ]
                }
            ];

            writer = new Writer({projectId: 1, token: 'token'}, config, logger);

            const expectedTableContent = `<table>
  <tr>
    <td align="center" valign="top">
      <a href="https://crowdin.com/profile/username1"><img alt="logo" style="width: 100px" src="https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1" />
        <br />
        <sub><b>name1</b></sub></a>
      <br />
      <sub><b>110 words</b></sub>
      <br /><sub><b><code title="Ukrainian">uk</code></b>, <b><code title="Estonian">et</code></b></sub>
    </td>
    <td align="center" valign="top">
      <a href="https://crowdin.com/profile/username2"><img alt="logo" style="width: 100px" src="https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1" />
        <br />
        <sub><b>name2</b></sub></a>
      <br />
      <sub><b>35 words</b></sub>
      <br /><sub><b><code title="French">fr</code></b>, <b><code title="German">de</code></b></sub>
    </td>
  </tr>
</table><a href="https://crowdin.com/project" target="_blank">Translate in Crowdin 🚀</a>`;

            expect(writer.renderReport(report)).toBe(expectedTableContent);
        });
    });

    describe('formatLanguages', () => {
        it('should format the languages list', () => {
            const userData: User = {
                id: 1,
                username: 'username',
                name: 'name',
                translated: '100',
                approved: '50',
                picture: 'picture',
                languages: [
                    {id: 'en', name: 'English'},
                    {id: 'fr', name: 'French'}
                ]
            };

            const result = writer.formatLanguages(userData);

            expect(result).toBe(
                `\n<br /><sub><b><code title="English">en</code></b>, <b><code title="French">fr</code></b></sub>`
            );
        });
    });
});
