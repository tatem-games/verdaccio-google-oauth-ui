import { Request } from "express"
import { stringify } from "querystring"

import { AuthProvider } from "../plugin/AuthProvider"
import { Config, getConfig } from "../plugin/Config"
import { GoogleClient } from "./Client"

export class GoogleAuthProvider implements AuthProvider {

  private readonly clientId = getConfig(this.config, "client-id")
  private readonly clientSecret = getConfig(this.config, "client-secret")
  private readonly requiredDomain = getConfig(this.config, "domain")
  private readonly client = new GoogleClient(this.webBaseUrl, this.tokenBaseUrl, this.userInfoBaseUrl)

  get authBaseUrl(): string {
    return "https://accounts.google.com"
  }

  get tokenBaseUrl(): string {
    return "https://oauth2.googleapis.com"
  }

  get userInfoBaseUrl(): string {
    return "https://openidconnect.googleapis.com"
  }

  constructor(
    private readonly config: Config,
  ) { }

  getId() {
    return "google"
  }

  getLoginUrl(callbackUrl: string) {
    const params = {
      client_id: this.clientId,
      redirect_uri: callbackUrl,
      scope: "openid email profile",
      response_type: "code"
    }
    if(this.requiredDomain) params.hd = this.requiredDomain
    const queryParams = stringify(params)
    return this.authBaseUrl + `/o/oauth2/v2/auth?` + queryParams
  }

  getCode(req: Request) {
    return req.query.code
  }

  async getToken(code: string, redirectUrl: string) {
    const auth = await this.client.requestAccessToken(code, this.clientId, this.clientSecret, redirectUrl)
    return auth.access_token
  }

  async getUsername(token: string) {
    const user = await this.client.requestUser(token)
    return user.email
  }

  async getGroups(token: string) {
    return ['google']
  }

}
