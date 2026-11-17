import {
  type Accent,
  Button,
  H1,
  type Mode,
  SaltProviderNext,
  StackLayout,
  Text,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { useId, useState } from "react";
import { describeAuthenticationError } from "./describe-authentication-error";

import authenticationErrorScreenCss from "./AuthenticationErrorScreen.css";

const classBase = "vuuAuthenticationErrorScreen";

export interface AuthenticationErrorScreenProps {
  error: Error;
  /**
   * Light or dark. Defaults to the operating system preference.
   */
  mode?: Mode;
  /**
   * Called by Try again. Defaults to reloading the page, which starts
   * authentication again.
   */
  onRetry?: () => void;
}

const getSystemMode = (): Mode =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const reload = () => location.reload();

const accentPurple = "purple" as Accent;

/** The error, then each cause in turn, for the technical details. */
const getErrorChain = (error: Error) => {
  const lines: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current !== undefined && depth < 5; depth++) {
    if (current instanceof Error) {
      lines.push(`${current.name}: ${current.message}`);
      current = current.cause;
    } else {
      lines.push(String(current));
      current = undefined;
    }
  }
  return lines.join("\nCaused by ");
};

const AuthenticationErrorContent = ({
  error,
  onRetry = reload,
}: Omit<AuthenticationErrorScreenProps, "mode">) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-authentication-error-screen",
    css: authenticationErrorScreenCss,
    window: targetWindow,
  });
  const [showDetails, setShowDetails] = useState(false);
  const titleId = useId();
  const detailsId = useId();
  const { checks, description, title } = describeAuthenticationError(error);

  return (
    <main className={classBase}>
      <section
        aria-labelledby={titleId}
        className={`${classBase}-panel`}
        role="alert"
      >
        <StackLayout gap={2}>
          <div className={`${classBase}-heading`}>
            <Icon className={`${classBase}-icon`} name="error" />
            <H1 id={titleId} styleAs="h2">
              {title}
            </H1>
          </div>
          <Text>{description}</Text>
          {checks.length > 0 ? (
            <div>
              <Text styleAs="label">Check that:</Text>
              <ul className={`${classBase}-checks`}>
                {checks.map((check) => (
                  <li key={check}>
                    <Text>{check}</Text>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className={`${classBase}-actions`}>
            <Button appearance="solid" onClick={onRetry} sentiment="accented">
              Try again
            </Button>
            <Button
              appearance="transparent"
              aria-controls={detailsId}
              aria-expanded={showDetails}
              onClick={() => setShowDetails((show) => !show)}
            >
              {showDetails ? "Hide details" : "Show details"}
            </Button>
          </div>
          <pre
            className={`${classBase}-details`}
            hidden={!showDetails}
            id={detailsId}
          >
            {getErrorChain(error)}
          </pre>
        </StackLayout>
      </section>
    </main>
  );
};

/**
 * Full page message for an error raised while the portal starts up and
 * authenticates, e.g. when Keycloak or the Vuu server can't be reached. It
 * renders its own theme provider, as the application shell isn't mounted.
 */
export const AuthenticationErrorScreen = ({
  mode = getSystemMode(),
  ...props
}: AuthenticationErrorScreenProps) => (
  <SaltProviderNext
    accent={accentPurple}
    corner="rounded"
    density="medium"
    mode={mode}
    theme="vuu-theme"
  >
    <AuthenticationErrorContent {...props} />
  </SaltProviderNext>
);
