import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './styles.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'myTheme',
    themes: {
      myTheme: {
        dark: false,
        colors: {
          primary: '#355E3B',
          'primary-darken-1': '#2E4E36',
          secondary: '#2E7D32',
          accent: '#6E4A2C',
          'on-primary': '#ffffff'
        }
      }
    }
  }
})

createApp(App).use(router).use(vuetify).mount('#app')
