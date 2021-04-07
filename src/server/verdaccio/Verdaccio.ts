import { Config, RemoteUser } from '@verdaccio/types';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

import { getSecurity } from './options';

import { Auth, User } from './index';

const getMajorVersion = (config: Config): number => {
  return +config.user_agent[10];
};

const getBaseUrl = (config: Config): string => {
  const prefix = config.url_prefix;
  if (prefix) {
    return prefix.replace(/\/?$/, ''); // Remove potential trailing slash
  }
  return '';
};

export class Verdaccio {
  public readonly majorVersion;
  public readonly baseUrl;

  private auth!: Auth;

  public constructor(private readonly config: Config) {
    this.majorVersion = getMajorVersion(this.config);
    this.baseUrl = getBaseUrl(this.config);
  }

  public setAuth(auth: Auth): void {
    this.auth = auth;
  }

  public async issueNpmToken(user: User): Promise<string> {
    return this.issueJWT(user);
  }

  public async issueUiToken(user: User): Promise<string> {
    return this.issueJWT(user);
  }

  private async issueJWT(user: User): Promise<string> {
    const jWTSignOptions = getSecurity(this.config).web.sign as SignOptions;
    return jwt.sign(user, this.config.secret, jWTSignOptions);
  }
}
