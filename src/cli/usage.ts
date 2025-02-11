import { pluginName } from '../constants';

export function getUsageInfo() {
  return [
    'It seems you are using the default npm registry.',
    'Please update it to your Verdaccio URL by either running:',
    '',
    'npm config set registry <URL>',
    '',
    'or by using the registry argument',
    '',
    `npx verdaccio-${pluginName} --registry <URL>`,
  ];
}

export function printUsage() {
  getUsageInfo().forEach(line => console.log(line));
}
