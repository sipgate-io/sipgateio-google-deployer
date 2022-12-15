import inquirer, { Answers, Question, QuestionCollection } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

const githubProjectNames = [
  'sipgateio-incomingcall-node',
  'sipgateio-incomingcall-python',
  'sipgateio-sendsms-node',
].sort();

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const fetchEnvExample = async (project: string) => {
  const data = await fetch(
    new URL(
      `https://raw.githubusercontent.com/sipgate-io/${project}/master/.env.example`,
    ),
  );
  return data.text();
};

const startCLI = async () => {
  const selectedProjectAnswers: { selectedProject: string } =
    await inquirer.prompt([
      {
        name: 'selectedProject',
        message: 'Choose an sipgate-io example:',
        type: 'autocomplete',
        source: (answersSoFor: string[], input: string | undefined) =>
          githubProjectNames.filter((c) => c.includes(input ?? '')),
      },
    ]);
  console.log(
    `Das Projekt: ${selectedProjectAnswers.selectedProject} wurde ausgewählt!`,
  );

  const env = await fetchEnvExample(selectedProjectAnswers.selectedProject);
  const envArray = env
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let comment = '';

  const envQuestions: Question[] = [];

  envArray.forEach((line) => {
    if (line.startsWith('#')) {
      comment += `\n INFO: ${line
        .slice(line.indexOf('#') + 1, line.length)
        .trim()}`;
      return;
    }
    const envLine = line.slice(0, line.indexOf('=')).trim();
    const envDefaultParam =
      line
        .slice(line.indexOf('=') + 1, line.length)
        .trim()
        .match(/[^'"]+/gm) ?? '';
    const question = {
      name: `env-${envLine}`,
      message: `Bitte gebe "${envLine}" ein${comment}\n`,
      type: 'input',
      default: envDefaultParam.length > 0 ? envDefaultParam : undefined,
    };
    envQuestions.push(question);
    comment = '';
  });

  const envAnswers = await inquirer.prompt(envQuestions as QuestionCollection);
  console.log(envAnswers);
};

startCLI();
