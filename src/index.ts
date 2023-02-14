import inquirer, { QuestionCollection } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync } from 'fs';
import * as process from 'process';
import YAML from 'yaml';

import { createSettingsModule, sipgateIO, SipgateIOClient } from 'sipgateio';
import {
  COLOR_DEFAULT,
  COLOR_GREEN,
  COLOR_YELLOW,
  COMMANDS,
  EXECUTABLE_NAME,
} from './constants';
import {
  selectProject,
  selectSipgateIOProject,
  selectGCPRegion,
  configExists,
  loadConfig,
  interactivelyGenerateConfig,
  logUsedConfig,
} from './config';
import { Config } from './types';
import { fetchEnvFor } from './fetch';
import { buildEnv, extractQuestions } from './utils';

interface Requirement {
  command: string;
  link: string;
  group?: string;
  exists?: boolean;
}

const execCommand = promisify(execFile);
let config: Config = {};
let requirements: Array<Requirement>;

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

function printWelcome() {
  console.log(
    'This CLI tool creates a sipgate.io example project in Google Cloud, to give you the chance to try out our examples easily.',
  );
  console.log(
    'It therefore requires you to have a Google account with access to the Google Cloud Platform.\n',
  );
  console.log(
    `For further information type${COLOR_GREEN} sio-gd help${COLOR_DEFAULT}.\n`,
  );
  console.log(
    `If you use this tool repeatedly and want to save your credentials, use the flag ${COLOR_GREEN} --config config.cfg${COLOR_DEFAULT}.\n`,
  );
}

async function gCloudIsLoggedIn() {
  try {
    const { stdout } = await execCommand('gcloud', [
      'config',
      'list',
      '--format',
      'value(core.account)',
    ]);
    return stdout.length > 1;
  } catch (error) {
    return false;
  }
}

async function gCloudAuthentification(): Promise<boolean> {
  const isLoggedIn = await gCloudIsLoggedIn();

  if (isLoggedIn) return true;

  try {
    await execCommand('gcloud', ['auth', 'login']);
    return true;
  } catch (error) {
    const authenticateAgain = await inquirer.prompt([
      {
        name: 'googleAuthentication',
        message:
          'Could not authenticate with Google. Do you want to try again?',
        type: 'confirm',
      },
    ]);
    if (authenticateAgain.googleAuthentication) {
      gCloudAuthentification();
    } else {
      console.log('Could not authenticate with Google. Cancelling setup.');
      return false;
    }
  }
  return false;
}

async function gCloudCloneGitRepository(project: string): Promise<boolean> {
  try {
    await execCommand('rm', ['-rf', `/tmp/${project}`]);
    await execCommand('git', [
      'clone',
      `git@github.com:sipgate-io/${project}.git`,
      `/tmp/${project}`,
    ]);
    return true;
  } catch (error) {
    console.log('Google Cloud could not clone Github Repository.');
  }
  return false;
}

async function extractWebhookURI() {
  const { stdout } = await execCommand('gcloud', [
    'app',
    'browse',
    '--no-launch-browser',
  ]);
  return stdout.trim();
}

async function printWebhookUriAndGCloudUri(selectedGCPproject: string) {
  console.log('You can access the project with these URLs:');
  console.log(`Webhook URI: ${selectedGCPproject}`);
  console.log(
    'Google Cloud Dashboard: ' +
      `https://console.cloud.google.com/appengine?serviceId=default&project=${selectedGCPproject}`,
  );
}

function getRequirementsByGroup(group: string) {
  return requirements.filter((req) => req.group === group);
}

function isCloudServicePresent() {
  let isPresent = false;
  const cloudServices = getRequirementsByGroup('cloud-service');
  cloudServices.forEach((cloudReq) => {
    if (cloudReq.exists) {
      isPresent = true;
    }
  });
  if (!isPresent) {
    console.log(
      `${COLOR_YELLOW}No cloud service detected. Please download one of the following:${COLOR_DEFAULT}`,
    );
    cloudServices.forEach((cloudReq) => {
      console.log(`${cloudReq.command} => ${cloudReq.link}`);
    });
  }
  return isPresent;
}

function allDependenciesPresent() {
  let allPresent = true;
  requirements.forEach((req) => {
    if (!req.exists && !req.group) {
      console.log(
        `${COLOR_YELLOW}Missing requirement detected: ${COLOR_DEFAULT}`,
      );
      console.log(req.command);
      console.log(req.link);
      allPresent = false;
    }
  });
  return allPresent && isCloudServicePresent();
}

function userPATExists() {
  return config.TOKEN_ID && config.TOKEN;
}

async function askForPAT() {
  const result = await inquirer.prompt([
    {
      name: 'TOKEN_ID',
      message: 'Please enter your sipgate Token_ID: ',
      type: 'input',
    },
    {
      name: 'TOKEN',
      message: 'Please enter your sipgate Token: ',
      type: 'password',
    },
  ]);
  return result;
}

async function setWebhookInConsoleWeb(
  sipgateClient: SipgateIOClient,
  webhookUri: string,
) {
  try {
    const webhookSettings = createSettingsModule(sipgateClient);
    await webhookSettings.setIncomingUrl(webhookUri);
    await webhookSettings.setOutgoingUrl(webhookUri);
    console.log('Successfully set webhooks in your sipgate account.\n');
  } catch (error) {
    console.log(error);
  }
}

