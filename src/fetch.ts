import fetch from 'node-fetch';
import { existsSync, readFileSync } from 'fs';
import { exit } from 'process';
import { ProjectData } from './types';

async function fetchUrl(url: string) {
  const data = await fetch(url);
  return data.text();
}
function parseStringToArray(s: string) {
  return s
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function getProjectList(): Promise<ProjectData[]> {
  return JSON.parse(
    await fetchUrl(
      'https://raw.githubusercontent.com/sipgate-io/sipgateio-static-files/main/sipgateio-cli-projects-lock.json',
    ),
  );
}

export async function fetchEnvFor(project: string) {
  return parseStringToArray(
    await fetchUrl(
      `https://raw.githubusercontent.com/sipgate-io/${project}/HEAD/.env.example`,
    ),
  );
}

export async function fetchLocalEnvFor(path: string) {
  const envExample = `${path}/.env.example`;

  if (!existsSync(envExample)) {
    console.log(
      'Please create an .env.example file in your repository. If you dont have one, look inside our sipgate io example repos.',
    );
    exit(1);
  }
  return parseStringToArray(readFileSync(envExample).toString());
}

export function readExampleConfig() {
  return parseStringToArray(readFileSync('./config.cfg.example', 'utf-8'));
}
