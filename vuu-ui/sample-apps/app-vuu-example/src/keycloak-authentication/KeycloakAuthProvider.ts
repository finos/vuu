import type { AuthProvider } from "@vuu-ui/vuu-auth";
import { parseVuuUserFromToken } from "@vuu-ui/vuu-data-remote";
import type { AuthConfig } from '@vuu-ui/vuu-utils';
import Keycloak from 'keycloak-js';
// import { AutoRefreshKeycloakToken } from './AutoRefreshKeycloakToken';



let keycloak: Keycloak;

const getKeycloak = async (authConfig: AuthConfig) => {
    if (!keycloak) {
        keycloak = new Keycloak({
            url: authConfig.authUrl,
            realm: 'vuu',
            clientId: 'vuu-portal'
        })
    }

    // periodically refresh to keep session from expiring
    // new AutoRefreshKeycloakToken(keycloak);

    return keycloak;
}


export class KeycloakAuthProvider implements AuthProvider {
    #firstTimeIn = true;
    constructor(private authConfig: AuthConfig) { }

    login = async () => {
        if (this.#firstTimeIn) {
            const keycloak = await getKeycloak(this.authConfig);
            const authenticated = await keycloak.init({
                onLoad: 'login-required',
                redirectUri: location.origin + location.pathname
            });

            if (!authenticated) {
                throw Error('Keycloak authentication failed')
            }

            this.#firstTimeIn = false;
        } else {
            await keycloak.updateToken();
        }

        const tokenParsed = keycloak.tokenParsed;
        const firstName = tokenParsed?.given_name;
        const lastName = tokenParsed?.family_name;
        const name = tokenParsed?.name;
        const userName = tokenParsed?.preferred_username;
        const { token: bearerToken } = keycloak;
        if (bearerToken) {
            const { authorizations, token } = await this.getVuuTokenWithBearerToken(bearerToken);
            return {
                authorizations,
                bearerToken,
                user: {
                    firstName,
                    lastName,
                    name,
                    userName
                },
                token
            }

        } else {
            throw Error('No bearer token from keycloak')
        }
    }

    async getToken() {
        // need to call keycloak toke exchange service to get minimum permission token
        await keycloak.updateToken();
        if (keycloak.token) {
            return keycloak.token;
        }
        throw Error("No bearer token from keycloak");
    }

    logout() {
        keycloak.logout()
    }


    private async getVuuTokenWithBearerToken(bearerToken: string) {
        try {
            const response = await fetch(this.authConfig.restUrl, {
                headers: { Authorization: `Bearer: ${bearerToken}` },
            });
            if (!response.ok) {
                if (response.status === 503) {
                    throw new Error('Application unavailable');
                } else {
                    throw new Error('Auth token failure');
                }
            }

            const json = await response.json();
            if (!json.token) {
                throw new Error('Missing token in response')
            }

            const { authorizations, name } = parseVuuUserFromToken(json.token);
            return {
                authorizations,
                token: json.token,
                user: { username: name }
            }
        } catch (_e: unknown) {
            throw new Error('Application unavailable');
        }

    }
}