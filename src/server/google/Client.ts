import got from "got"

import { GoogleOAuth } from "./OAuth"
import { GoogleUser } from "./User"

export class GoogleClient {

  constructor(
    private readonly webBaseUrl: string,
    private readonly tokenBaseUrl: string,
    private readonly userInfoBaseUrl: string,
  ) { }

  /**a
   * `POST /login/oauth/access_token`
   *
   * [Web application flow](bit.ly/2mNSppX).
   */
  requestAccessToken = async (code: string, clientId: string, clientSecret: string): Promise<GoogleOAuth> => {
    const url = this.tokenBaseUrl + "/token"
    const options = {
      method: "POST",
      json: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
    } as const
    return got(url, options).json()
  }

  /**
   * `GET /user`
   *
   * [Get the authenticated user](https://developer.github.com/v3/users/#get-the-authenticated-user)
   */
  requestUser = async (accessToken: string): Promise<GoogleUser> => {
    const url = this.userInfoBaseUrl + "/v2/userinfo"
    const options = {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    } as const
    return got(url, options).json()
  }

}
