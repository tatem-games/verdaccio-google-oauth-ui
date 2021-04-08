import { execSync } from 'child_process';
import { URL } from 'url';

import minimist from 'minimist';

function parseCliArgs() {
  return minimist(process.argv.slice(2));
}

function runCommand(command: string) {
  console.log(`Running command: ${command}`);
  return execSync(command);
}

function getNpmConfig() {
  return JSON.parse(runCommand('npm config list --json').toString());
}

function removeTrailingSlash(input: string) {
  return input.trim().replace(/\/?$/, '');
}

function ensureTrailingSlash(input: string) {
  return input.endsWith('/') ? input : `${input}/`;
}

export function getRegistryUrl() {
  const cliArgs = parseCliArgs();
  const npmConfig = getNpmConfig();

  const registry = cliArgs.registry || npmConfig.registry;

  return removeTrailingSlash(registry);
}

export function getNpmConfigFile() {
  const npmConfig = getNpmConfig();

  return npmConfig.userconfig;
}

export function getNpmSaveCommands(registry: string, email: string, token: string) {
  const url = new URL(registry);
  const pathname = ensureTrailingSlash(url.pathname);
  const baseUrl = url.host + pathname;

  return [
    `npm config set //${baseUrl}:always-auth true`,
    `npm config set //${baseUrl}:_authToken "${token}"`,
    `echo [npmAuth."${url.href}"] >> %USERPROFILE%\\.upmconfig.toml && echo token = "${token}" >> %USERPROFILE%\\.upmconfig.toml && echo email = "${email}" >> %USERPROFILE%\\.upmconfig.toml && echo alwaysAuth = true >> %USERPROFILE%\\.upmconfig.toml`
  ];
}

export function saveNpmToken(email:string, token: string) {
  const registry = getRegistryUrl();
  const commands = getNpmSaveCommands(registry, email, token);

  commands.forEach(command => runCommand(command));
}
