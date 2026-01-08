<template>
  <v-app-bar dark elevated app color="primary">
    <router-link to="/" class="brand" aria-label="My Hunt Club home">
      <!-- Small tree cluster (derived from hero artwork) -->
      <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="24" height="24" role="img" aria-hidden="true">
        <!-- trunk -->
        <rect x="52" y="72" width="16" height="24" rx="1" fill="currentColor" />
        <!-- layers (bottom to top) -->
        <path d="M18 82 L60 28 L102 82 Z" fill="currentColor" />
        <path d="M28 62 L60 16 L92 62 Z" fill="currentColor" opacity="0.95" />
        <path d="M40 44 L60 8 L80 44 Z" fill="currentColor" opacity="0.9" />
      </svg>
      <span class="brand-text">My Hunt Club</span>
    </router-link>
    <v-spacer />
      <v-btn text to="/home">Home</v-btn>
      <v-btn text to="/account/clubs" v-if="loggedIn">Clubs</v-btn>
      <v-btn text to="/login" v-if="!loggedIn">Login</v-btn>
      <v-btn text to="/register" v-if="!loggedIn">Register</v-btn>
      <v-btn text v-if="loggedIn" @click="logout">Logout</v-btn>
  </v-app-bar>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loggedIn = ref(false)
onMounted(() => {
  loggedIn.value = !!localStorage.getItem('token')
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('account')
  try { window.location.href = '/login' } catch (e) {}
}
</script>

<style scoped>
/* logo removed — header uses hunter green solid color */
</style>

<style scoped>
/* Ensure header navigation text is white */
:deep(.v-app-bar) :deep(.v-btn) {
  color: var(--v-theme-on-primary) !important;
}

/* Remove dark border/outline/box-shadow from active buttons */
:deep(.v-btn.v-btn--active), :deep(.v-btn.v-item--active) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Optional: subtle hover state for header buttons */
:deep(.v-btn:hover) {
  background: rgba(255,255,255,0.04) !important;
}

/* More specific selectors to ensure content and link nodes are white */
:deep(.v-app-bar) :deep(a.v-btn), :deep(.v-app-bar) :deep(.v-btn) {
  color: var(--v-theme-on-primary) !important;
}
:deep(.v-app-bar) :deep(.v-btn__content), :deep(.v-app-bar) :deep(.v-btn__content) * {
  color: var(--v-theme-on-primary) !important;
}

/* Remove background for active/pressed states */
:deep(.v-btn.v-btn--active), :deep(.v-btn.v-btn--active):hover, :deep(.v-btn.v-item--active) {
  background: transparent !important;
}

.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; margin-left: 12px; cursor: pointer; }
.brand-icon { fill: currentColor; transform: translateY(.5px); }
.brand-text { font-family: 'Montserrat', Arial, sans-serif; font-size: 1.05rem; font-weight: 700; color: var(--v-theme-on-primary); letter-spacing: .2px; }
.brand, .brand * { color: var(--v-theme-on-primary) !important; }
</style>
