// .vitepress/theme/index.js
import DefaultTheme from "vitepress/theme";
import { onMounted, watch, nextTick } from "vue";
import { useRoute, useData } from "vitepress";
import mediumZoom from "medium-zoom";
import Layout from "./Layout.vue";

import "./index.css";

export default {
  ...DefaultTheme,
  Layout,

  setup() {
    const route = useRoute();
    const { page } = useData();

    const initZoom = () => {
      mediumZoom("[data-zoomable]", { background: "var(--vp-c-bg)" });
    };

    // Handle title for blank pages
    watch(
      () => page.value?.frontmatter,
      (frontmatter) => {
        if (frontmatter?.layout === "blank-page") {
          document.title = frontmatter.title ?? "Terms and Conditions";
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      initZoom();
    });
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    );
  },
};
