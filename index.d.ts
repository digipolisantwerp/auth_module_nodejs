/// <reference types="node" />
declare module "@digipolis/auth" {
  import { Router, Application } from "express";

  export interface RouterConfig {
    clientId: string;
    clientSecret: string;
    oauthHost: string;
    basePath?: string;
    defaultScopes?: string[];
    scopeGroups?: Record<string, Record<string, string[]>>;
    refresh?: boolean;
    hooks?: {
      preLogin?: Function[]
      preLogout?: Function[]
      loginSuccess?: Function[]
      logoutSuccess?: Function[]
    };
    errorRedirect?: string;
    key?: string;
    logLevel?: string;
  }

  export interface SsoMiddlewareConfig {
    clientId: string;
    clientSecret: string;
    consentUrl: string;
    key?: string;
    basePath?: string;
    logLevel?: string;
    port?: number;
    ssoCookieName?: string;
    shouldUpgradeAssuranceLevel?: boolean;
  }

  export function createRouter(app: Application, config: RouterConfig): Router;
  export function createSsoMiddleware(config: SsoMiddlewareConfig): any;
}
