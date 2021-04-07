import { Config, IBasicAuth, RemoteUser, JWTSignOptions, AuthPluginPackage, Callback, Logger } from '@verdaccio/types';

export { Verdaccio } from './Verdaccio';

export interface IAuthWebUI {
  jwtEncrypt(user: RemoteUser, signOptions: JWTSignOptions): Promise<string>;
  aesEncrypt(buf: Buffer): Buffer;
}

export interface IAuth extends IBasicAuth<Config>, IAuthWebUI {
  config: Config;
  logger: Logger;
  secret: string;
  plugins: any[];
  allow_unpublish(pkg: AuthPluginPackage, user: RemoteUser, callback: Callback): void;
}

export type Auth = IAuth;
export type User = RemoteUser & {
  google_token: string;
};
