<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <div v-if="!isAuthenticated" class="my-12">
          <v-sheet class="home-hero" elevation="0">
            <v-img src="/src/assets/hero.svg" aspect-ratio="5.5" alt="Hero image" cover>
              <template #default>
                <div class="hero-text"></div>
              </template>
            </v-img>
          </v-sheet>
          <div class="auth-links mt-4">
            <router-link to="/login" class="hero-link">Login</router-link>
            <span class="mx-2">•</span>
            <router-link to="/register" class="hero-link">Register</router-link>
          </div>
        </div>

        <div v-else>
          <v-sheet class="home-hero" elevation="0">
            <v-img src="/src/assets/hero.svg" aspect-ratio="5.5" alt="Hero image" cover>
              <template #placeholder>
                <div class="hero-fallback"></div>
              </template>
              <template #default>
                <div class="hero-text"></div>
              </template>
            </v-img>
          </v-sheet>

          <div class="d-flex justify-space-between align-center">
            <div>
              <h1>Welcome back, {{ userFirstName || 'Hunter' }} 👋</h1>
              <div class="text-subtitle-1 text--secondary">Manage your clubs, properties and members</div>
            </div>
            <div class="d-flex gap-2">
              <v-btn color="primary" @click="gotoClubs">Manage Clubs</v-btn>
              <v-btn color="primary" variant="outlined" @click="gotoAccount">Account</v-btn>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import CreatePropertyModal from '../components/CreatePropertyModal.vue'
import { useRouter } from 'vue-router'

const userFirstName = ref('')
const account = ref({})
const clubs = ref([])
const allProperties = ref([])
const properties = ref([])
const members = ref([])
const recentProperties = ref([])
const showCreateProperty = ref(false)
const isAuthenticated = ref(!!localStorage.getItem('token'))

const router = useRouter()

async function load() {
  try {
    const res = await api.get('/me')
    const user = res.data.user || {}
    userFirstName.value = user.first_name || user.email || ''
    account.value = res.data.account || {}
    clubs.value = (res.data.hunt_clubs || []).map(c => ({ id: c.id, name: c.name }))
    allProperties.value = res.data.properties || []
    properties.value = allProperties.value.slice()
    members.value = res.data.members || []
    recentProperties.value = (properties.value || []).slice(0,5)
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  isAuthenticated.value = !!localStorage.getItem('token')
  if (isAuthenticated.value) {
    await load()
  }
})

function gotoClubs() { router.push('/account/clubs') }
function gotoAccount() { router.push('/account') }
function viewProperty(id) { router.push({ name: 'property-detail', params: { id } }) }
</script>

<style scoped>
.text-subtitle-1 { margin-top: 4px; }
.home-hero { border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
.hero-text { display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 24px; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,0.25); }
.hero-title { display: none; }
.hero-title::after { display: none; }
.hero-name { display: none; }
.hero-sub { display: none; }
.hero-fallback { height: 140px; background: linear-gradient(90deg,#8fd3f4,#84fab0); }
.auth-links { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.hero-link { color: var(--v-theme-primary); font-weight: 600; text-decoration: none; }
.hero-link:hover { text-decoration: underline; color: var(--v-theme-primary-darken-1); }
</style>
