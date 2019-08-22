import { ipcRenderer as ipc } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)
const defaultFolder = {
  folder: '',
  files: []
}
export default new Vuex.Store({
  state: {
    folder: defaultFolder,
    loading: false
  },
  getters: {
    files: state => state.folder.files
  },
  mutations: {
    setFolder: (state, payload) => {
      state.folder = { ...payload }
    },
    setLoading: (state, payload) => {
      state.loading = payload
    }
  },
  actions: {
    APP_INIT: ({ commit, state }) => {
      state.loading = true
      ipc.send('get-last-folder')
      ipc.on('got-folder', (e, folder) => {
        commit('setFolder', folder)
        state.loading = false
      })
      ipc.on('folder-saved', (e, folder) => {
        state.loading = true
        ipc.send('get-last-folder')
        state.loading = false
      })
      ipc.on('done-converting', () => {
        state.loading = false
      })
    },

    START_CONVERTING: async ({ state }, payload) => {
      state.loading = false
      ipc.send('start-converting', payload)
    },

    ADD_FOLDER: ({ state }, payload) => {
      state.loading = true
      ipc.send('new-folder', payload)
    },
    RESET_FOLDER: ({ commit }) => {
      commit('setFolder', defaultFolder)
    },
    UPDATE_FILE: (_, payload) => {
      ipc.send('update-file', payload)
    }
  }
})
