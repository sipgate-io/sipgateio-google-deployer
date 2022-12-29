import inquirer, { Question, QuestionCollection } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';

const execCommand = promisify(exec);

const COLOR_GRAY = '\x1B[30m';
const COLOR_CYAN = '\x1B[36m';
const COLOR_DEFAULT = '\x1B[0m';

type ProjectData = {
  repository: string;
  description: string;
  tabOffset?: number;
};

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

async function fetchUrl(url: string) {
  const data = await fetch(new URL(url));
  return data.text();
}

const parseStringToArray = (s: string) =>
  s
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

async function getProjectList(): Promise<ProjectData[]> {
  return JSON.parse(
    await fetchUrl(
      'https://raw.githubusercontent.com/sipgate-io/sipgateio-static-files/main/sipgateio-cli-projects-lock.json',
    ),
  );
}

const fetchEnvFor = async (project: string) =>
  parseStringToArray(
    await fetchUrl(
      `https://raw.githubusercontent.com/sipgate-io/${project}/HEAD/.env.example`,
    ),
  );

function composeQuestion(line: string, comment: string) {
  const envName = line.slice(0, line.indexOf('=')).trim();
  const envDefaultValue =
    line
      .slice(line.indexOf('=') + 1, line.length)
      .trim()
      .match(/[^'"]+/gm) ?? '';
  return {
    prefix: `\n${comment}${COLOR_CYAN}\u2699${COLOR_DEFAULT}`,
    name: `${envName}`,
    message: `${envName} =`,
    type: 'input',
    default: envDefaultValue.length > 0 ? envDefaultValue : undefined,
  };
}

function extractQuestions(envArray: string[]) {
  // lots of side effect, more than one responsibility
  let comment = '';
  const envQuestions: Question[] = [];

  envArray.forEach((line: string) => {
    if (line.startsWith('#')) {
      // line is a comment
      comment += `${COLOR_GRAY}INFO: ${line
        .slice(line.indexOf('#') + 1, line.length)
        .trim()}${COLOR_DEFAULT}\n`;
      return;
    }
    envQuestions.push(composeQuestion(line, comment));
    comment = '';
  });
  return envQuestions;
}

function calculateTabs(strings: string[]): number[] {
  const max = Math.max(...strings.map((s) => s.length));
  return strings
    .map((s) => s.length)
    .map((l) => max - l)
    .map((d) => Math.floor(d / 8))
    .map((f) => f + 1);
}

async function gCloudIsLoggedIn() {
  try {
    const { stdout } = await execCommand(
      "gcloud config list --format 'value(core.account)'",
    );
    return stdout.length > 1;
  } catch (error) {
    return false;
  }
}

async function gCloudAuthentification(): Promise<boolean> {
  const isLoggedIn = await gCloudIsLoggedIn();

  if (isLoggedIn) return true;

  try {
    const { stdout } = await execCommand(`gcloud auth login`);
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
    await execCommand(`rm -rf /tmp/${project}`);
    const { stdout } = await execCommand(
      `git clone git@github.com:sipgate-io/${project}.git /tmp/${project}`,
    );
    return true;
  } catch (error) {
    console.log('Google Cloud could not clone Github Repository.');
  }
  return false;
}

function buildEnv(envVarValues: inquirer.Answers) {
  let envFile = '';

  Object.keys(envVarValues).forEach((key) => {
    const value = envVarValues[key];
    envFile += `${key}=${value}\n`;
  });

  return envFile;
}

async function selectProject() {
  const { stdout } = await execCommand(
    `gcloud projects list --format="value(projectId)"`,
  );
  const res = await inquirer.prompt([
    {
      name: 'selectedProject',
      message: 'Choose a GCP project for this example:',
      type: 'autocomplete',
      source: (answersSoFor: string[], input: string | undefined) =>
        stdout
          .split('\n')
          .filter((name) =>
            name.toLowerCase().includes(input?.toLowerCase() ?? ''),
          ),
    },
  ]);

  await execCommand(`gcloud config set project ${res.selectedProject}`);
}

async function selectGCPRegion() {
  const { stdout } = await execCommand(
    `gcloud app regions list --format="value(region)"`,
  );
  const res = await inquirer.prompt([
    {
      name: 'selectedRegion',
      message: 'Choose a region for your GCP App Engine application:',
      type: 'autocomplete',
      source: (answersSoFor: string[], input: string | undefined) =>
        stdout
          .split('\n')
          .filter((name) =>
            name.toLowerCase().includes(input?.toLowerCase() ?? ''),
          ),
    },
  ]);

  return res.selectedRegion;
}

const startCLI = async () => {
  let githubProjects = await getProjectList();

  const tabs = calculateTabs(
    githubProjects.map((project) => project.repository),
  );

  githubProjects = githubProjects.map((project, index) => ({
    ...project,
    tabOffset: tabs[index],
  }));

  const selectedProjectAnswers: { selectedProject: string } =
    await inquirer.prompt([
      {
        name: 'selectedProject',
        message: 'Choose an sipgate-io example:',
        type: 'autocomplete',
        source: (answersSoFor: string[], input: string | undefined) =>
          githubProjects
            .filter(
              (project) =>
                project.repository
                  .toLowerCase()
                  .includes(input?.toLowerCase() ?? '') ||
                project.description
                  .toLowerCase()
                  .includes(input?.toLowerCase() ?? ''),
            )
            .map(
              (project) =>
                `${project.repository}${'\t'.repeat(
                  project.tabOffset ?? 1,
                )}${COLOR_GRAY} - ${
                  project.description !== 'null'
                    ? `${project.description.slice(0, 101)}${
                        project.description.length > 101 ? '...' : ''
                      }`
                    : ``
                }${COLOR_DEFAULT}`,
            ),
      },
    ]);

  selectedProjectAnswers.selectedProject =
    selectedProjectAnswers.selectedProject
      .slice(0, selectedProjectAnswers.selectedProject.indexOf('\t'))
      .trim();

  console.log(
    `Project ${selectedProjectAnswers.selectedProject} was selected.`,
  );

  const envArray = await fetchEnvFor(selectedProjectAnswers.selectedProject);

  const envQuestions: Question[] = extractQuestions(envArray);
  const envVarValues = await inquirer.prompt(
    envQuestions as QuestionCollection,
  );

  console.log(envVarValues);
  if (!(await gCloudAuthentification())) {
    return;
  }
  console.log('*** authenticated');

  if (
    !(await gCloudCloneGitRepository(selectedProjectAnswers.selectedProject))
  ) {
    return;
  }

  writeFileSync(
    `/tmp/${selectedProjectAnswers.selectedProject}/.env`,
    buildEnv(envVarValues),
  );

  await selectProject();
  const region = await selectGCPRegion();

  // await createAppEngineApplication(region);
  try {
    const { stderr } = await execCommand(
      `gcloud app create --region=${region}`,
    );
  } catch (err) {
    console.log('App Engine already exists.');
  }

  await execCommand(
    `cd /tmp/${selectedProjectAnswers.selectedProject} && gcloud app deploy -q`,
  );
};

startCLI();
