import {
  calculateTabs,
  composeQuestion,
  buildEnv,
  extractQuestions,
  loadConfig,
} from './index';
// composeQuestions
test('composeQuestion', () => {
  const line = 'test=funny';
  const comment = '# this is a comment';
  expect(composeQuestion(line, comment)).toMatchObject({
    prefix: `\n${comment}\x1B[36m\u2699\x1B[0m`,
    name: 'test',
    default: ['funny'],
  });
});

test('loadConfig', () => {
  expect(loadConfig('./config.cfg.example')).toMatchObject({
    TOKEN_ID: 'your-token-id',
    TOKEN: 'your-token',
    EXAMPLE_REPO_NAME: 'sipgateio-incomingcall-node',
    GOOGLE_PROJECT_NAME: 'my-first-project',
    GOOGLE_PROJECT_REGION: 'europe-west',
  });
});

test('calculateTabs', () => {
  expect(
    calculateTabs([
      'sipgateio-incomingcall-node',
      'io-labs-2fa-service',
      'sipgateio-incomingcall-python',
      'a',
    ]),
  ).toStrictEqual([1, 2, 1, 4]);
});

test('buildEnv', () => {
  expect(buildEnv({ id: '123456', webhookPort: '8080' })).toStrictEqual(
    'id=123456\nwebhookPort=8080\n',
  );
});
test('extractQuestions', () => {
  const envArray = [
    '# The SIPGATE_TOKEN_ID and SIPGATE_TOKEN can be created here: https://app.sipgate.com/w0/personal-access-token\n',
    'SIPGATE_TOKEN_ID=\n',
    'SIPGATE_TOKEN=\n',
    '\n',
    '# Use the service localhost.run or ngrok which set up a reverse ssh tunnel that forwards traffic from a public URL to your localhost\n',
    'SIPGATE_WEBHOOK_SERVER_ADDRESS=\n',
  ];
  const COLOR_GRAY = '\x1B[30m';
  const COLOR_CYAN = '\x1B[36m';
  const COLOR_DEFAULT = '\x1B[0m';
  const envQuestions = [
    {
      prefix: `\n${COLOR_GRAY}INFO: The SIPGATE_TOKEN_ID and SIPGATE_TOKEN can be created here: https://app.sipgate.com/w0/personal-access-token${COLOR_DEFAULT}\n${COLOR_CYAN}⚙${COLOR_DEFAULT}`,
      name: 'SIPGATE_TOKEN_ID',
      message: 'SIPGATE_TOKEN_ID =',
      type: 'input',
      default: undefined,
    },
    {
      prefix: `\n${COLOR_CYAN}\u2699${COLOR_DEFAULT}`,
      name: 'SIPGATE_TOKEN',
      message: 'SIPGATE_TOKEN =',
      type: 'input',
      default: undefined,
    },
    {
      prefix: `\n${COLOR_CYAN}⚙${COLOR_DEFAULT}`,
      name: '',
      message: ' =',
      type: 'input',
      default: undefined,
    },
    {
      prefix: `\n${COLOR_GRAY}INFO: Use the service localhost.run or ngrok which set up a reverse ssh tunnel that forwards traffic from a public URL to your localhost${COLOR_DEFAULT}\n${COLOR_CYAN}⚙${COLOR_DEFAULT}`,
      name: 'SIPGATE_WEBHOOK_SERVER_ADDRESS',
      message: 'SIPGATE_WEBHOOK_SERVER_ADDRESS =',
      type: 'input',
      default: undefined,
    },
  ];
  expect(extractQuestions(envArray)).toStrictEqual(envQuestions);
});
