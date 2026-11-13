import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import { getCookieValue } from "@vuu-ui/vuu-utils";

export interface UserProperties {
  userName: string;
}

const openWebsocketConnection = async (url: string, token: string) =>
  ConnectionManager.connect(
    {
      url,
      token,
    },
    true,
  );
export const authentication = async (): Promise<[UserProperties, string[]]> => {
  const token = getCookieValue("vuu-auth-token") as string;
  const userName = getCookieValue("vuu-auth-user") as string;
  console.log({ userName, token });

  const { websocketUrl } = await vuuConfig;
  // const vuuAuth = await getVuuAuthToken(authUrl, accessToken);
  await openWebsocketConnection(websocketUrl, token);

  return [{ userName }, []];
};
