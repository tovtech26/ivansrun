const assert = require("node:assert/strict");
const {
  DEFAULT_SITE_CONTENT,
  sanitizeSiteContent,
  themeToCssVars,
} = require("../src/site-controls.js");

const edited = sanitizeSiteContent({
  hero: {
    eyebrow: "Holiday Drop",
    title: "Christmas running deals for Africa.",
    copy: "Seasonal stock and reseller offers are live for approved buyers.",
    primaryCta: "Shop Holiday Range",
    secondaryCta: "Apply for Wholesale",
    electricity: false,
  },
  theme: {
    primary: "#0ea5e9",
    primaryDark: "#0369a1",
    background: "#f0f9ff",
    surface: "#e0f2fe",
    accent: "#38bdf8",
    deep: "#082f49",
  },
});

assert.equal(edited.hero.title, "Christmas running deals for Africa.");
assert.equal(edited.hero.electricity, false);
assert.equal(edited.theme.primary, "#0ea5e9");

const empty = sanitizeSiteContent(null);
assert.equal(empty.hero.title, DEFAULT_SITE_CONTENT.hero.title);
assert.equal(empty.theme.primary, DEFAULT_SITE_CONTENT.theme.primary);

const blank = sanitizeSiteContent({
  hero: {
    title: "",
    primaryCta: "",
  },
  theme: {
    primary: "blue",
    background: "",
  },
});

assert.equal(blank.hero.title, DEFAULT_SITE_CONTENT.hero.title);
assert.equal(blank.hero.primaryCta, DEFAULT_SITE_CONTENT.hero.primaryCta);
assert.equal(blank.theme.primary, DEFAULT_SITE_CONTENT.theme.primary);
assert.equal(blank.theme.background, DEFAULT_SITE_CONTENT.theme.background);

const vars = themeToCssVars(edited.theme);
assert.equal(vars["--blue"], "#0ea5e9");
assert.equal(vars["--blue-dark"], "#0369a1");
assert.equal(vars["--paper"], "#f0f9ff");
assert.equal(vars["--brand-deep"], "#082f49");

console.log("site-controls tests passed");
