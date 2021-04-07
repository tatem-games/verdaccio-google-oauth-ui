import { IPluginMiddleware } from '@verdaccio/types';
import { Application, Handler, Request } from 'express';

import { AuthCore } from '../plugin/AuthCore';
import { AuthProvider } from '../plugin/AuthProvider';
import { Verdaccio } from '../verdaccio';

import { errorPage, WebFlow } from './WebFlow';

const cliAuthorizeUrl = '/oauth/authorize';
const cliCallbackUrl = 'http://localhost:8239?token=';
const providerId = 'cli';

const pluginAuthorizeUrl = WebFlow.getAuthorizePath(providerId);
const pluginCallbackeUrl = WebFlow.getCallbackPath(providerId);

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
    res.redirect(pluginAuthorizeUrl);
  }

  public async callback(req, res, next) {
    try {
      const redirectUrl = this.getRedirectUrl(req);
      const code = await this.provider.getCode(req);
      const token = await this.provider.getToken(code, redirectUrl);
      const username = await this.provider.getUsername(token);
      const groups = await this.provider.getGroups(token);

      if (this.core.canAuthenticate(username, groups)) {
        const npmToken = await this.verdaccio.issueNpmToken(username, token);
        const cli = cliCallbackUrl + encodeURIComponent(npmToken);
        res.redirect(cli);
      } else {
        res.send(errorPage);
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  private getRedirectUrl(req: Request): string {
    const baseUrl = this.verdaccio.baseUrl || WebFlow.getRequestOrigin(req);
    const path = WebFlow.getCallbackPath(req.params.id);
    return baseUrl + path;
  }
}
