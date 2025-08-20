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
  line-height: 1.6;
  background-color: white !important;
  color: black !important;
}

.blank-layout h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: black !important;
}

.blank-layout h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: black !important;
}

.blank-layout h3 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: black !important;
}

.blank-layout p {
  margin-bottom: 1rem;
  color: black !important;
}

.blank-layout ul, .blank-layout ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  color: black !important;
}

.blank-layout li {
  margin-bottom: 0.5rem;
  color: black !important;
}

.blank-layout strong {
  font-weight: 600;
  color: black !important;
}

.blank-layout a {
  color: #007acc !important;
  text-decoration: none;
}

.blank-layout a:hover {
  text-decoration: underline;
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
  list-style-type: disc;
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