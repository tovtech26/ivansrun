const assert = require("node:assert/strict");
const { buildSitePublishPayloads } = require("../src/site-publish.js");

assert.deepEqual(
  buildSitePublishPayloads({
    hero: {
      eyebrow: "Irunsvan Africa",
      title: "Built to move Africa.",
      copy: "Wholesale-ready performance footwear.",
      backgroundImage: "/Flyer Templates/Hero.jpg",
      primaryCta: "Shop Catalog",
      primaryRoute: "catalog",
      secondaryCta: "Apply Now",
      secondaryRoute: "apply",
      electricity: true,
    },
    theme: {
      name: "Holiday Blue",
      primary: "#123456",
      primaryDark: "#0f1f2f",
      background: "#f1f2f3",
      surface: "#d0d1d2",
      accent: "#00ccff",
      text: "#111111",
      deep: "#001122",
    },
    about: {
      heading: "About the reseller model",
      body: "Approved partners can browse public products and then unlock private wholesale workflows.",
    },
    banner: "Approved resellers can view live stock.",
  }, "admin-1"),
  {
    heroRow: {
      eyebrow: "Irunsvan Africa",
      title: "Built to move Africa.",
      copy: "Wholesale-ready performance footwear.",
      background_image: "/Flyer Templates/Hero.jpg",
      primary_cta: "Shop Catalog",
      primary_route: "catalog",
      secondary_cta: "Apply Now",
      secondary_route: "apply",
      electricity: true,
      active: true,
      created_by: "admin-1",
    },
    themeRow: {
      name: "Holiday Blue",
      primary_color: "#123456",
      primary_dark_color: "#0f1f2f",
      background_color: "#f1f2f3",
      surface_color: "#d0d1d2",
      accent_color: "#00ccff",
      text_color: "#111111",
      deep_color: "#001122",
      active: true,
      created_by: "admin-1",
    },
    contentRow: {
      about_heading: "About the reseller model",
      about_body: "Approved partners can browse public products and then unlock private wholesale workflows.",
      reseller_banner: "Approved resellers can view live stock.",
      active: true,
      created_by: "admin-1",
    },
  },
);

console.log("site-publish tests passed");
