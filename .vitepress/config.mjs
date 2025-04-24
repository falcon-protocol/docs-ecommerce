import { defineConfig } from "vitepress"

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Falcon Ecommerce",
	 base: '/',
	description: "Documentation on the Falcon Ecommerce transaction experiences",
	themeConfig: {
		nav: [
			{ text: "Home", link: "https://falconlabs.us" },
		],
		sidebar: [
			{
				text: "Getting started", link: "/getting-started/over-view",
				items: [
					{ text: "Overview", link: "/getting-started/over-view" },
					{ text: "Entities", link: "/getting-started/entities" },
				],
			},
			{
				text: "Integration Guides", link: "/integration-guide/overview",
				items: [
					{ text: "Overview", link: "/integration-guide/overview" },
					{ text: "Web", link: "/integration-guide/web" },
					{ text: "Shopify", link: "/integration-guide/shopify" },
					{ text: "iOS", link: "/integration-guide/ios/integration",
						items: [
							{ text: "Integration", link: "/integration-guide/ios/integration" },
							{ text: "Manual SDK Integration", link: "/integration-guide/ios/manual" },
						],
					},
					{ text: "Android", link: "/integration-guide/android" },
					{ text: "Flutter", link: "/integration-guide/flutter" },
				],
			},
		],
	},
})
