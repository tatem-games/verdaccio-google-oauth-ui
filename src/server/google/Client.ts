import fetch from 'node-fetch';

import { GoogleOAuth } from './OAuth';
import { GoogleUser } from './User';

export class GoogleClient {
  public constructor(private readonly tokenBaseUrl: string, private readonly userInfoBaseUrl: string) {}

  public async requestAccessToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUrl: string
  ): Promise<GoogleOAuth> {
    const url = this.tokenBaseUrl + '/token';
    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUrl,
      code,
    };
    const options = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
      },
    }
    const res = await fetch(url, options);
    const json = await res.json();
    return json as GoogleOAuth;
  }

  public async requestUser(accessToken: string): Promise<GoogleUser> {
    const url = this.userInfoBaseUrl + '/v1/userinfo';
    const options = {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    } as const;
    const res = await fetch(url, options);
    const json = await res.json();
    return json as GoogleUser;
  }
}
