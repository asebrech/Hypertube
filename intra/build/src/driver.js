// 📁 src/driver.ts
import { Oauth2Driver } from '@adonisjs/ally';
export class IntraDriver extends Oauth2Driver {
    config;
    authorizeUrl = 'https://api.intra.42.fr/oauth/authorize';
    accessTokenUrl = 'https://api.intra.42.fr/oauth/token';
    userInfoUrl = 'https://api.intra.42.fr/v2/me';
    codeParamName = 'code';
    errorParamName = 'error';
    stateCookieName = 'intra_oauth_state';
    stateParamName = 'state';
    scopeParamName = 'scope';
    scopesSeparator = ' ';
    constructor(ctx /* or HttpContextContract */, config) {
        super(ctx, {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            callbackUrl: config.callbackUrl,
        });
        this.config = config;
        this.loadState();
    }
    configureRedirectRequest(request) {
        if (this.config.scope?.length) {
            request.param(this.scopeParamName, this.config.scope.join(this.scopesSeparator));
        }
    }
    accessDenied() {
        return this.ctx.request.input(this.errorParamName) === 'access_denied';
    }
    async user(callback) {
        const { token, type } = await this.accessToken();
        const request = this.httpClient(this.userInfoUrl)
            .header('Authorization', `Bearer ${token}`);
        if (callback)
            callback(request);
        const { body } = await request.get();
        return {
            token,
            type,
            id: body.id,
            nickName: body.login,
            name: `${body.first_name} ${body.last_name}`,
            email: body.email,
            avatarUrl: body.image?.versions?.medium,
            original: body,
        };
    }
    async userFromToken(token, callback) {
        const request = this.httpClient(this.userInfoUrl)
            .header('Authorization', `Bearer ${token}`);
        if (callback)
            callback(request);
        const { body } = await request.get();
        return {
            token,
            type: 'bearer',
            id: body.id,
            nickName: body.login,
            name: `${body.first_name} ${body.last_name}`,
            email: body.email,
            avatarUrl: body.image?.versions?.medium,
            original: body,
        };
    }
}
export function intra(config) {
    return (ctx) => new IntraDriver(ctx, config);
}
