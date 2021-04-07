import { stringify } from 'querystring';

import { intersection } from 'lodash';

import { User, Verdaccio } from '../verdaccio';

import { Config } from './Config';

export class AuthCore {
  private readonly requiredGroup = 'google';

  public constructor(private readonly verdaccio: Verdaccio, private readonly config: Config) {}

  private createUser(username: string): User {
    return {
      name: username,
      groups: [this.requiredGroup],
      real_groups: [this.requiredGroup],
    };
  }

  public async createUiCallbackUrl(username: string, token: string): Promise<string> {
    const user: User = this.createUser(username);

    const uiToken = await this.verdaccio.issueUiToken(user);
    const npmToken = await this.verdaccio.issueNpmToken(username, token);

    const query = { username, uiToken, npmToken };
    return '/?' + stringify(query);
  }

  public canAuthenticate(username: string, groups: string[]): boolean {
    // check user here
    return true;
  }

  public canAccess(username: string, groups: string[], requiredGroups: string[]): boolean {
    // check user here
    if (requiredGroups.includes('$authenticated')) {
      requiredGroups.push(this.requiredGroup);
    }
    const grantedAccess = intersection(groups, requiredGroups);

    const allow = grantedAccess.length === requiredGroups.length;
    if (!allow) {
      console.error(this.getDeniedMessage(username));
    }
    return allow;
  }

  private getDeniedMessage(username: string): string {
    return `Access denied: User "${username}" is not a member of "${this.requiredGroup}"`;
  }
}
