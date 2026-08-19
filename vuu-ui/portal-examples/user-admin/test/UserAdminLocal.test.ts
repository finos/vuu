import { describe, expect, it } from "vitest";
import moduleContainer from "../../../packages/vuu-data-test/src/core/module/ModuleContainer";
import UserAdmin from "../src/UserAdmin";
import UserAdminLocal from "../src/UserAdminLocal";

describe("UserAdminLocal", () => {
  it("registers the local USER_ADMIN module and exports the production component", () => {
    expect(moduleContainer.get("USER_ADMIN").name).toBe("USER_ADMIN");
    expect(UserAdminLocal).toBe(UserAdmin);
  });
});
