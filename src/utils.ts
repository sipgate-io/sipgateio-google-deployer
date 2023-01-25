import inquirer from 'inquirer';

import { extractEnv } from './config';
import { COLOR_CYAN, COLOR_DEFAULT, COLOR_GRAY } from './constants';
import { NamedQuestion } from './types';

export function calculateTabs(strings: string[]): number[] {
  const max = Math.max(...strings.map((s) => s.length));
  return strings
    .map((s) => s.length)
    .map((l) => max - l)
    .map((d) => Math.floor(d / 8))
    .map((f) => f + 1);
}

export function composeQuestion(line: string, comment: string): NamedQuestion {
  const { envName, envValue } = extractEnv(line);

  return {
    prefix: `\n${comment}${COLOR_CYAN}\u2699${COLOR_DEFAULT}`,
    name: `${envName}`,
    message: `${envName} =`,
    type: 'input',
    default: envValue ?? undefined,
  };
}

export function extractQuestions(envArray: string[]): NamedQuestion[] {
  // lots of side effect, more than one responsibility
  let comment = '';
  const envQuestions: NamedQuestion[] = [];

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

export function buildEnv(envVarValues: inquirer.Answers) {
  let envFile = '';

  Object.entries(envVarValues).forEach(([key, value]) => {
    envFile += `${key}=${value}\n`;
  });
  return envFile;
}
