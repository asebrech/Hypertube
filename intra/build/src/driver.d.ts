import { Oauth2Driver } from '@adonisjs/ally';
import type { AllyDriverContract, AllyUserContract, ApiRequestContract } from '@adonisjs/ally';
export type IntraAccessToken = {
    token: string;
    type: 'bearer';
};
export type IntraScopes = 'public' | 'profile';
export type IntraDriverConfig = {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scope?: IntraScopes[];
};
export declare class IntraDriver extends Oauth2Driver<IntraAccessToken, IntraScopes> implements AllyDriverContract<IntraAccessToken, IntraScopes> {
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
    protected configureRedirectRequest(request: ApiRequestContract): void;
    accessDenied(): boolean;
    user(callback?: (req: ApiRequestContract) => void): Promise<AllyUserContract<IntraAccessToken>>;
    userFromToken(token: string, callback?: (req: ApiRequestContract) => void): Promise<AllyUserContract<IntraAccessToken>>;
}
export declare function intra(config: IntraDriverConfig): (ctx: any) => IntraDriver;
