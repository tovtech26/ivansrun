(function attachSiteControls(root) {
  const DEFAULT_SITE_CONTENT = {
    hero: {
      eyebrow: "Irunsvan Africa",
      title: "Performance footwear for Africa.",
      copy: "Browse the public range, then unlock live wholesale inventory through an approved Irunsvan Africa reseller account.",
      backgroundImage: "/Flyer Templates/Flyer Template.jpg",
      primaryCta: "View Catalog",
      primaryRoute: "catalog",
      secondaryCta: "Reseller Access",
      secondaryRoute: "apply",
      electricity: true,
    },
    theme: {
      name: "Default Blue",
      primary: "#0070ea",
      primaryDark: "#0059bb",
      background: "#f6f6f4",
      surface: "#ece9e3",
      accent: "#7ddfff",
      text: "#171717",
      deep: "#001a41",
    },
    banner: "Irunsvan Africa reseller accounts can view live stock and submit order requests.",
  };

  const HEX_COLOR = /^#[0-9a-f]{6}$/i;

  function textOrDefault(value, fallback) {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function colorOrDefault(value, fallback) {
    const color = String(value ?? "").trim();
    return HEX_COLOR.test(color) ? color : fallback;
  }

  function imageOrDefault(value, fallback) {
    const image = String(value ?? "").trim();
    if (!image) return fallback;
    if (image.startsWith("/") || image.startsWith("public/") || image.startsWith("Flyer Templates/")) return image;
    if (/^https:\/\/[^\s"']+$/i.test(image)) return image;
    return fallback;
  }

  function sanitizeSiteContent(input = {}) {
    input = input && typeof input === "object" ? input : {};
    const hero = input.hero || {};
    const theme = input.theme || {};

    return {
      hero: {
        eyebrow: textOrDefault(hero.eyebrow, DEFAULT_SITE_CONTENT.hero.eyebrow),
        title: textOrDefault(hero.title, DEFAULT_SITE_CONTENT.hero.title),
        copy: textOrDefault(hero.copy, DEFAULT_SITE_CONTENT.hero.copy),
        backgroundImage: imageOrDefault(hero.backgroundImage, DEFAULT_SITE_CONTENT.hero.backgroundImage),
        primaryCta: textOrDefault(hero.primaryCta, DEFAULT_SITE_CONTENT.hero.primaryCta),
        primaryRoute: textOrDefault(hero.primaryRoute, DEFAULT_SITE_CONTENT.hero.primaryRoute),
        secondaryCta: textOrDefault(hero.secondaryCta, DEFAULT_SITE_CONTENT.hero.secondaryCta),
        secondaryRoute: textOrDefault(hero.secondaryRoute, DEFAULT_SITE_CONTENT.hero.secondaryRoute),
        electricity: hero.electricity === false ? false : DEFAULT_SITE_CONTENT.hero.electricity,
      },
      theme: {
        name: textOrDefault(theme.name, DEFAULT_SITE_CONTENT.theme.name),
        primary: colorOrDefault(theme.primary, DEFAULT_SITE_CONTENT.theme.primary),
        primaryDark: colorOrDefault(theme.primaryDark, DEFAULT_SITE_CONTENT.theme.primaryDark),
        background: colorOrDefault(theme.background, DEFAULT_SITE_CONTENT.theme.background),
        surface: colorOrDefault(theme.surface, DEFAULT_SITE_CONTENT.theme.surface),
        accent: colorOrDefault(theme.accent, DEFAULT_SITE_CONTENT.theme.accent),
        text: colorOrDefault(theme.text, DEFAULT_SITE_CONTENT.theme.text),
        deep: colorOrDefault(theme.deep, DEFAULT_SITE_CONTENT.theme.deep),
      },
      banner: textOrDefault(input.banner, DEFAULT_SITE_CONTENT.banner),
    };
  }

  function themeToCssVars(theme = {}) {
    const safe = sanitizeSiteContent({ theme }).theme;
    return {
      "--blue": safe.primary,
      "--blue-dark": safe.primaryDark,
      "--paper": safe.background,
      "--soft": safe.surface,
      "--soft-2": safe.surface,
      "--ink": safe.text,
      "--brand-deep": safe.deep,
      "--electric": safe.accent,
    };
  }

  function applySiteTheme(theme, targetRoot) {
    if (!targetRoot || !targetRoot.style) return;
    Object.entries(themeToCssVars(theme)).forEach(([property, value]) => {
      targetRoot.style.setProperty(property, value);
    });
  }

  const api = {
    DEFAULT_SITE_CONTENT,
    sanitizeSiteContent,
    themeToCssVars,
    applySiteTheme,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunSiteControls = api;
})(typeof window !== "undefined" ? window : globalThis);
