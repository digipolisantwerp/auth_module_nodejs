/// <reference types="node" />
declare module "@digipolis/auth" {
  import { Router, Application } from "express";
  import { LevelWithSilent } from 'pino';

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
    logLevel?: LevelWithSilent;
  }

  export interface SsoMiddlewareConfig {
    clientId: string;
    clientSecret: string;
    consentUrl: string;
    key?: string;
    basePath?: string;
    logLevel?: LevelWithSilent;
    port?: number;
    ssoCookieName?: string;
    shouldUpgradeAssuranceLevel?: boolean;
  }

  function createRouter(app: Application, config: RouterConfig): Router;
  function createSsoMiddleware(config: SsoMiddlewareConfig): Promise<void>;

  export = {
    createRouter,
    createSsoMiddleware,
  };
}
