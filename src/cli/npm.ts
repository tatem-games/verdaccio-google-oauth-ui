import { execSync } from 'child_process';
import { URL } from 'url';

import minimist from 'minimist';

const npmConfig = JSON.parse(execSync('npm config list --json').toString());

export function getRegistry() {
  const args = minimist(process.argv.slice(2));
  return (args.registry || npmConfig.registry).trim().replace(/\/?$/, ''); // Remove potential trailing slash
}

export function getConfigFile() {
  return npmConfig.userconfig;
}

export function getSaveCommands(registry, token) {
  const url = new URL(registry);
  // restore trailing slash if missing
  const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  const baseUrl = url.host + pathname;
  return [
    `npm config set //${baseUrl}:_authToken "${token}"`, // lgtm [js/command-line-injection]
    `npm config set //${baseUrl}:always-auth true`,
  ];
}

export function save(registry, token) {
  getSaveCommands(registry, token).forEach(command => execSync(command));
}
