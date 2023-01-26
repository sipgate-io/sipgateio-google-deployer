import fetch from 'node-fetch';
import { readFileSync } from 'fs';
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

export function readExampleConfig() {
  return parseStringToArray(readFileSync('./config.cfg.example', 'utf-8'));
}
