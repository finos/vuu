/**
 * The user data encoded in a VUU authentication token.
 */
export interface VuuUser {
  authorizations: string[];
  name: string;
}

const isValidVuuUser = (response: unknown): response is VuuUser =>
  typeof response === "object" &&
  response !== null &&
  "name" in response &&
  "authorizations" in response &&
  typeof response.name === "string" &&
  Array.isArray(response.authorizations);

export const parseVuuUserFromToken = (token: string): VuuUser => {
  const [base64EncodedVuuUser] = token.split(".");
  const response: unknown = JSON.parse(atob(base64EncodedVuuUser));
  if (isValidVuuUser(response)) {
    return response;
  }
  throw Error("Auth token does not contain a VuuUser");
};
