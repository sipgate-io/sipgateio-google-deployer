import inquirer, { Answers, Question, QuestionCollection } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

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

const getProjectList = async () =>
  parseStringToArray(
    await fetchUrl(
      'https://raw.githubusercontent.com/sipgate-io/sipgateio-static-files/main/sipgateio-cli-projects',
    ),
  ).sort();

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
    prefix: `${comment}\x1B[36m\u2699\x1B[0m`,
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
      comment += `INFO: ${line
        .slice(line.indexOf('#') + 1, line.length)
        .trim()} \n`;
      return;
    }
    envQuestions.push(composeQuestion(line, comment));
    comment = '';
  });
  return envQuestions;
}

const startCLI = async () => {
  const githubProjectNames = await getProjectList();

  const selectedProjectAnswers: { selectedProject: string } =
    await inquirer.prompt([
      {
        name: 'selectedProject',
        message: 'Choose an sipgate-io example:',
        type: 'autocomplete',
        source: (answersSoFor: string[], input: string | undefined) =>
          githubProjectNames.filter((projects) =>
            projects.includes(input ?? ''),
          ),
      },
    ]);

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
