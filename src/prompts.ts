import inquirer, { QuestionCollection } from 'inquirer';
import { string } from 'yaml/dist/schema/common/string';

export async function selectRepoLocation() {
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

export async function filenameInput() {
  const filename = await inquirer.prompt([
    {
      name: 'filename',
      message: 'Please choose a name for your file: ',
      type: 'input',
      default: 'config.cfg',
    },
  ]);
  if (filename.filename.endsWith('.cfg')) {
    filename.filename = filename.filename.slice(0, -4);
  }
  return filename.filename;
}

export async function confirmationPrompt() {
  const confirm = await inquirer.prompt([
    {
      name: 'confirm',
      message: 'Are you sure everything is correct?',
      type: 'confirm',
    },
  ]);
  return confirm.confirm;
}

export async function overwriteConfirmation(filename: string) {
  const confirmoverwrite = await inquirer.prompt([
    {
      name: 'confirmoverwrite',
      message: `${filename} already exists, are you sure you want to overwrite?`,
      type: 'confirm',
    },
  ]);
  return confirmoverwrite.confirmoverwrite;
}
