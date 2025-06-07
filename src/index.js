const core = require("@actions/core");
const httpClient = require("@actions/http-client");
const github = require("@actions/github");

async function run() {
  try {
    core.info("Starting Pocketbase Update Action...");

    const repoOwner = github.context.repo.owner;
    if (repoOwner !== "pawcoding") {
      throw new Error(
        `This action can only be used in repositories owned by "pawcoding". Current owner: ${repoOwner}.`
      );
    }

    core.info("Validating inputs...");

    const pocketbaseEmail = process.env.PB_EMAIL;
    if (!pocketbaseEmail) {
      throw new Error(
        'Pocketbase email is not set in environment variable "PB_EMAIL".'
      );
    }

    const pocketbasePassword = process.env.PB_PASSWORD;
    if (!pocketbasePassword) {
      throw new Error(
        'Pocketbase password is not set in environment variable "PB_PASSWORD".'
      );
    }

    const pocketbaseUrl = core.getInput("pocketbase-url");
    if (!pocketbaseUrl) {
      throw new Error('"pocketbase-url" is required.');
    }

    const collectionId = core.getInput("collection-id");
    if (!collectionId) {
      throw new Error('"collection-id" is required.');
    }

    const recordId = core.getInput("record-id");
    if (!recordId) {
      throw new Error('"record-id" is required.');
    }

    core.info("Inputs validated successfully. Logging in to Pocketbase...");

    const http = new httpClient.HttpClient("pocketbase-action");
    const loginUrl = new URL(
      "api/collections/_superusers/auth-with-password",
      pocketbaseUrl
    ).href;
    const loginRequest = await http.postJson(loginUrl, {
      identity: pocketbaseEmail,
      password: pocketbasePassword
    });
    if (loginRequest.statusCode !== 200) {
      throw new Error(
        `Login failed with status code ${loginRequest.statusCode}.`
      );
    }

    const { token } = loginRequest.result;
    const headers = {
      authorization: token
    };

    core.info("Login successful. Updating record...");

    const updateUrl = new URL(
      `api/collections/${collectionId}/records/${recordId}`,
      pocketbaseUrl
    ).href;
    const updateRequest = await http.patchJson(
      updateUrl,
      {
        lastUpdate: new Date().toISOString()
      },
      headers
    );

    if (updateRequest.statusCode !== 200) {
      throw new Error(
        `Update failed with status code ${updateRequest.statusCode}.`
      );
    }
    core.info("Record updated successfully.");
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

// Execute the async function
run();
