import type Keycloak from 'keycloak-js'

const FIVE_MINUTES_AS_MS = 5 * 60 * 1_000;

export class AutoRefreshKeycloakToken {
    #intervalHandle: number;
    constructor(keycloak: Keycloak) {
        this.#intervalHandle = window.setInterval(async () => {
            try {
                const refreshed = await keycloak.updateToken();
                if (refreshed) {
                    console.log('[AutoRefreshKeycloakToken] keycloak token successfully refreshed')
                } else {
                    console.log('[AutoRefreshKeycloakToken] keycloak token refresh requested, token still valid')
                }
            } catch (_e) {
                console.warn('[AutoRefreshKeycloakToken] failed to refresh the token or the session has expired');
                clearInterval(this.#intervalHandle);
                keycloak.logout();
            }

        }, FIVE_MINUTES_AS_MS)
    }
}