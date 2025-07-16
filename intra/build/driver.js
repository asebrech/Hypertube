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
    constructor(ctx, config) {
        super(ctx, {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            callbackUrl: config.callbackUrl,
        });
        this.config = config;
        this.loadState();
    }
    configureRedirectRequest(request) {
        request.param('response_type', 'code');
        if (this.config.scope?.length) {
            request.param(this.scopeParamName, this.config.scope.join(this.scopesSeparator));
        }
    }
    accessDenied() {
        const err = this.ctx.request.input(this.errorParamName);
        return err === 'access_denied';
    }
    async accessToken() {
        const code = this.ctx.request.input(this.codeParamName);
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code,
            redirect_uri: this.config.callbackUrl,
        });
        const res = await fetch(this.accessTokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token exchange failed: ${res.status} ${text}`);
        }
        const json = (await res.json());
        if (typeof json.access_token !== 'string') {
            throw new Error(`Invalid accessToken response: ${JSON.stringify(json)}`);
        }
        return {
            token: json.access_token,
            type: 'bearer',
        };
    }
    async user() {
        const { token } = await this.accessToken();
        const res = await fetch(this.userInfoUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed fetching user info: ${res.status} ${text}`);
        }
        const info = (await res.json());
        return {
            token: { token, type: 'bearer' },
            id: String(info.id),
            nickName: info.login,
            email: info.email,
            name: `${info.first_name} ${info.last_name}`,
            emailVerificationState: 'unsupported',
            avatarUrl: info.image?.versions.medium ?? null,
            original: info,
        };
    }
    async userFromToken(rawToken) {
        const res = await fetch(this.userInfoUrl, {
            headers: { Authorization: `Bearer ${rawToken}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed fetching user info: ${res.status} ${text}`);
        }
        const info = (await res.json());
        return {
            token: { token: rawToken, type: 'bearer' },
            id: String(info.id),
            nickName: info.login,
            email: info.email,
            name: `${info.first_name} ${info.last_name}`,
            emailVerificationState: 'unsupported',
            avatarUrl: info.image?.versions.medium ?? null,
            original: info,
        };
    }
}
export function intra(config) {
    return (ctx) => new IntraDriver(ctx, config);
}
