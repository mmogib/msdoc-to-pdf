<template>
  <v-card class="mx-2" outlined>
    <v-card-title>
      Files
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-search"
        label="Filter"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-layout wrap>
      <v-flex xs6 offset-xs6>
        <div class="text-right mr-4 mt-5">
          <v-btn
            rounded
            block
            :disabled="selected.length===0"
            color="primary"
            @click="convertSelected()"
          >
            Convert
            <v-icon small class="ml-2">mdi-adobe-acrobat</v-icon>
          </v-btn>
        </div>
      </v-flex>
    </v-layout>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="files"
      :single-select="false"
      :expanded.sync="expanded"
      :search="search"
      item-key="name"
      show-select
      show-expand
      @item-selected="itemSelected"
      class="elevation-1"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:expanded-item="{ files, headers }">
        <td>Path:</td>
        <td :colspan="headers.length-1">{{expanded[0] && expanded[0].filePath}}</td>
      </template>

      <template v-slot:item.data.status="{ item }">
        <span v-if="loading" class="red--text">
          <v-progress-linear indeterminate color="deep-purple accent-4"></v-progress-linear>converting...
        </span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import { ipcRenderer as ipc } from "electron"
export default {
  data() {
    return {
      selected: [],
      expanded: [],

      dialog: false,
      search: "",
      headers: [
        {
          text: "Name",
          align: "left",
          sortable: true,
          value: "name"
        },
        { text: "Size", value: "size" },
        { text: "Status", value: "data.status" }
      ],
      editedItem: {
        name: "",
        size: 0,
        data: { status: "" }
      },
      defaultItem: {
        name: "",
        size: 0,
        data: { status: "" }
      }
    }
  },
  computed: {
    folder() {
      return this.$store.state.folder
    },
    files() {
      return this.$store.getters.files
    },
    loading() {
      return this.$store.state.loading
    }
  },
  methods: {
    initialize() {
      console.log("initilizing...")
    },
    itemSelected(item) {
      //console.log(item)
    },

    convertSelected() {
      const files = [...this.selected]
      if (files.length > 0) {
        this.$store.dispatch("START_CONVERTING", {
          baseFolder: this.folder.folder,
          files
        })
      }
    }
  },
  created(){
    ipc.on('done-converting', ()=> {
      this.selected =[]
    })
  }
}
</script>