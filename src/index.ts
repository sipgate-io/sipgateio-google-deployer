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
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('#'));

  const envQuestions: Question[] = [];
  envArray
    .map((line) => line.slice(0, line.indexOf('=')).trim())
    .forEach((line) => {
      const question = {
        name: `env-${line}`,
        message: `Bitte gebe "${line}" ein`,
        type: 'input',
      };
      envQuestions.push(question);
    });

  const envAnswers = await inquirer.prompt(envQuestions as QuestionCollection);
  console.log(envAnswers);
};

startCLI();
