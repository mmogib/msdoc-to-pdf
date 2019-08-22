<template>
  <v-container>
    <v-layout text-center wrap>
      <v-flex xs12 mb-4>
        <h1 class="display-2 font-weight-bold mb-3">MS Files Convertion</h1>
      </v-flex>
      <v-flex xs12>
        <v-file-input
          v-model="folder"
          webkitdirectory
          placeholder="Select your folder"
          prepend-icon="mdi-paperclip"
          :display-size="1000"
          color="deep-purple accent-4"
          label="File input"
          @change="uploadFile"
        ></v-file-input>
      </v-flex>
      <v-flex xs12>
        <h5>Folder:</h5>
        <span>{{folderName}}</span>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapActions } from "vuex"
export default {
  data: () => ({
    folder: []
  }),
  computed: {
    folderName() {
      return this.$store.state.folder.folder || ""
    }
  },
  methods: {
    ...mapActions({ addFolder: "ADD_FOLDER" }),
    uploadFile(file) {
      if (file) {
        const { name, path } = file

        const date = new Date().toISOString()
        const newFolder = {
          id: `${name}-${date}`,
          date,
          name,
          path
        }
        this.addFolder(newFolder)
      } else {
        this.$store.dispatch("RESET_FOLDER")
      }
    }
  }
}
</script>
