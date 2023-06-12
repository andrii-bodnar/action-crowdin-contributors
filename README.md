[<p align='center'><img src='/docs/logo.png' width='150' height='150' align='center'/></p>](https://github.com/andrii-bodnar/action-crowdin-contributors)

# Crowdin Contributors [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fandrii-bodnar%2Faction-crowdin-contributors&text=A%20GitHub%20action%20to%20automate%20acknowledging%20translators%20and%20proofreaders%20to%20your%20projects%20in%20Crowdin%20%E2%9C%A8)&nbsp;[![GitHub Repo stars](https://img.shields.io/github/stars/andrii-bodnar/action-crowdin-contributors?style=social&cacheSeconds=1800)](https://github.com/andrii-bodnar/action-crowdin-contributors/stargazers)

A GitHub action to automate acknowledging translators and proofreaders to your projects ✨

[![Check dist](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/check-dist.yml/badge.svg)](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/check-dist.yml)
[![build-test](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/test.yml/badge.svg)](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/test.yml)
[![e2e-test](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/e2eTest.yml/badge.svg)](https://github.com/andrii-bodnar/action-crowdin-contributors/actions/workflows/e2eTest.yml)
[![codecov](https://codecov.io/gh/andrii-bodnar/action-crowdin-contributors/branch/main/graph/badge.svg?token=7DCRZSABQP)](https://codecov.io/gh/andrii-bodnar/action-crowdin-contributors)

## What does this action do?

This action downloads the Top Members report and generates or updates a contributors' table in your project based on this report and the action configuration.

## Usage

Set up a workflow in *.github/workflows/crowdin-contributors.yml* (or add a job to your existing workflows).

Read the [Configuring a workflow](https://help.github.com/en/articles/configuring-a-workflow) article for more details on how to create and set up custom workflows.

```yaml
name: Crowdin Contributors Action

on:
  # When you push to the `main` branch
  push:
    branches: [ main ]
  # And optionally, once every 12 hours
  schedule:
    - cron: '0 */12 * * *' # https://crontab.guru/#0_*/12_*_*_*
  # To manually run this workflow
  workflow_dispatch:

jobs:
  crowdin-contributors:

    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Generate Crowdin Contributors table
      uses: andrii-bodnar/action-crowdin-contributors@v1
      with:
        contributors_per_line: 8
        max_contributors: 32
        image_size: 64
        min_words_contributed: 256
      env:
        CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
        CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
        CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional. Only for Crowdin Enterprise
```

### Creating a PR

To create a PR with the updated table, we recommend usage of the [Create Pull Request](https://github.com/peter-evans/create-pull-request) Action:

```yaml
name: Crowdin Contributors Action

on:
  # When you push to the `main` branch
  push:
    branches: [ main ]
  # And optionally, once every 12 hours
  schedule:
    - cron: '0 */12 * * *' # https://crontab.guru/#0_*/12_*_*_*
  # To manually run this workflow
  workflow_dispatch:

jobs:
  crowdin-contributors:

    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Generate Crowdin Contributors table
      uses: andrii-bodnar/action-crowdin-contributors@v1
      with:
        contributors_per_line: 8
        max_contributors: 32
        image_size: 64
        min_words_contributed: 256
      env:
        CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
        CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
        CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional. Only for Crowdin Enterprise

    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v4
      with:
        title: Update Crowdin Contributors table
        body: By [action-crowdin-contributors](https://github.com/andrii-bodnar/action-crowdin-contributors) GitHub action
        commit-message: Update Crowdin Contributors table
        committer: Crowdin Bot <support+bot@crowdin.com>
        branch: crowdin-contributors/patch
```

## Options

| Option                  | Default value                         | Description                                                      |
|-------------------------|---------------------------------------|------------------------------------------------------------------|
| `max_contributors`      | 30                                    | Only the specified amount of contributors will be shown          |
| `min_words_contributed` | 100                                   | Minimum words contributed (both translated and approved)         |
| `contributors_per_line` | 7                                     | Maximum number of columns for the contributors table             |
| `image_size`            | 100                                   | Size (in px) of the user's avatar                                |
| `files`                 | README.md                             | Array of files to update                                         |
| `crowdin_project_link`  |                                       | Crowdin project link will be added after the contributors' table |
| `include_languages`     | false                                 | Specifies whether to include contributed languages in table      |
| `placeholder_start`     | `<!-- CROWDIN-CONTRIBUTORS-START -->` | Placeholder that marks the start of the contributors table       |
| `placeholder_end`       | `<!-- CROWDIN-CONTRIBUTORS-END -->`   | Placeholder that marks the end of the contributors table         |

## Outputs

This actions provides the following outputs that can be used by other steps in your workflow:

| Output               | Description                                          |
|----------------------|------------------------------------------------------|
| `contributors_table` | Generated table with contributors                    |
| `json_report`        | JSON report with contributors used to render a table |

## Demo

The resulting table will look like this:

![demo](docs/demo.png)

**Note:** it's just a test, in real use, it will display actual user's avatars.

Example PR - [#6](https://github.com/andrii-bodnar/action-crowdin-contributors/pull/6)

In addition, the contributors' table will be added as a summary to the workflow job run.

## Contributing

If you want to contribute please read the [Contributing](/CONTRIBUTING.md) guidelines.

## Author

- [Andrii Bodnar](https://github.com/andrii-bodnar/)

## License

<pre>
The Crowdin Contributors Action is licensed under the MIT License.
See the LICENSE.md file distributed with this work for additional
information regarding copyright ownership.

Except as contained in the LICENSE file, the name(s) of the above copyright
holders shall not be used in advertising or otherwise to promote the sale,
use or other dealings in this Software without prior written authorization.
</pre>
