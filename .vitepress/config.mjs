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
          {
            text: "Web",
            link: "/integration-guide/web",
            items: [
              { text: "Overlay", link: "/integration-guide/web" },
              { text: "Embedded", link: "/integration-guide/embedded" },
            ],
          },
          {
            text: "Shopify",
            link: "/integration-guide/shopify",
            items: [
              {
                text: "Step by step",
                link: "/integration-guide/shopify/shopify-step-by-step",
              },
            ],
          },
          { text: "Wix", link: "/integration-guide/wix" },
          {
            text: "Mobile",
            link: "/integration-guide/mobile/overview",
            items: [
              {
                text: "Overview",
                link: "/integration-guide/mobile/overview",
              },
              {
                text: "iOS",
                link: "/integration-guide/mobile/ios",
              },
              {
                text: "Android",
                link: "/integration-guide/mobile/android",
              },
            ],
          },
          {
            text: "Partner Integration",
            link: "/integration-guide/partner-integration/overview",
            collapsed: true,
            items: [
              {
                text: "Prerequisites",
                link: "/integration-guide/partner-integration/prerequisites",
              },
              {
                text: "Staging Environment",
                link: "/integration-guide/partner-integration/staging-environment",
              },
              {
                text: "Authentication & Platform Tokens",
                link: "/integration-guide/partner-integration/authentication-and-platform-tokens",
              },
              {
                text: "Rate Limits",
                link: "/integration-guide/partner-integration/rate-limits",
              },
              {
                text: "Publishers API",
                link: "/integration-guide/partner-integration/publishers-api",
              },
              {
                text: "Sites API",
                link: "/integration-guide/partner-integration/sites-api",
              },
              {
                text: "Placements API",
                link: "/integration-guide/partner-integration/placements-api",
              },
              {
                text: "OData API",
                link: "/integration-guide/partner-integration/odata-api",
              },
              {
                text: "Lifecycle Webhooks",
                link: "/integration-guide/partner-integration/lifecycle-webhooks",
              },
              {
                text: "Reporting API",
                link: "/integration-guide/partner-integration/reporting-api",
              },
              {
                text: "Shopify Configurable Ad Unit",
                link: "/integration-guide/partner-integration/shopify-configurable-ad-unit",
              },
              {
                text: "Complete Integration Example",
                link: "/integration-guide/partner-integration/complete-integration-example",
              },
              {
                text: "Error Handling Reference",
                link: "/integration-guide/partner-integration/error-handling-reference",
              },
              {
                text: "Best Practices",
                link: "/integration-guide/partner-integration/best-practices",
              },
              {
                text: "Frequently Asked Questions",
                link: "/integration-guide/partner-integration/frequently-asked-questions",
              },
            ],
          },
        ],
      },
    ],
  },
});
