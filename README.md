# sipgateio-google-deployer

## Overview

This CLI tool creates a sipgate.io example project in Google Cloud, to give you the chance to try out our examples easily.

## Install

1. Install the required dependencies (see [Requirements](#Requirements)).
2. Clone this GitHub repository:<br>
   `git clone git@github.com:sipgate-io/sipgateio-google-deployer.git`
3. Jump to the directory and make the script executable:<br>
   `cd sipgateio-google-deployer && chmod +x ./sio-gd`

## Usage

1. Create a GCP project on your [Google Cloud Dashboard](https://console.cloud.google.com/welcome), in which you want to run these examples.
2. Make sure the [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com) is enabled
3. Start the tool with `./sio-gd`.
   1. Use `--config [config.cfg]` or `-c [config.cfg]` to hand in a config file based on the given [example](./config.cfg.example).
   2. Alternatively, you can use `--generate-config` or `-gc` to fill in the example interactively.
4. Follow the instructions to authenticate with a Google Workspace account.
   1. Accept the required OAuth scopes and hit continue.
   2. Wait for the Authentication process to finish.
   3. Close the Cloud SDK docs and continue within the CLI.
5. Select a Google Cloud Project from the presented list.
6. Select a sipgate.io example Repo from the presented list or a local Repo (Keep in mind: Your Repo should contain a valid app.yaml and .env.example file).
7. Enter a Webhook Server Port (or continue to accept the default).
8. Select a desired Region for your App Engine application.
9. Wait for the deployment process to finish.
10. Configure the Webhook URL in your [sipgate Account](https://console.sipgate.com/webhooks/urls)

## Requirements

- [`node`](https://nodejs.org/en/)
- [`gcloud CLI`](https://cloud.google.com/sdk/docs/install)
- [`git`](https://git-scm.com/)
