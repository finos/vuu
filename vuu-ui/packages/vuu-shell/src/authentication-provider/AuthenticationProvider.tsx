import { ConnectionManager, type ConnectionStatus, LostConnectionHandler, type User, VuuAuthenticator, VuuAuthProvider } from "@vuu-ui/vuu-data-remote";
import type { AuthProviderClass } from "@vuu-ui/vuu-data-remote";
import type { AuthConfig } from "@vuu-ui/vuu-utils";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

const INVALID_TOKEN_MESSAGE = "Invalid token";
const USER_SESSION_LIMIT_MESSAGE = 'User session limnit exceeded';


export class UserSessionLimitError extends Error {
    constructor() {
        super(USER_SESSION_LIMIT_MESSAGE);
    }
}

export class InvalidTokenError extends Error {
    constructor() {
        super(INVALID_TOKEN_MESSAGE);
    }
}

export class VuuConnectionError extends Error {
    constructor(connectionStatus: ConnectionStatus) {
        super(`Vuu connection error, connectionStstus: ${connectionStatus}`)
    }
}

const retryIntervalInSeconds = [1, 2, 3, 5, 10, 30, 60, 120, 300];


export const AuthenticatedUserContext = createContext<{
    getBearerToken: () => Promise<string>;
    user: User | null;
    logout: () => void;
}>({
    getBearerToken: () => { throw Error('No AuthenticationProvider has been installed') },
    user: null,
    logout: () => { throw Error('No AuthenticationProvider has been installed') }
})

export interface AuthenticationProviderProps {
    authProviderClass?: AuthProviderClass;
    children: ReactNode;
    authConfig: AuthConfig;
    onError?: (e: UserSessionLimitError | VuuConnectionError) => void;
}

export const AuthenticationProvider = ({ authConfig, authProviderClass = VuuAuthProvider, children, onError }: AuthenticationProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const vuuAuthRef = useRef<VuuAuthenticator | undefined>(undefined);

    const logout = useCallback(() => {
        vuuAuthRef.current?.logout();
    }, [])

    const authProvider = useMemo(() => new authProviderClass(authConfig), [authConfig, authProviderClass])

    useMemo(async () => {

        try {

            const vuuAuth = new VuuAuthenticator({
                authProvider,
                websocketUrl: authConfig.websocketUrl
            });

            vuuAuthRef.current = vuuAuth;

            const [user, permissions] = await vuuAuth.login();

            console.log(`permissions ${permissions.join(",")}`)

            const lostConnectionHandler = new LostConnectionHandler(
                vuuAuth,
                retryIntervalInSeconds
            )

            const onConnectionStatusChange = (connectionStatus: ConnectionStatus) => {
                if (connectionStatus === 'disconnected') {
                    lostConnectionHandler.reconnect().then((status) => {
                        if (status === 'connection-failed') {
                            onError?.(new VuuConnectionError(status))
                        }
                    })
                }
            }

            ConnectionManager.on('connection-status', onConnectionStatusChange);

            setUser(user)



        } catch (e: unknown) {

            const message = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
            switch (message) {
                case USER_SESSION_LIMIT_MESSAGE:
                    onError?.(new UserSessionLimitError());
                    break;
                case INVALID_TOKEN_MESSAGE:
                    onError?.(new InvalidTokenError());
                    break;
                default:
                    console.warn(`[AuthenticationProvider] unhandler error ${message}`);
            }


        }

    }, [authConfig, authProvider, onError])

    const getBearerToken = useCallback(async () => {
        return authProvider.getToken();
    }, [authProvider])

    return user === null ? null : (
        <AuthenticatedUserContext.Provider value={{ getBearerToken, logout, user }}>
            {children}
        </AuthenticatedUserContext.Provider>
    )
}

export const useLoggedInUser = () => {
    const context = useContext(AuthenticatedUserContext);
    if (context.user) {
        return context.user;
    } else {
        throw Error('[AuthenticationProvider] user is not logged in');
    }
}

export const useLogout = () => {
    const context = useContext(AuthenticatedUserContext);
    if (context) {
        return context.logout;
    } else {
        throw Error('[AuthenticationProvider] user is not logged in');
    }
}

export const useBearerToken = () => {
    const context = useContext(AuthenticatedUserContext);
    if (context) {
        return context.getBearerToken;
    } else {
        throw Error('[AuthenticationProvider] user is not logged in');
    }
}