<script setup lang="ts">
import ChatInterface from './components/ChatInterface.vue'
</script>

<template>
  <div id="app">
    <ChatInterface />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
}

#app {
  height: 100vh;
}
</style>