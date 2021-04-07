import got from 'got';

import { GoogleOAuth } from './OAuth';
import { GoogleUser } from './User';

export class GoogleClient {
  public constructor(private readonly tokenBaseUrl: string, private readonly userInfoBaseUrl: string) {}

  public requestAccessToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUrl: string
  ): Promise<GoogleOAuth> {
    const url = this.tokenBaseUrl + '/token';
    const options = {
      method: 'POST',
      json: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUrl,
        code,
      },
    } as const;
    return got(url, options)
      .json()
      .catch(e => {
        console.error(e);
        throw e;
      }) as Promise<GoogleOAuth>;
  }

  public requestUser(accessToken: string): Promise<GoogleUser> {
    const url = this.userInfoBaseUrl + '/v1/userinfo';
    const options = {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    } as const;
    return got(url, options)
      .json()
      .catch(e => {
        console.error(e);
        throw e;
      }) as Promise<GoogleUser>;
  }
}
