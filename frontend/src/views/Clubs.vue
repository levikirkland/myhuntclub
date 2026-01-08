<template>
  <v-container>
    <v-row>
      <v-col class="d-flex justify-end">
        <v-btn text @click="goBack" title="Back to account">Back</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <h2>Hunt Clubs</h2>
        <v-row class="d-flex align-center mb-3">
          <v-col>
            <v-btn color="primary" @click="openCreate">Create Club</v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-data-table :headers="headers" :items="clubs" class="elevation-1">
      <template #item.name="{ item }">
        <strong>{{ item.name }}</strong>
      </template>
      <template #item.description="{ item }">
        <span class="text--secondary">{{ item.description || '—' }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-icon
          class="me-2"
          role="button"
          tabindex="0"
          title="View properties"
          style="cursor: pointer;"
          @click="viewProperties(item)"
          @keydown.enter="viewProperties(item)"
        >
          mdi-home-group
        </v-icon>
        <v-icon
          class="me-2"
          role="button"
          tabindex="0"
          title="Edit club"
          style="cursor: pointer;"
          @click="openEdit(item)"
          @keydown.enter="openEdit(item)"
        >
          mdi-pencil
        </v-icon>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="600">
          <v-card>
            <v-card-title>{{ isEditing ? 'Edit Hunt Club' : 'Create Hunt Club' }}</v-card-title>
            <v-card-text>
              <v-form @submit.prevent="isEditing ? saveEdit() : createClub()">
                <v-text-field v-model="editing.name" label="Club name" required />
                <v-textarea v-model="editing.description" label="Description" rows="3" />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="closeDialog">Cancel</v-btn>
              <v-btn color="primary" @click="isEditing ? saveEdit() : createClub()">{{ isEditing ? 'Save' : 'Create' }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const clubs = ref([])
const account = JSON.parse(localStorage.getItem('account') || 'null') || null
const dialog = ref(false)
const router = useRouter()
const editing = ref({ id: null, name: '', description: '' })
const isEditing = ref(false)

function goBack() {
  // try to go back in history, otherwise navigate to account overview
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account')
  }
}

const headers = [
  { title: 'ID', key: 'id', value: 'id' },
  { title: 'Name', key: 'name', value: 'name' },
  { title: 'Description', key: 'description', value: 'description' },
  { title: 'Actions', key: 'actions', value: 'actions' }
]

async function load() {
  try {
    if (!account || !account.id) {
      // fallback to /me
      const res = await api.get('/me')
      clubs.value = res.data.hunt_clubs || []
      return
    }
    const res = await api.get(`/accounts/${account.id}/huntclubs`)
    clubs.value = res.data.hunt_clubs || []
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to load clubs')
  }
}

onMounted(load)

async function createClub() {
  try {
    const acct = account || (await api.get('/me')).data.account
    await api.post(`/accounts/${acct.id}/huntclubs`, editing.value)
    editing.value = { id: null, name: '', description: '' }
    dialog.value = false
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create club')
  }
}

function openCreate() {
  isEditing.value = false
  editing.value = { id: null, name: '', description: '' }
  dialog.value = true
}

function openEdit(item) {
  isEditing.value = true
  editing.value = { id: item.id, name: item.name || '', description: item.description || '' }
  dialog.value = true
}

function viewProperties(item) {
  router.push({ name: 'club-properties', params: { clubId: item.id } })
}

function closeDialog() {
  dialog.value = false
  isEditing.value = false
  editing.value = { id: null, name: '', description: '' }
}

async function saveEdit() {
  try {
    if (!editing.value.id) return alert('Missing club id')
    const acct = account || (await api.get('/me')).data.account
    await api.put(`/accounts/${acct.id}/huntclubs/${editing.value.id}`, { name: editing.value.name, description: editing.value.description })
    closeDialog()
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to save club')
  }
}
</script>
