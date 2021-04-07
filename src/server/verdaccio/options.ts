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
    config.security.api.legacy = true;
    config.security.web.sign.expiresIn = '7d';
    return config.security;
  }

  return defaultSecurity;
}
