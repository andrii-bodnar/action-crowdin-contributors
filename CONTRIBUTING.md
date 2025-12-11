# Contributing

:tada: First off, thanks for taking the time to contribute! :tada:

The following is a set of guidelines for contributing to Crowdin Contributors Action. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

This project and everyone participating in it are governed by the [Code of Conduct](/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How can I contribute?

### Star this repo

It's quick and goes a long way! :stars:

### Reporting Bugs

When you are creating a bug report, please include as many details as possible.

#### How Do I Submit a Bug Report?

Bugs are tracked as [GitHub issues](https://github.com/andrii-bodnar/action-crowdin-contributors/issues/).

Explain the problem and include additional details to help maintainers reproduce the problem:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible. Don't just say what you did, but explain how you did it.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**

### Suggesting Enhancements

When you are creating an enhancement suggestion, please include as many details as possible including the steps that you imagine you would take if the feature you're requesting existed.

#### How Do I Submit an Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/andrii-bodnar/action-crowdin-contributors/issues/).

Create an issue on that repository and provide the following information:

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Explain why this enhancement would be useful** to most Crowdin Contributors Action users.

### Your First Code Contribution

Unsure where to begin contributing to Crowdin Contributors Action? You can start by looking through these `good-first-issue` and `help-wanted` issues:

- [Good first issue](https://github.com/andrii-bodnar/action-crowdin-contributors/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) - issues which should only require a small amount of code, and a test or two.
- [Help wanted](https://github.com/andrii-bodnar/action-crowdin-contributors/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) - issues which should be a bit more involved than `Good first issue` issues.

#### Pull Request Checklist

Before sending your pull requests, make sure you followed the list below:

- Read these guidelines.
- Read [Code of Conduct](/CODE_OF_CONDUCT.md).
- Ensure that your code adheres to standard conventions, as used in the rest of the project.
- Ensure that your changes are well tested.
- Ensure that your changes is covered by Unit tests.

## Development

> You'll need to have a reasonably modern version of [Node.js](https://nodejs.org) handy (20.x or later should work!).

Install the dependencies

```bash
npm install
```

Build the TypeScript and package it for distribution

```bash
npm run bundle
```

Run the tests :heavy_check_mark:

```bash
npm test
```

Format, test, and package the action

```bash
npm run all
```

> [!IMPORTANT]
>
> This step is important! It will run [`rollup`](https://rollupjs.org/) to
> build the final JavaScript action code with all dependencies included. If
> you do not run this step, your action will not work correctly when it is
> used in a workflow.

### Local Testing

The [`@github/local-action`](https://github.com/github/local-action) utility can be used to test the action locally.

First, initialize environment variables:

```bash
cp .env.example .env
```

Then, create a local test file:

```bash
cp __tests__/files/contributors.md local-action.md
```

Finally, run the action locally:

```bash
npm run local-action
```

You can now see the result in the `local-action.md` file. You can also view the summary in the `local-summary.md` file, which represents the GitHub step summary.

### Change action.yml

The `action.yml` file defines the inputs and output for your action.

Update the `action.yml` file with your name, description, inputs and outputs for your action.

See the [documentation](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)

### Change the Code

Most GitHub Actions toolkit and CI/CD operations are processed asynchronously. In `main.ts`, you will see that the action is run in an `async` function.

```javascript
import * as core from '@actions/core';
//...

async function run() {
  try {
    //...
  } catch (error) {
    core.setFailed(error.message);
  }
}
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/main/README.md#packages) for the various packages.

### Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
  with:
    max_contributors: 10
    min_words_contributed: 0
    placeholder_start: '<!-- TEST-CONTRIBUTORS-START -->'
    placeholder_end: '<!-- TEST-CONTRIBUTORS-END -->'
    files: ./__tests__/files/contributors.md
  env:
    CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
```

See the [actions tab](https://github.com/andrii-bodnar/action-crowdin-contributors/actions) for runs of this action! :rocket:
