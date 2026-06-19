(function attachSitePublish(root) {
  function buildSitePublishPayloads(siteContent, adminUserId) {
    const about = siteContent.about || {};

    return {
      heroRow: {
        eyebrow: siteContent.hero.eyebrow,
        title: siteContent.hero.title,
        copy: siteContent.hero.copy,
        background_image: siteContent.hero.backgroundImage,
        primary_cta: siteContent.hero.primaryCta,
        primary_route: siteContent.hero.primaryRoute,
        secondary_cta: siteContent.hero.secondaryCta,
        secondary_route: siteContent.hero.secondaryRoute,
        electricity: siteContent.hero.electricity,
        active: true,
        created_by: adminUserId,
      },
      themeRow: {
        name: siteContent.theme.name,
        primary_color: siteContent.theme.primary,
        primary_dark_color: siteContent.theme.primaryDark,
        background_color: siteContent.theme.background,
        surface_color: siteContent.theme.surface,
        accent_color: siteContent.theme.accent,
        text_color: siteContent.theme.text,
        deep_color: siteContent.theme.deep,
        active: true,
        created_by: adminUserId,
      },
      contentRow: {
        about_heading: about.heading || "",
        about_body: about.body || "",
        reseller_banner: siteContent.banner,
        active: true,
        created_by: adminUserId,
      },
    };
  }

  const api = {
    buildSitePublishPayloads,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanSitePublish = api;
})(typeof window !== "undefined" ? window : globalThis);
