const core = require ('@actions/core');
const exec = require('@actions/exec');
const axios = require('axios');
const fs = require('fs');

async function run() {
    try {

        const apiKey = core.getInput('jules-api-key', {required: true});
        const sourceName = core.getInput('source-name', {required: true});
        const branchName = core.getInput('branch-name', {required: true});
        const sessionPrompt =  core.getInput('session-prompt', {required: true});
        const endpoint = 'https://jules.googleapis.com/v1alpha/sessions';

        const headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key' : apiKey,
        };

        const body = {
            initialMessage: sessionPrompt,
            // sources: [`sources/github/${sourceName}`],
            sourceContexts: [{
                source: `sources/github/${sourceName}`,
                githubRepoContext: {
                    startingBranch: branchName,
                },
            }],
        };

        // Send Request to Jules API
        core.info('Sending request to Jules API...');
        const response = await axios.post(endpoint, body, {headers});

        // Handle the Response
        core.info('Session created successfully.');

        const patch = response.data.artifacts[0].changeSet.gitPatch.unidiffPatch;
        core.info(response.data.artifacts[0]);
        const suggestedMessage = response.data.artifacts[0].changeSet.gitPatch.suggestedCommitMessage;

        fs.writeFileSync('fix.patch', patch);

        await exec.exec('git', ['apply', 'fix.patch']);
        await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
        await exec.exec('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);

        const finalCommitMessage = `${suggestedMessage}\n\n[skip-jules-review]`;
        await exec.exec('git', ['push']);
        core.info('Comitted and Pushed with [skip-jules-review] flag');
        core.setOutput('session-name', response.data.name);

    } catch (error) {
        core.setFailed(`Action failed with error: ${error.message}`);
    }

}

run();