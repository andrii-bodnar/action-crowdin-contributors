# Crowdin Contributors

A GitHub action to automate acknowledging translators and proofreaders to your open-source projects in Crowdin

## What does this action do?

## Usage

Set up a workflow in *.github/workflows/crowdin-contributors.yml* (or add a job to your existing workflows).

Read the [Configuring a workflow](https://help.github.com/en/articles/configuring-a-workflow) article for more details on how to create and set up custom workflows.

```yaml
name: Crowdin Contributors Action

on:
  push:
    branches: [ main ]

jobs:
  crowdin-contributors:

    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Generating Crowdin Contributors table
      uses: andrii-bodnar/action-crowdin-contributors@0.0.1
      with:
        contributors_per_line: 8
        max_contributors: 32
        image_size: 64
        min_words_contributed: 256

      env:
        GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
        CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
        CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
        CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }}
```
 
[//]: # (TODO: add pr options)

## Options

| Option                  | Default value                         | Description                                                |
|-------------------------|---------------------------------------|------------------------------------------------------------|
| `max_contributors`      | 30                                    | Only the specified amount of contributors will be shown    |
| `min_words_contributed` | 100                                   | Minimum words contributed (both translated and approved)   |
| `contributors_per_line` | 7                                     | Maximum number of columns for the contributors table       |
| `image_size`            | 100                                   | Size (in px) of the user's avatar                          |
| `files`                 | README.md                             | Array of files to update                                   |
| `placeholder_start`     | `<!-- CROWDIN-CONTRIBUTORS-START -->` | Placeholder that marks the start of the contributors table |
| `placeholder_end`       | `<!-- CROWDIN-CONTRIBUTORS-END -->`   | Placeholder that marks the end of the contributors table   |

