import { stringify } from 'querystring';

import { Request } from 'express';

import { AuthProvider } from '../plugin/AuthProvider';
import { Config, getConfig } from '../plugin/Config';

import { GoogleClient } from './Client';
import { GoogleUser } from './User';

export class GoogleAuthProvider implements AuthProvider {
  private readonly clientId;
  private readonly clientSecret;
  private readonly requiredDomain;
  private readonly client;

  public get authBaseUrl(): string {
    return 'https://accounts.google.com';
  }

  public get tokenBaseUrl(): string {
    return 'https://oauth2.googleapis.com';
  }

  public get userInfoBaseUrl(): string {
    return 'https://openidconnect.googleapis.com';
  }

  public constructor(private readonly config: Config) {
    this.clientId = getConfig(this.config, 'client-id');
    this.clientSecret = getConfig(this.config, 'client-secret');
    this.requiredDomain = getConfig(this.config, 'domain');
    this.client = new GoogleClient(this.tokenBaseUrl, this.userInfoBaseUrl);
  }

  public getId(): string {
    return 'google';
  }

  public getLoginUrl(callbackUrl: string): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: callbackUrl,
      scope: 'openid email profile',
      response_type: 'code',
      hd: '',
    };
    if (this.requiredDomain) {
      params.hd = this.requiredDomain;
    }
    const queryParams = stringify(params);
    return this.authBaseUrl + `/o/oauth2/v2/auth?` + queryParams;
  }

  public getCode(req: Request): string {
    return req.query.code as string;
  }

  public async getToken(code: string, redirectUrl: string): Promise<string> {
    const auth = await this.client.requestAccessToken(code, this.clientId, this.clientSecret, redirectUrl);
    return auth.access_token;
  }

  public async getUser(token: string): Promise<GoogleUser> {
    return await this.client.requestUser(token);
  }

  public async getUsername(token: string): Promise<string> {
    return (await this.getUser(token)).email;
  }

  public async getGroups(token: string): Promise<string[]> {
    return ['google'];
  }
}
