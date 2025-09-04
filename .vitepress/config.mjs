import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Falcon Ecommerce",
  base: "/",
  description: "Documentation on the Falcon Ecommerce transaction experiences",
  themeConfig: {
    nav: [{ text: "Home", link: "https://falconlabs.us" }],
    sidebar: [
      {
        text: "Getting started",
        link: "/getting-started/overview",
        items: [
          { text: "Overview", link: "/getting-started/overview" },
          { text: "Entities", link: "/getting-started/entities" },
        ],
      },
      {
        text: "Integration Guides",
        link: "/integration-guide/overview",
        items: [
          { text: "Overview", link: "/integration-guide/overview" },
          {
            text: "Web",
            link: "/integration-guide/web",
            items: [
              { text: "Overlay", link: "/integration-guide/web" },
              { text: "Embedded", link: "/integration-guide/embedded" },
            ],
          },
          { text: "Shopify", link: "/integration-guide/shopify" },
          {
            text: "iOS",
            link: "/integration-guide/ios/integration",
            items: [
              {
                text: "Integration",
                link: "/integration-guide/ios/integration",
              },
              {
                text: "Manual SDK Integration",
                link: "/integration-guide/ios/manual",
              },
            ],
          },
          { text: "Android", link: "/integration-guide/android" },
          { text: "Flutter", link: "/integration-guide/flutter" },
          {
            text: "Affiliation",
            link: "/integration-guide/affiliation/",
            items: [
              { text: "Awin", link: "/integration-guide/affiliation/awin" },
            ],
          },
        ],
      },
    ],
  },
});
