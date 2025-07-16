import { Oauth2Driver } from '@adonisjs/ally';
export type IntraAccessToken = {
    token: string;
    type: 'bearer';
};
export type IntraScopes = 'public' | 'profile';
export interface IntraDriverConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scope?: IntraScopes[];
}
export declare class IntraDriver extends Oauth2Driver<IntraAccessToken, IntraScopes> {
    config: IntraDriverConfig;
    protected authorizeUrl: string;
    protected accessTokenUrl: string;
    protected userInfoUrl: string;
    protected codeParamName: string;
    protected errorParamName: string;
    protected stateCookieName: string;
    protected stateParamName: string;
    protected scopeParamName: string;
    protected scopesSeparator: string;
    constructor(ctx: any, config: IntraDriverConfig);
    protected configureRedirectRequest(request: any): void;
    accessDenied(): boolean;
    accessToken(): Promise<IntraAccessToken>;
    user(): Promise<{
        token: IntraAccessToken;
        id: string;
        nickName: string;
        email: string | null;
        name: string;
        emailVerificationState: 'unsupported';
        avatarUrl: string | null;
        original: any;
    }>;
    userFromToken(rawToken: string): Promise<{
        token: IntraAccessToken;
        id: string;
        nickName: string;
        email: string | null;
        name: string;
        emailVerificationState: 'unsupported';
        avatarUrl: string | null;
        original: any;
    }>;
}
export declare function intra(config: IntraDriverConfig): (ctx: any) => IntraDriver;
