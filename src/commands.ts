import { Command } from 'commander';
import inquirer from 'inquirer';
import {
  configExists,
  interactivelyGenerateConfig,
  loadConfig,
} from './config';
import { COLOR_DEFAULT, COLOR_YELLOW, EXECUTABLE_NAME } from './constants';
import { Config } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let cmdConfig: Config = {};

async function run(options: { generateConfig: string; config: string }) {
  if (options.generateConfig) {
    cmdConfig = await interactivelyGenerateConfig();
  } else if (
    typeof options.config === 'string' &&
    configExists(options.config)
  ) {
    cmdConfig = loadConfig(options.config);
  } else if (options.config) {
    const { confirm } = await inquirer.prompt([
      {
        name: 'confirm',
        message:
          'Could not find an existing config. Do you want to interactively generate a new one?',
        type: 'confirm',
      },
    ]);
    if (!confirm) process.exit(0);
    cmdConfig = await interactivelyGenerateConfig();
  }
}

function example(repository: string) {
  console.warn(
    `${COLOR_YELLOW}[WARN]: This feature is not implemented yet!${COLOR_DEFAULT}\n./sio-gd example ${repository}`,
  );
  process.exit(0);
}

function examples() {
  console.warn(
    `${COLOR_YELLOW}[WARN]: This feature is not implemented yet!${COLOR_DEFAULT}\n./sio-gd examples`,
  );
  process.exit(0);
}

function initAccount() {
  console.warn(
    `${COLOR_YELLOW}[WARN]: This feature is not implemented yet!${COLOR_DEFAULT}\n./sio-gd init account`,
  );
  process.exit(0);
}

export async function registerCommands() {
  const program = new Command().name(EXECUTABLE_NAME);

  program
    .command('run', { isDefault: true })
    .description('start the interactive flow')
    .option(
      '-c, --config [path]',
      'Hands in a config file based on the given example',
    )
    .option(
      '-gc, --generate-config',
      'Fill in the given example interactively and generate config.cfg',
    )
    .action(run);

  program
    .command('example <repository>')
    .description(
      'initialize the example <repository> as a Google Cloud App Engine service',
    )
    .action(example);

  program
    .command('examples')
    .description('lists all available sipgate.io examples')
    .action(examples);

  program
    .command('init-account')
    .description('initializes sipgate.io and Google Cloud accounts')
    .action(initAccount);

  await program.parseAsync();
}
