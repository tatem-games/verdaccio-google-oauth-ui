import { IPluginMiddleware } from '@verdaccio/types';
import { Application, Handler, Request } from 'express';

import { authorizePath, callbackPath } from '../constants';
import { AuthCore } from '../plugin/AuthCore';
import { AuthProvider } from '../plugin/AuthProvider';
import { Verdaccio } from '../verdaccio';
import { buildStatusPage } from '../statusPage';

export const errorPage = buildStatusPage(`
  <h1>Access Denied</h1>
  <p>You are not a member of the required org.</p>
  <p><a href="/">Go back</a></p>
`);

export class WebFlow implements IPluginMiddleware<any> {
  public static getAuthorizePath(id?: string): string {
    return authorizePath + '/' + (id || ':id?');
  }

  public static getCallbackPath(id?: string): string {
    return callbackPath + (id ? '/' + id : '');
  }

  public static getRequestOrigin(req: Request): string {
    const protocal = req.get('X-Forwarded-Proto') || req.protocol;
    return protocal + '://' + req.get('host');
  }

  public constructor(
    private readonly verdaccio: Verdaccio,
    private readonly core: AuthCore,
    private readonly provider: AuthProvider
  ) {}

  public register_middlewares(app: Application): void {
    app.get(WebFlow.getAuthorizePath(), this.authorize);
    app.get(WebFlow.getCallbackPath(), this.callback);
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
    try {
      const redirectUrl = this.getRedirectUrl(req);
      const code = await this.provider.getCode(req);
      const token = await this.provider.getToken(code, redirectUrl);
      const username = await this.provider.getUsername(token);

      if (this.core.canAuthenticate(username, [])) {
        const ui = await this.core.createUiCallbackUrl(username, token);
        res.redirect(ui);
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
