import inquirer, { Answers } from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';

const githubProjectNames = [
  'sipgateio-incomingcall-node',
  'sipgateio-incomingcall-python',
];

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

type SetupAnswers = {
  selectedProject: string;
};

inquirer
  .prompt([
    {
      name: 'selectedProject',
      message: 'Choose an sipgate-io example:',
      type: 'autocomplete',
      source: (answersSoFor: string[], input: string | undefined) =>
        githubProjectNames.filter((c) => c.includes(input ?? '')),
    },
  ])
  .then((answers: SetupAnswers) => {
    console.log(`Das Projekt: ${answers.selectedProject} wurde ausgewählt!`);
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });
