import { APITokenOptions, Config, JWTOptions, Security } from '@verdaccio/types';

const defaultWebTokenOptions: JWTOptions = {
  sign: {
    // The expiration token for the website is 7 days
    expiresIn: '7d',
  },
  verify: {},
};

const defaultApiTokenConf: APITokenOptions = {
  legacy: true,
};

const defaultSecurity: Security = {
  web: defaultWebTokenOptions,
  api: defaultApiTokenConf,
};

export function getSecurity(config: Config): Security {
  if (config.security) {
    config.security.api.legacy = false;
    return config.security;
  }

  return defaultSecurity;
}
