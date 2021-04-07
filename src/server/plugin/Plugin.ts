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
import {Auth, User, Verdaccio} from '../verdaccio';

import { AuthCore } from './AuthCore';
import { Cache } from './Cache';
import { Config, validateConfig } from './Config';
import { PatchHtml } from './PatchHtml';
import { ServeStatic } from './ServeStatic';
import {getNotFound} from "@verdaccio/commons-api";

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
    this.core = new AuthCore(this.verdaccio, this.provider);
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

  public async allow_access(user: User, pkg: PackageAccess, callback: any): Promise<void> {
    const requiredGroups = [...(pkg.access || [])];

    if (await this.core.canAccess(user, requiredGroups)) {
      callback(null, true);
    } else {
      callback(getNotFound('Access denided'));
    }
  }
}
