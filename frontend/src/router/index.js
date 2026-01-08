import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Account from '../views/Account.vue'
import Clubs from '../views/Clubs.vue'
import Property from '../views/Property.vue'
import Members from '../views/Members.vue'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/account', component: Account, meta: { requiresAuth: true } }
  ,{ path: '/account/clubs', component: Clubs, meta: { requiresAuth: true } }
  ,{ path: '/account/members', component: Members, meta: { requiresAuth: true } }
  ,{ path: '/account/clubs/:clubId/properties', name: 'club-properties', component: Property, meta: { requiresAuth: true } }
  ,{ path: '/account/properties/:id', name: 'property-detail', component: Property, meta: { requiresAuth: true } }
]


const router = createRouter({
  history: createWebHistory(),
  routes
})

// Router guard for protected routes
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) return next('/login')
  }
  next()
})

export default router
