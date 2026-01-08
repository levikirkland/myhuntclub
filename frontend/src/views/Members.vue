<template>
  <v-container>
    <v-row>
      <v-col class="d-flex justify-end">
        <v-btn text @click="goBack" title="Back">Back</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <h2>Club Members</h2>
        <v-row class="d-flex align-center mb-3">
          <v-col>
            <v-btn color="primary" @click="openCreateMember">Add Member</v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-data-table :headers="headers" :items="members" class="elevation-1">
      <template #item.name="{ item }">
        <strong>{{ item.first_name }} {{ item.last_name }}</strong>
      </template>
      <template #item.email="{ item }">
        <span class="text--secondary">{{ item.email || '—' }}</span>
      </template>
      <template #item.phone="{ item }">
        <span>{{ item.phone || '—' }}</span>
      </template>
      <template #item.address="{ item }">
        <span class="text--secondary">{{ item.address || '—' }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-icon
          class="me-2"
          role="button"
          tabindex="0"
          title="Edit member"
          style="cursor: pointer;"
          @click="openEdit(item)"
          @keydown.enter="openEdit(item)"
        >
          mdi-pencil
        </v-icon>
      </template>
    </v-data-table>

    <!-- Create/Edit Member Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>{{ isEditing ? 'Edit Member' : 'Add Member' }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="isEditing ? saveMember() : createMember()">
            <v-text-field v-model="editing.first_name" label="First Name" required />
            <v-text-field v-model="editing.last_name" label="Last Name" required />
            <v-text-field v-model="editing.email" label="Email" type="email" required />
            <v-text-field v-model="editing.phone" label="Phone" />
            <v-text-field v-model="editing.address" label="Address" />
            <v-text-field v-model="editing.city" label="City" />
            <v-text-field v-model="editing.state" label="State" />
            <v-text-field v-model="editing.zip" label="ZIP" />
            <v-text-field v-model.number="editing.age" label="Age" type="number" />
            <v-checkbox v-model="editing.hunter_safety_completed" label="Hunter Safety Completed" />
            <v-checkbox v-model="editing.hunt_club_bylaws_signed" label="Hunt Club ByLaws Signed" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="isEditing ? saveMember() : createMember()">{{ isEditing ? 'Save' : 'Add' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const members = ref([])
const dialog = ref(false)
const router = useRouter()
const editing = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  age: null,
  hunter_safety_completed: false,
  hunt_club_bylaws_signed: false
})
const isEditing = ref(false)

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account')
  }
}

const headers = [
  { title: 'Name', key: 'name', value: 'name' },
  { title: 'Email', key: 'email', value: 'email' },
  { title: 'Phone', key: 'phone', value: 'phone' },
  { title: 'Address', key: 'address', value: 'address' },
  { title: 'Actions', key: 'actions', value: 'actions' }
]

async function load() {
  try {
    const res = await api.get('/me')
    members.value = res.data.members || []
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to load members')
  }
}

onMounted(load)

function openCreateMember() {
  isEditing.value = false
  editing.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    age: null,
    hunter_safety_completed: false,
    hunt_club_bylaws_signed: false
  }
  dialog.value = true
}

function openEdit(item) {
  isEditing.value = true
  editing.value = {
    id: item.id,
    first_name: item.first_name || '',
    last_name: item.last_name || '',
    email: item.email || '',
    phone: item.phone || '',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
    zip: item.zip || '',
    age: item.age || null,
    hunter_safety_completed: !!item.hunter_safety_completed,
    hunt_club_bylaws_signed: !!item.hunt_club_bylaws_signed
  }
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  isEditing.value = false
}

async function createMember() {
  try {
    const acct = (await api.get('/me')).data.account
    await api.post(`/accounts/${acct.id}/members`, editing.value)
    closeDialog()
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create member')
  }
}

async function saveMember() {
  try {
    const acct = (await api.get('/me')).data.account
    await api.put(`/accounts/${acct.id}/members/${editing.value.id}`, editing.value)
    closeDialog()
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to save member')
  }
}
</script>
