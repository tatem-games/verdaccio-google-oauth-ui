import {
  AuthAccessCallback,
  AuthCallback,
  IPluginAuth,
  IPluginMiddleware,
  PackageAccess,
  RemoteUser,
} from '@verdaccio/types';
import { Application } from 'express';

import { CliFlow, WebFlow } from '../flows';
import { GoogleAuthProvider } from '../google';
import { Auth, Verdaccio } from '../verdaccio';

import { AuthCore } from './AuthCore';
import { Cache } from './Cache';
import { Config, validateConfig } from './Config';
import { PatchHtml } from './PatchHtml';
import { ServeStatic } from './ServeStatic';

export class Plugin implements IPluginMiddleware<any>, IPluginAuth<any> {
  private readonly requiredGroup = 'google';
  private readonly provider;
  private readonly cache;
  private readonly verdaccio;
  private readonly core;

  public constructor(private readonly config: Config) {
    validateConfig(config);
    this.provider = new GoogleAuthProvider(this.config);
    this.cache = new Cache(this.provider);
    this.verdaccio = new Verdaccio(this.config);
    this.core = new AuthCore(this.verdaccio, this.config);
  }

  public register_middlewares(app: Application, auth: Auth): void {
    this.verdaccio.setAuth(auth);

    const children = [
      new ServeStatic(),
      new PatchHtml(this.verdaccio),
      new WebFlow(this.verdaccio, this.core, this.provider),
      new CliFlow(this.verdaccio, this.core, this.provider),
    ];

    for (const child of children) {
      child.register_middlewares(app);
    }
  }

  public async authenticate(username: string, token: string, callback: AuthCallback): Promise<void> {
    const groups = await this.cache.getGroups(token);

    if (this.core.canAuthenticate(username, groups)) {
      callback(null, [this.requiredGroup]);
    } else {
      callback(null, false);
    }
  }

  public allow_access(user: RemoteUser, pkg: PackageAccess, callback: AuthAccessCallback): void {
    const requiredGroups = [...(pkg.access || [])];

    if (this.core.canAccess(user.name || 'anonymous', user.groups, requiredGroups)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
}
