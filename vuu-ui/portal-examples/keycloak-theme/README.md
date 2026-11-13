# Vuu Keycloak login theme

A Keycloak login theme that matches the Vuu login panel design
(Figma: VUU Demo App, node 1173-59963): a deep purple branding panel with the
Vuu logo and the app name on the left, and the sign-in form on the right.

It is CSS only. The theme extends Keycloak's `keycloak.v2` login theme and uses
its templates unchanged:

```
vuu/login/
  theme.properties                  parent=keycloak.v2, adds vuu-login.css, turns off dark mode
  messages/messages_en.properties   "Welcome back", "Log in", "Forgot your password", "Username"
  resources/css/vuu-login.css       all of the styling
  resources/img/vuu-logo.svg        logo (same artwork as vuu-shell VuuLogo)
  resources/fonts/                  Nunito Sans (same file as vuu-theme)
```

Built and checked against Keycloak 26.2.4.

## The app name

The text under the logo is the realm's **Display name**
(Realm settings → General). Set it to the app name, e.g. `Demo App`. It is
shown in upper case.

## Deploying as a JAR

```bash
./build-jar.sh            # version taken from vuu-ui package.json
./build-jar.sh 1.0.0      # or give one
```

This writes `dist/vuu-keycloak-theme-<version>.jar`, containing the theme
under `theme/vuu/` and the `META-INF/keycloak-themes.json` manifest. It needs
`zip`, or a JDK's `jar` tool.

Put the JAR in `/opt/keycloak/providers/`. Keycloak registers new providers
during its build step:

- `kc.sh start` (not optimized) runs the build itself at startup.
- With `kc.sh start --optimized`, for example in a custom image, run
  `kc.sh build` after adding the JAR:

  ```dockerfile
  FROM quay.io/keycloak/keycloak:26.2.4 AS builder
  COPY vuu-keycloak-theme-*.jar /opt/keycloak/providers/
  RUN /opt/keycloak/bin/kc.sh build

  FROM quay.io/keycloak/keycloak:26.2.4
  COPY --from=builder /opt/keycloak/ /opt/keycloak/
  ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
  ```

Then select it in each realm: Realm settings → Themes → Login theme → `vuu`,
or:

```bash
kcadm.sh update realms/vuu -s loginTheme=vuu
```

## Working on the theme

Mount the `vuu` folder as `/opt/keycloak/themes/vuu` and run Keycloak in dev
mode, which turns off theme caching so CSS changes show on a browser reload:

```bash
docker run -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v "$PWD/vuu:/opt/keycloak/themes/vuu" \
  quay.io/keycloak/keycloak:26.2.4 start-dev
```

## Things to know

- The CSS targets `keycloak.v2` markup (PatternFly 5 class names such as
  `pf-v5-c-login__container`, plus `#kc-header-wrapper` and `#kc-form-login`).
  A Keycloak upgrade that changes the login theme's markup or PatternFly
  version needs this CSS rechecked.
- On the login page, "Forgot your password" is moved below the button. It is
  rendered inside the password field group, so that group is flattened with
  `display: contents` and the link is reordered. This is the most
  markup-dependent part of the theme.
- `usernameOrEmail` is relabelled "Username" to match the design. If the realm
  allows email login and you want the label to say so, remove that line from
  `messages_en.properties`.
- Other pages (reset password, OTP, errors, required actions) use the same
  two-panel layout and button styling, but only the login page was designed
  in Figma.
