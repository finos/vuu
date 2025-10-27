import { LoginPanel } from "@vuu-ui/vuu-shell";

import "./LoginPanel.examples.css";

export const DefaultLoginPanel = () => {
  return <LoginPanel onSubmit={() => console.log("onSubmit")} />;
};

export const KeycloakLoginPanel = () => {
  return (
    <div>
      <div id="kc-header">
        <div id="kc-header-wrapper">vuu</div>
      </div>
      <div>
        <header>
          <h1 id="kc-page-title">Sign in to your account</h1>
        </header>
        <div id="kc-content">
          <div id="kc-content-wrapper">
            <div id="kc-form">
              <div id="kc-form-wrapper">
                <form id="kc-form-login">
                  <div>
                    <label htmlFor="username">Username or email</label>
                    <input
                      tabIndex={2}
                      id="username"
                      name="username"
                      value=""
                      type="text"
                      autoComplete="username"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label htmlFor="password">Password</label>
                    <div dir="ltr">
                      <input
                        tabIndex={3}
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label="Show password"
                        aria-controls="password"
                        data-password-toggle=""
                        tabIndex={4}
                        data-icon-show=""
                        data-icon-hide=""
                        data-label-show="Show password"
                        data-label-hide="Hide password"
                      >
                        <i aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                  <div>
                    <div id="kc-form-options"></div>
                    <div></div>
                  </div>
                  <div id="kc-form-buttons">
                    <input
                      type="hidden"
                      id="id-hidden-input"
                      name="credentialId"
                    />
                    <input
                      tabIndex={7}
                      name="login"
                      id="kc-login"
                      type="submit"
                      value="Sign In"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