async function optionallySetWebhookInConsoleWeb(webhookUri: string) {
  let TOKEN_ID;
  let TOKEN;

  const result = await inquirer.prompt([
    {
      name: 'setWebhookURI',
      message:
        'Do you want to automatically set the webhook URI in your sipgate account?',
      type: 'confirm',
    },
  ]);

  if (!result.setWebhookURI) {
    console.log(
      'You can manually set the webhook URI here: https://console.sipgate.com/webhooks/urls',
    );
    return;
  }

  if (userPATExists()) {
    TOKEN_ID = config.TOKEN_ID;
    TOKEN = config.TOKEN;
    logUsedConfig('TOKEN_ID', undefined);
    logUsedConfig('TOKEN', undefined);
  } else {
    const enteredPAT = await askForPAT();
    TOKEN_ID = enteredPAT.TOKEN_ID;
    TOKEN = enteredPAT.TOKEN;
  }
  const sipgateClient = sipgateIO({
    tokenId: TOKEN_ID,
    token: TOKEN,
  });
  await setWebhookInConsoleWeb(sipgateClient, webhookUri);
}

async function runInteractiveFlow() {
  printWelcome();

  if (!allDependenciesPresent()) {
    return;
  }

  console.log('Checking Google Cloud authentication...');
  if (!(await gCloudAuthentification())) {
    return;
  }
  console.log('Authentication successful.\n');

  const selectedGCPproject = await selectProject(config);

  const selectedIOProject = await selectSipgateIOProject(config);

  const envConfig: Config = {};
  const envArray = await fetchEnvFor(selectedIOProject);
  const envQuestions = extractQuestions(envArray);

  for (let i = envQuestions.length - 1; i >= 0; i -= 1) {
    const key = envQuestions[i].name;
    if (config[key]) {
      envConfig[key] = config[key];
      logUsedConfig(key, undefined);
      envQuestions.splice(i, 1);
    }
  }

  const envVarValues = await inquirer.prompt(
    envQuestions as QuestionCollection,
  );

  console.log('Cloning the selected project...');

  if (!(await gCloudCloneGitRepository(selectedIOProject))) {
    return;
  }
  console.log('Cloning complete.\n');

  writeFileSync(
    `/tmp/${selectedIOProject}/.env`,
    buildEnv({ ...envVarValues, ...envConfig }),
  );

  const region = await selectGCPRegion(config);

  try {
    console.log('Trying to create App Engine application...');
    await execCommand('gcloud', ['app', 'create', `--region=${region}`]);
    console.log('App Engine application created.\n');
  } catch (err) {
    console.log('App Engine application already exists.\n');
  }

  console.log('Deploying project to Google Cloud. This may take a while...');
  await execCommand('gcloud', ['app', 'deploy', '-q'], {
    cwd: `/tmp/${selectedIOProject}`,
  });
  console.log(
    `Successfully deployed ${selectedIOProject} to ${selectedGCPproject}.\n`,
  );

  const webhookUri = await extractWebhookURI();
  await printWebhookUriAndGCloudUri(selectedGCPproject);
  await optionallySetWebhookInConsoleWeb(webhookUri);
}

function printHelp() {
  console.log(
    'This CLI tool creates a sipgate.io example project in Google Cloud, to give you the chance to try out our examples easily.\n',
  );
  console.log(`Usage: ${EXECUTABLE_NAME} <command>\n`);
  console.log(
    `Where <command> is one of: ${COMMANDS.map((cmd) => cmd.name).join(
      ', ',
    )}\n`,
  );

  const len = Math.max(...COMMANDS.map((cmd) => cmd.name.length)) + 5;
  COMMANDS.forEach((cmd) => {
    const numSpaces = len - cmd.name.length;
    console.log(cmd.name + ' '.repeat(numSpaces) + cmd.description);
  });

  console.log('\n');
  console.log('Developed by sipgate.io');
  console.log('Website:  https://www.sipgate.io');
  console.log(
    'Project:  https://github.com/sipgate-io/sipgateio-google-deployer',
  );
}

async function isRequirementInstalled(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`command -v ${command} 2> /dev/null`, (error) => {
      // eslint-disable-next-line no-unused-expressions
      error ? resolve(false) : resolve(true);
    });
  });
}

async function parseRequirements(file: string): Promise<Requirement[]> {
  requirements = YAML.parse(file);
  return Promise.all(
    requirements.map(async (requirement) => {
      const exists = await isRequirementInstalled(requirement.command);
      return { ...requirement, exists };
    }),
  );
}

export default async function startCLI() {
  const requirementsFile = readFileSync('./requirements.yml', 'utf-8');
  await parseRequirements(requirementsFile).then((reqs) => {
    requirements = reqs;
  });

  if (process.argv.length > 4) {
    console.log('Incorrect usage.');
    console.log(`Use "${EXECUTABLE_NAME} help" for more info.`);
    return;
  }

  if (process.argv.length === 3 && process.argv[2] === 'help') {
    printHelp();
    return;
  }

  if (
    process.argv.length > 2 &&
    (process.argv[2] === '--config' || process.argv[2] === '-c')
  ) {
    if (configExists(process.argv[3])) {
      config = loadConfig(process.argv[3]);
    } else {
      const { confirm } = await inquirer.prompt([
        {
          name: 'confirm',
          message:
            'Could not find an existing config. Do you want to interactively generate a new one?',
          type: 'confirm',
        },
      ]);

      if (!confirm) process.exit(0);

      config = await interactivelyGenerateConfig();
    }
  } else if (
    process.argv.length > 2 &&
    (process.argv[2] === '--generate-config' || process.argv[2] === '-gc')
  ) {
    config = await interactivelyGenerateConfig();
  }

  runInteractiveFlow();
}
