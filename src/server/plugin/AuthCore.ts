import { stringify } from 'querystring';

import { User, Verdaccio } from '../verdaccio';

import { AuthProvider } from './AuthProvider';

export class AuthCore {
  private readonly groups = ['google', '$all', '$authenticated', '@all', '@authenticated', 'all'];

  public constructor(private readonly verdaccio: Verdaccio, private readonly provider: AuthProvider) {}

  public createUser(username: string, token: string): User {
    return {
      name: username,
      google_token: token,
      groups: this.groups,
      real_groups: this.groups,
    };
  }

  public async createUiCallbackUrl(username: string, token: string): Promise<string> {
    const user: User = this.createUser(username, token);

    const uiToken = await this.verdaccio.issueUiToken(user);
    const npmToken = await this.verdaccio.issueNpmToken(user);

    const query = { username, uiToken, npmToken };
    return '/?' + stringify(query);
  }

  public canAuthenticate(username: string, groups: string[]): boolean {
    // check user here
    return true;
  }

  public async canAccess(user: User, requiredGroups: string[]): Promise<boolean> {
    const groups = await this.provider.getGroups(user.google_token);
    requiredGroups.concat(groups);
    const allow = requiredGroups.every(g => user.real_groups.includes(g));

    if (!allow) {
      console.error(this.getDeniedMessage(user.name || 'anonymous', groups));
    }
    return allow;
  }

  private getDeniedMessage(username: string, groups: string[]): string {
    return `Access denied: User "${username}" is not a member of "${groups.join(', ')}"`;
  }
}
