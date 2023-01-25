export const COLOR_GRAY = '\x1B[30m';
export const COLOR_CYAN = '\x1B[36m';
export const COLOR_GREEN = '\u001b[32m';
export const COLOR_YELLOW = '\x1B[33m';
export const COLOR_DEFAULT = '\x1B[0m';
export const DEPENDENCIES = ['git', 'gcloud'];
export const EXECUTABLE_NAME = 'sio-gd';

export const COMMANDS = [
  {
    name: 'init account',
    description: 'Initializes sipgate.io and Google Cloud accounts',
  },
  {
    name: 'examples',
    description: 'Lists all available sipgate.io examples',
  },
  {
    name: 'example/<repo-name>',
    description:
      'Initialize the example <repo-name> as a Google Cloud App Engine service',
  },
  {
    name: 'help',
    description: 'Display a help menu',
  },
];
