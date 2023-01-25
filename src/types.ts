import { Question } from 'inquirer';

export type ProjectData = {
  repository: string;
  description: string;
  tabOffset?: number;
};

export interface NamedQuestion extends Question {
  name: string;
}

export interface Config {
  [name: string]: string;
}
