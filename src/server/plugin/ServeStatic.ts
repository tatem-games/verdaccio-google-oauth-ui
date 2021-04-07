import { IPluginMiddleware } from '@verdaccio/types';
import { Application, static as expressServeStatic } from 'express';

import { publicRoot, staticPath } from '../../constants';

/**
 * Serves additional static assets required to modify the login button.
 */
export class ServeStatic implements IPluginMiddleware<any> {
  /**
   * IPluginMiddleware
   */
  public register_middlewares(app: Application): void {
    app.use(staticPath, expressServeStatic(publicRoot));
  }
}
