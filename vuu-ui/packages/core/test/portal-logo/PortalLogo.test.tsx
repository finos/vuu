import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PortalLogo } from "../../src/portal-logo/PortalLogo";

describe("PortalLogo", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const logo = () =>
    container.querySelector<HTMLAnchorElement>("a.vuuPortalLogo");

  it("renders logo content as a link to the portal base url", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <PortalLogo>
            <svg data-logo />
          </PortalLogo>
        </MemoryRouter>,
      );
    });
    expect(logo()?.getAttribute("href")).toBe("/");
    expect(logo()?.getAttribute("aria-label")).toBe("Home");
    expect(logo()?.querySelector("svg[data-logo]")).not.toBeNull();
  });

  it("renders an image logo from src with a custom accessible name", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <PortalLogo alt="Portal home" className="custom" src="/logo.svg" />
        </MemoryRouter>,
      );
    });
    expect(logo()?.getAttribute("aria-label")).toBe("Portal home");
    expect(logo()?.classList.contains("custom")).toBe(true);
    expect(logo()?.querySelector("img")?.getAttribute("src")).toBe("/logo.svg");
  });

  it("navigates back to the portal base url from a module route", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/orders/details"]}>
          <PortalLogo />
          <Routes>
            <Route path="/" element={<p>Portal landing</p>} />
            <Route path="/orders/*" element={<Link to="/">Orders</Link>} />
          </Routes>
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toBe("Orders");
    await act(async () => logo()?.click());
    expect(container.textContent).toBe("Portal landing");
  });
});
