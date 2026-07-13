import { defineConfig } from "vitepress";
import { readFileSync } from "node:fs";

// The left sidebar lives in an editable data file (sidebar.json) so non-devs can
// manage navigation from the CMS ("Navigation" collection in public/admin/config.yml)
// without editing this config. config.mjs just loads it here at build time.
// sidebar.json lives at the repo root (not in .vitepress/) because the CMS file
// scanner skips hidden dot-directories and otherwise can't see/edit it.
const { items: sidebar } = JSON.parse(
  readFileSync(new URL("../sidebar.json", import.meta.url), "utf-8"),
);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Falcon Ecommerce",
  base: "/",
  description: "Documentation on the Falcon Ecommerce transaction experiences",
  srcExclude: ["**/_shared/**"],
  themeConfig: {
    nav: [{ text: "Home", link: "https://falconlabs.us" }],
    sidebar,
  },
});
