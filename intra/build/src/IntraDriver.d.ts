import { Oauth2Driver } from '@ioc:Adonis/Addons/Ally';
import type { AllyDriverContract, AllyUserContract, ApiRequestContract } from '@ioc:Adonis/Addons/Ally';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
/**
 * Shape of the access token returned by 42 (Intra)
 */
export type IntraAccessToken = {
    token: string;
    type: 'bearer';
};
/**
 * Scopes supported by 42 (Intra)
 */
export type IntraScopes = 'public' | 'profile';
/**
 * Configuration passed into the driver
 */
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
    constructor(ctx: HttpContextContract, config: IntraDriverConfig);
    accessDenied(): boolean;
    user(callback?: (request: ApiRequestContract) => void): Promise<AllyUserContract<IntraAccessToken>>;
    userFromToken(token: string, callback?: (request: ApiRequestContract) => void): Promise<AllyUserContract<IntraAccessToken>>;
}
/**
 * Factory to wire into config/ally.ts
 */
export declare function intra(config: IntraDriverConfig): (ctx: HttpContextContract) => IntraDriver;
