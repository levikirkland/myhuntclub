<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="register-card">
          <v-card-title class="register-title">Register</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="register">
              <v-text-field v-model="email" label="Email" required />
              <v-text-field v-model="password" label="Password" type="password" required />
              <v-text-field v-model="firstName" label="First name" />
              <v-text-field v-model="lastName" label="Last name" />
              <v-text-field v-model="phone" label="Phone" />
              <v-text-field v-model="clubName" label="Club name (creates account)" required />
              <v-btn type="submit" color="primary" class="mt-4">Create account</v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn text color="primary" to="/login">Back to login</v-btn>
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
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const clubName = ref('')
const router = useRouter()

async function register() {
  try {
    const payload = {
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      phone: phone.value,
      clubName: clubName.value
    }
    const res = await api.post('/register', payload)
    // store token if provided and go to account page
    if (res.data?.token) localStorage.setItem('token', res.data.token)
    alert('Account created; you are now logged in')
    router.push('/account')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Registration failed')
  }
}
</script>

<style scoped>
/* Register page styling: match header brand color */
.register-card { overflow: hidden; border-radius: 12px; }
.register-title { background: var(--v-theme-primary); color: var(--v-theme-on-primary); font-family: 'Montserrat', Arial, sans-serif; font-weight: 600; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
 

/* Ensure inputs and labels contrast well */
.register-card .v-label { color: rgba(0,0,0,0.8); }
.register-card .v-input__control input { color: #111; }
</style>
