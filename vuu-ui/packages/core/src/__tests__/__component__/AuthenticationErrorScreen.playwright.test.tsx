import { expect, test } from "../../../../../playwright/fixtures";

test.describe("AuthenticationErrorScreen", () => {
  test("explains that Keycloak can't be reached and what to check", async ({
    mount,
  }) => {
    const component = await mount(
      "VuuPortal/AuthenticationErrorScreen/KeycloakUnavailable",
    );
    const alert = component.getByRole("alert");
    await expect(
      alert.getByRole("heading", { name: "Can't reach the sign-in service" }),
    ).toBeVisible();
    await expect(alert).toContainText("https://localhost:8080");
    await expect(alert.getByRole("listitem")).toHaveText([
      "Keycloak is running.",
      "The browser trusts Keycloak's certificate. Open its address in a new tab to check.",
      "authUrl in the portal's config.json is correct.",
    ]);
  });

  test("shows the technical details on request", async ({ mount }) => {
    const component = await mount(
      "VuuPortal/AuthenticationErrorScreen/KeycloakUnavailable",
    );
    const toggle = component.getByRole("button", { name: "Show details" });
    const details = component.locator(".vuuAuthenticationErrorScreen-details");
    await expect(details).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(details).toBeVisible();
    await expect(details).toHaveText(
      "IdentityProviderUnavailableError: Unable to reach the identity provider at https://localhost:8080\nCaused by TypeError: Failed to fetch",
    );
    await expect(
      component.getByRole("button", { name: "Hide details" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("calls onRetry from Try again", async ({ mount }) => {
    const component = await mount(
      "VuuPortal/AuthenticationErrorScreen/VuuServerUnavailable",
    );
    await expect(
      component.getByRole("heading", { name: "Can't reach the Vuu server" }),
    ).toBeVisible();
    await component.getByRole("button", { name: "Try again" }).click();
    await expect(
      component.page().locator('output[aria-label="Retries"]'),
    ).toHaveText("1");
  });
});
