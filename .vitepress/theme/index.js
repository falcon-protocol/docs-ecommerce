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
    const { frontmatter } = useData();
    let zoomInstance = null;

    const initZoom = () => {
      if (zoomInstance) zoomInstance.detach();
      zoomInstance = mediumZoom(".vp-doc img", {
        background: "var(--vp-c-bg)",
      });
    };

    const updateTitle = () => {
      if (frontmatter.value.layout === "blank-page") {
        document.title = frontmatter.value.title || "Falcon Ecommerce";
      }
    };

    onMounted(() => {
      initZoom();
      updateTitle();
    });

    watch(
      () => route.path,
      () => {
        nextTick(() => {
          initZoom();
          updateTitle();
        });
      }
    );
  },
};
