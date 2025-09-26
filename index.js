const core = require ('@actions/core');
const axios = require('axios');

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
            source: [`sources/${sourceName}`],
            sourceContexts: [{
                sources: `sources/${sourceName}`,
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
        core.setOutput('session-name', response.data.name);

    } catch (error) {
        core.setFailed(`Action failed with error: ${error.message}`);
    }

}

run();