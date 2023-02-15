import inquirer, { QuestionCollection } from 'inquirer';

export default async function selectRepoLocation() {
  const response = await inquirer.prompt([
    {
      name: 'selectedLocation',
      message: 'Choose between sipgate.io Repository or Local Repository!',
      type: 'list',
      choices: [{ value: 'sipgate.io Repo' }, { value: 'local Repo' }],
    } /* Pass your questions in here */,
  ]);

  return response.selectedLocation;
}
