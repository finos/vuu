/**
 * The user that owns a viewport, as seen by permission functions and
 * rpc services.
 */
export interface VuuModuleUser {
  authorizations: string[];
  name: string;
}

/**
 * There is no login with local (test) data. The current user stands in for
 * the logged in user, e.g. when evaluating permission filters or recording
 * the user responsible for an action.
 */
const DEFAULT_USER: VuuModuleUser = { name: "user", authorizations: [] };

let currentUser: VuuModuleUser = DEFAULT_USER;

export const getCurrentUser = (): VuuModuleUser => currentUser;

/**
 * Applies to viewports created after the change. Pass undefined to restore
 * the default user.
 */
export const setCurrentUser = (user?: string | VuuModuleUser) => {
  if (user === undefined) {
    currentUser = DEFAULT_USER;
  } else if (typeof user === "string") {
    currentUser = { name: user, authorizations: [] };
  } else {
    currentUser = user;
  }
};
