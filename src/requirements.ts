import { exec } from 'child_process';
import YAML from 'yaml';
import { COLOR_YELLOW, COLOR_DEFAULT } from './constants';

interface Requirement {
  command: string;
  link: string;
  group?: string;
  exists?: boolean;
}

let requirements: Array<Requirement>;

function getRequirementsByGroup(group: string) {
  return requirements.filter((req) => req.group === group);
}

function isGroupPresent(group: string): boolean {
  let isPresent = false;
  const inGroup = getRequirementsByGroup(group);
  inGroup.forEach((req) => {
    if (req.exists) {
      isPresent = true;
    }
  });
  if (!isPresent) {
    console.log(
      `${COLOR_YELLOW}No ${group} detected. Please download one of the following:${COLOR_DEFAULT}`,
    );
    inGroup.forEach((req) => {
      console.log(`${req.command} => ${req.link}`);
    });
  }
  return isPresent;
}

export function allRequirementsPresent() {
  let allPresent = true;
  requirements.forEach((req) => {
    if (!req.exists && !req.group) {
      console.log(
        `${COLOR_YELLOW}Missing requirement detected: ${COLOR_DEFAULT}`,
      );
      console.log(req.command);
      console.log(req.link);
      allPresent = false;
    }
  });
  return allPresent && isGroupPresent('cloud-service');
}

async function isRequirementInstalled(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`command -v ${command} 2> /dev/null`, (error) => {
      // eslint-disable-next-line no-unused-expressions
      error ? resolve(false) : resolve(true);
    });
  });
}

export async function parseRequirements(file: string) {
  const parsedRequirements: Array<Requirement> = YAML.parse(file);
  requirements = await Promise.all(
    parsedRequirements.map(async (requirement) => {
      const exists = await isRequirementInstalled(requirement.command);
      return { ...requirement, exists };
    }),
  );
}
