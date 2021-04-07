import { Config as VerdaccioConfig } from '@verdaccio/types';
import { get } from 'lodash';

import { pluginName } from '../constants';

export interface PluginConfig {
  'client-id': string;
  'client-secret': string;
  domain?: string;
}

export type PluginConfigKey = keyof PluginConfig;

export interface Config extends VerdaccioConfig, PluginConfig {
  middlewares: { [pluginName]: PluginConfig };
  auth: { [pluginName]: PluginConfig };
}

export function getConfig(config: Config, key: PluginConfigKey): string {
  const value = config.middlewares[pluginName][key] || config.auth[pluginName][key];
  return value as string;
}

export const ensurePropExists = (config: Config, key: PluginConfigKey): void => {
  const value = getConfig(config, key);

  if (!value) {
    console.error(`[${pluginName}] ERR: Missing configuration "auth.${pluginName}.${key}"`);
    throw new Error('Please check your verdaccio config.');
  }
};

export const ensureNodeIsNotEmpty = (config: Config, node: keyof Config): void => {
  const path = `[${node}][${pluginName}]`;
  const obj = get(config, path, {});

  if (!Object.keys(obj).length) {
    throw new Error(`"${node}.${pluginName}" must be enabled`);
  }
};

export const validateConfig = (config: Config): void => {
  ensureNodeIsNotEmpty(config, 'auth');
  ensureNodeIsNotEmpty(config, 'middlewares');

  ensurePropExists(config, 'client-id');
  ensurePropExists(config, 'client-secret');
};
