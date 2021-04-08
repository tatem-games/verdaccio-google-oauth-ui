import { IPluginMiddleware } from '@verdaccio/types';
import { Application, Handler, Request } from 'express';
import qs from 'query-string';

import { AuthCore } from '../plugin/AuthCore';
import { AuthProvider } from '../plugin/AuthProvider';
import { Verdaccio } from '../verdaccio';
import { cliPort, cliProviderId } from '../../constants';
import { getCallbackPath } from '../../redirect';
const cliAuthorizeUrl = '/oauth/authorize';

const pluginCallbackeUrl = getCallbackPath(cliProviderId);

export class CliFlow implements IPluginMiddleware<any> {
  constructor(
    private readonly verdaccio: Verdaccio,
    private readonly core: AuthCore,
    private readonly provider: AuthProvider
  ) {}

  /**
   * IPluginMiddleware
   */
  public register_middlewares(app: Application): void {
    app.get(cliAuthorizeUrl, this.authorize.bind(this));
    app.get(pluginCallbackeUrl, this.callback.bind(this));
  }

  public async authorize(req, res, next) {
    try {
      const redirectUrl = this.getRedirectUrl(req);
      const url = await this.provider.getLoginUrl(redirectUrl);
      res.redirect(url);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  public async callback(req, res, next) {
    const params: Record<string, string> = {};

    try {
      const redirectUrl = this.getRedirectUrl(req);
      const code = await this.provider.getCode(req);
      const token = await this.provider.getToken(code, redirectUrl);
      const username = await this.provider.getUsername(token);
      const groups = await this.provider.getGroups(token);

      if (this.core.canAuthenticate(username, groups)) {
        const user = this.core.createUser(username, token);
        const npmToken = await this.verdaccio.issueNpmToken(user);

        params.status = 'success';
        params.email = username;
        params.token = encodeURIComponent(npmToken);
      } else {
        params.status = 'denied';
      }
    } catch (error) {
      console.error(error);
      params.status = 'error';
      params.message = error.message || error;
    }
    const redirectUrl = `http://localhost:${cliPort}` + '?' + qs.stringify(params);
    res.redirect(redirectUrl);
  }

  private getRequestOrigin(req: Request): string {
    const protocal = req.get('X-Forwarded-Proto') || req.protocol;
    return protocal + '://' + req.get('host');
  }

  private getRedirectUrl(req: Request): string {
    const baseUrl = this.verdaccio.baseUrl || this.getRequestOrigin(req);
    return baseUrl + pluginCallbackeUrl;
  }
}
