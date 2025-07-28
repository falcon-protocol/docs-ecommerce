<script setup>
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";

const { frontmatter } = useData();
</script>

<template>
  <DefaultTheme.Layout v-if="frontmatter.layout !== 'blank-page'" />
  <div v-else class="blank-layout">
    <div class="blank-content">
      <Content />
    </div>
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

.blank-content {
  width: 100%;
}

.blank-content h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

.blank-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--vp-c-text-1);
}

.blank-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.blank-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.blank-content ul {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.blank-content li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.blank-content a {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.blank-content a:hover {
  text-decoration: none;
}
</style>
