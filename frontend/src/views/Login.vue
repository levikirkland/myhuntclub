<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="login-card">
          <v-card-title class="login-title">Login</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field v-model="email" label="Email" required />
              <v-text-field v-model="password" label="Password" type="password" required />
              <v-btn type="submit" color="primary" class="mt-4">Login</v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn text color="primary" to="/register">Create account</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

async function login() {
  try {
    const res = await api.post('/login', { email: email.value, password: password.value })
    const token = res.data.token
    localStorage.setItem('token', token)
    alert('Logged in')
    // Redirect to home dashboard
    router.push('/home')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Login failed')
  }
}
</script>

<style scoped>
/* Login page styling: match header brand color */
.login-card { overflow: hidden; border-radius: 12px; }
.login-title { background: var(--v-theme-primary); color: var(--v-theme-on-primary); font-family: 'Montserrat', Arial, sans-serif; font-weight: 600; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
 
.login-card .v-label { color: rgba(0,0,0,0.8); }
.login-card .v-input__control input { color: #111; }
</style>
