<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2>{{ account.name || 'Account Management' }}</h2>
          </div>
            <div class="d-flex align-center">
              <!-- Active Club and top Manage Clubs removed; use the Clubs list below for management -->
            </div>
        </div>
        <v-divider class="my-4" />
        <v-row>
          <v-col cols="12">
            <h3>Account Details</h3>
            <v-card class="pa-4 mb-4">
              <div><strong>{{ account.name }}</strong></div>
              <div class="text-caption">Account ID: {{ account.id }}</div>
              <div class="text-caption">Created: {{ account.created_at || '-' }}</div>
            </v-card>

            <h3>Hunt Clubs</h3>
            <v-list class="elevation-1">
              <v-list-item v-for="c in clubs" :key="c.id">
                <template #default>
                  <v-list-item-title>{{ c.name }}</v-list-item-title>
                  <v-list-item-subtitle class="text--secondary">ID: {{ c.id }}</v-list-item-subtitle>
                </template>
              </v-list-item>
            </v-list>
            <div class="mt-4">
              <v-btn color="primary" @click="gotoClubs">Manage Clubs</v-btn>
            </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3>Owner</h3>
                <v-card class="pa-4">
                  <div><strong>{{ accountOwner ? ((accountOwner.first_name || '') + ' ' + (accountOwner.last_name || '')) : 'Not set' }}</strong></div>
                  <div class="text-caption">Role: {{ accountOwner?.role || 'member' }}</div>
                  <div class="text-caption">Email: {{ accountOwner?.email || '-' }}</div>
                  <div class="text-caption">Phone: {{ accountOwner?.phone || '-' }}</div>
                  <div class="text-caption">Joined: {{ accountOwner?.joined_at || '-' }}</div>
                </v-card>
              </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
// CreatePropertyModal removed — property creation is now club-scoped
import { useRouter } from 'vue-router'

const account = ref({})
// members/properties are handled at the club level; account page shows account and clubs only
// store the full list from the server (kept for other views but not used here)
const allProperties = ref([])
const members = ref([])
const accountOwner = ref(null)
const clubs = ref([])
// selectedClubId and currentClubTitle removed from Account page (no active club selector at top)
// showCreate removed, property creation is club-scoped
const router = useRouter()

  // Account view no longer needs property/member table headers

function viewProperty(id) {
  router.push({ name: 'property-detail', params: { id } })
}

async function load() {
  try {
    const res = await api.get('/me')
    account.value = res.data.account || {}
    // We only need account and club data for this page
    allProperties.value = res.data.properties || []
    members.value = res.data.members || []
    accountOwner.value = (members.value || []).find(m => m.role === 'owner') || (members.value.length ? members.value[0] : null)
    // normalize clubs to simple id/name objects to avoid UI rendering issues
    clubs.value = (res.data.hunt_clubs || []).map(c => ({ id: c.id, name: c.name }))
    if (clubs.value.length) {
      // no default selection required for Account page; club selection is handled on Club pages as needed
    }
      // no filtering required; account page shows account and list of clubs
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || err.message || 'Failed to load account')
  }
}

onMounted(load)

// createProperty removed: property creation happens under club management

// onClubChange and onClubChangeAndReload removed from Account page (managed on Home/Club pages instead)

// Apply filtering for properties and members based on selectedClubId
// applyClubFilter removed: club-level filtering is managed on the club page

function gotoClubs() {
  router.push('/account/clubs')
}

// assignToProperty removed; assignments are handled at club/property views
</script>
