import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthScreen } from "./Auth.js";
import { MarketingSite } from "./Marketing.js";
import { LegalPage } from "./Legal.js";

describe("Doculyra public experience", () => {
  it("presents organisation, evidence-aware intelligence and future business growth", () => {
    const markup = renderToStaticMarkup(<MarketingSite />);

    expect(markup).toContain("Private organisation. Evidence-aware AI.");
    expect(markup).toContain("AI that shows its work.");
    expect(markup).toContain("Doculyra Home");
    expect(markup).toContain("Doculyra Business");
    expect(markup).toContain("Create your workspace");
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/terms"');
  });

  it("does not present deferred identity providers as active", () => {
    const markup = renderToStaticMarkup(<AuthScreen initialMode="login" onAuthenticated={() => undefined} />);

    expect(markup).toContain("External identity options are intentionally inactive");
    expect(markup).toMatch(/disabled=""[^>]*title="Available after identity integrations are configured"/);
    expect(markup).toContain("Use a passkey");
  });

  it("publishes distinct privacy and terms pages with truthful preview boundaries", () => {
    const privacy = renderToStaticMarkup(<LegalPage kind="privacy" />);
    const terms = renderToStaticMarkup(<LegalPage kind="terms" />);

    expect(privacy).toContain("Privacy Notice");
    expect(privacy).toContain("30 calendar days");
    expect(privacy).toContain("customer-controlled document encryption");
    expect(terms).toContain("Terms of Use");
    expect(terms).toContain("synthetic or deliberately fabricated test information");
    expect(terms).toContain("must not be treated as legal, financial, tax, insurance, immigration or medical advice");
  });
});
