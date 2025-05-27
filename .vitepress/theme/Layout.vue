<script setup>
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";

const { page } = useData();
</script>

<template>
  <DefaultTheme.Layout v-if="page.frontmatter.layout !== 'blank-page'" />
  <div v-else class="blank-layout">
    <Content />
  </div>
</template>

<style>
.blank-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  align-items: center;
}
</style>
