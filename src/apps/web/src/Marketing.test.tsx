import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthScreen } from "./Auth.js";
import { MarketingSite } from "./Marketing.js";

describe("Doculyra public experience", () => {
  it("presents organisation, evidence-aware intelligence and future business growth", () => {
    const markup = renderToStaticMarkup(<MarketingSite />);

    expect(markup).toContain("Private organisation. Evidence-aware AI.");
    expect(markup).toContain("AI that shows its work.");
    expect(markup).toContain("Doculyra Home");
    expect(markup).toContain("Doculyra Business");
    expect(markup).toContain("Create your workspace");
  });

  it("does not present deferred identity providers as active", () => {
    const markup = renderToStaticMarkup(<AuthScreen initialMode="login" onAuthenticated={() => undefined} />);

    expect(markup).toContain("External identity options are intentionally inactive");
    expect(markup).toMatch(/disabled=""[^>]*title="Available after identity integrations are configured"/);
    expect(markup).toContain("Use a passkey");
  });
});
