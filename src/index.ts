import inquirer, { Question, QuestionCollection } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

const COLOR_GRAY = '\x1B[30m';
const COLOR_CYAN = '\x1B[36m';
const COLOR_DEFAULT = '\x1B[0m';

type ProjectData = {
  repository: string;
  description: string;
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

const startCLI = async () => {
  const githubProjectNames = await getProjectList();

  const tabs = calculateTabs(
    githubProjectNames.map((project) => project.repository),
  );

  const selectedProjectAnswers: { selectedProject: string } =
    await inquirer.prompt([
      {
        name: 'selectedProject',
        message: 'Choose an sipgate-io example:',
        type: 'autocomplete',
        source: (answersSoFor: string[], input: string | undefined) =>
          githubProjectNames
            .filter((project) => project.repository.includes(input ?? ''))
            .map(
              (p, index) =>
                `${p.repository}${'\t'.repeat(tabs[index])}${COLOR_GRAY} - ${
                  p.description !== 'null' ? p.description : ``
                }${COLOR_DEFAULT}`,
            ),
      },
    ]);

  selectedProjectAnswers.selectedProject =
    selectedProjectAnswers.selectedProject
      .slice(0, selectedProjectAnswers.selectedProject.indexOf('\t'))
      .trim();

  console.log(
    `Das Projekt: ${selectedProjectAnswers.selectedProject} wurde ausgewählt!`,
  );

  const envArray = await fetchEnvFor(selectedProjectAnswers.selectedProject);

  const envQuestions: Question[] = extractQuestions(envArray);
  const envVarValues = await inquirer.prompt(
    envQuestions as QuestionCollection,
  );

  console.log(envVarValues);
};

startCLI();
