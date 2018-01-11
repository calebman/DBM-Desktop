<template>
  <div id="main" class="app-main">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
      name: 'my-project',
      data () {
          return {
              theme: this.$store.state.theme
          };
      }
  }
</script>

<style>
  /* CSS */
  .app-main{
    width: 100%;
    height: 100%;
  }
</style>
