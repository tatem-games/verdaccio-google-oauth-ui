import { readFileSync } from 'fs';

import { IPluginMiddleware } from '@verdaccio/types';
import { Application, Handler } from 'express';

import { publicRoot, staticPath } from '../../constants';
import { Verdaccio } from '../verdaccio';

/**
 * Injects additional static imports into the DOM with code from the client folder
 * that modifies the login button.
 */
export class PatchHtml implements IPluginMiddleware<any> {
  private readonly scriptTag;
  private readonly styleTag;
  private readonly exports = '<script>var exports = {};</script>';
  private readonly headWithStyle;
  private readonly bodyWithScript;

  public constructor(private readonly verdaccio: Verdaccio) {
    this.scriptTag = `<script type="module" src="${staticPath}/verdaccio-${this.verdaccio.majorVersion}.js"></script>`;
    this.styleTag = `<style>${readFileSync(`${publicRoot}/verdaccio-${this.verdaccio.majorVersion}.css`)}</style>`;
    this.headWithStyle = [this.styleTag, '</head>'].join('');
    this.bodyWithScript = [this.exports, this.scriptTag, '</body>'].join('');
  }

  /**
   * IPluginMiddleware
   */
  public register_middlewares(app: Application): void {
    app.use(this.patchResponse.bind(this));
  }

  /**
   * Patches `res.send` in order to inject style and script tags.
   */
  private patchResponse(req, res, next) {
    const send = res.send;
    res.send = html => {
      html = this.insertTags(html);
      return send.call(res, html);
    };
    next();
  }

  private insertTags(html: string | Buffer): string {
    html = String(html);
    if (!html.includes('VERDACCIO_API_URL')) {
      return html;
    }
    return html.replace(/<\/head>/, this.headWithStyle).replace(/<\/body>/, this.bodyWithScript);
  }
}
