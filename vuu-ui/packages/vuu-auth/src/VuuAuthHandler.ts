import type { AuthConfig } from "./AuthConfig";
import type { AuthHandler } from "./AuthHandler";

export class VuuAuthHandler implements AuthHandler {
    constructor(private authConfig: AuthConfig) { }

    authenticate = async () => {

        return { user: { userName: 'admin' } };
    };

    async getIdentityToken() {
        return 'token'
    }

    async logout() {
        console.log('logout')
    }
}
