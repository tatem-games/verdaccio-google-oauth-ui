import express from 'express';
import open from 'open';

import { cliPort, cliProviderId } from '../constants';
import { getRegistryUrl, saveNpmToken } from '../npm';
import { getAuthorizePath } from '../redirect';

import { printUsage } from './usage';
import { respondWithCliMessage } from './cli-response';
import { respondWithWebPage } from './web-response';

const registry = getRegistryUrl();
const authorizeUrl = registry + getAuthorizePath(cliProviderId);

if (registry.includes('registry.npmjs.org')) {
  // lgtm [js/incomplete-url-substring-sanitization]
  printUsage();
  process.exit(1);
}

const server = express()
  .get('/', (req, res) => {
    let status = req.query.status as string;
    let email = req.query.email as string;
    let message = req.query.message as string;
    const token = decodeURIComponent(req.query.token as string);

    if (!status) {
      status = 'success';
    }
    try {
      if (status === 'success') {
        saveNpmToken(email, token);
      }
    } catch (error) {
      status = 'error';
      message = error.message;
    }
    respondWithWebPage(status, message, res);
    respondWithCliMessage(status, message);

    server.close();
    process.exit(status === 'success' ? 0 : 1);
  })
  .listen(cliPort, () => open(authorizeUrl));
