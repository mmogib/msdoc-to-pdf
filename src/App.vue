<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Converting MSDocs Files To PDF</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="font-weight-light">Honeywell HTAL</span>
    </v-app-bar>

    <v-content>
      <UploadFiles />
      <FilesList />
    </v-content>
  </v-app>
</template>

<script>
import UploadFiles from "./components/UploadFiles"
import FilesList from "./components/FilesList"

export default {
  name: "App",
  components: {
    UploadFiles,
    FilesList
  },
  data: () => ({
    //
  })
}
</script>
