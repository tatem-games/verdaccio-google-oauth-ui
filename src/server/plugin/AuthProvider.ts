import { Request } from 'express';

import { GoogleUser } from '../google';

export interface AuthProvider {
  getId(): string;
  getLoginUrl(callbackUrl: string): string;
  getCode(req: Request): string;
  getToken(code: string, redirectUrl: string): Promise<string>;
  getUser(token: string): Promise<GoogleUser>;
  getUsername(token: string): Promise<string>;
  getGroups(token: string): Promise<string[]>;
}
