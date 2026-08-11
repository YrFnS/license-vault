/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import en from "../../messages/en/landing.json";
import ar from "../../messages/ar/landing.json";

const locales = [
  { name: "English", messages: en },
  { name: "Arabic", messages: ar },
] as const;

describe("landing navigation labels", () => {
  for (const locale of locales) {
    test(`${locale.name} exposes concise section labels`, () => {
      expect(locale.messages.footer.features.trim()).toBeTruthy();
      expect(locale.messages.howItWorks.title.trim()).toBeTruthy();
      expect(locale.messages.footer.pricing.trim()).toBeTruthy();

      expect(locale.messages.footer.features).not.toBe(
        locale.messages.features.title.split(" ").slice(0, 2).join(" "),
      );
      expect(locale.messages.footer.pricing).not.toBe(
        locale.messages.pricing.title.split(" ").slice(0, 2).join(" "),
      );
    });
  }
});
