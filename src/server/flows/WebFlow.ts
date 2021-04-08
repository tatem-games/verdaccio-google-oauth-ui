import { IPluginMiddleware } from '@verdaccio/types';
import { Application, Handler, Request } from 'express';

import { AuthCore } from '../plugin/AuthCore';
import { AuthProvider } from '../plugin/AuthProvider';
import { Verdaccio } from '../verdaccio';
import { buildAccessDeniedPage, buildErrorPage, buildStatusPage } from '../../statusPage';
import { getAuthorizePath, getCallbackPath } from '../../redirect';

export const errorPage = buildStatusPage(`
  <h1>Access Denied</h1>
  <p>You are not a member of the required org.</p>
  <p><a href="/">Go back</a></p>
`);

export class WebFlow implements IPluginMiddleware<any> {
  public constructor(
    private readonly verdaccio: Verdaccio,
    private readonly core: AuthCore,
    private readonly provider: AuthProvider
  ) {}

  public register_middlewares(app: Application): void {
    app.get(getAuthorizePath(), this.authorize.bind(this));
    app.get(getCallbackPath(), this.callback.bind(this));
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
        res.status(401).send(buildAccessDeniedPage());
      }
    } catch (error) {
      console.error(error);
      res.status(500).send(buildErrorPage(error));
    }
  }

  private getRequestOrigin(req: Request): string {
    const protocal = req.get('X-Forwarded-Proto') || req.protocol;
    return protocal + '://' + req.get('host');
  }

  private getRedirectUrl(req: Request): string {
    const baseUrl = this.verdaccio.baseUrl || this.getRequestOrigin(req);
    const path = getCallbackPath(req.params.id);
    return baseUrl + path;
  }
}
