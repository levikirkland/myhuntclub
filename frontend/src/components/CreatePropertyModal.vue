<template>
  <v-dialog v-model="showLocal" width="640">
    <template #activator="{ on, attrs }">
      <!-- parent can use v-model:show on component; activator kept for flexibility -->
    </template>

    <v-card>
      <v-card-title>
        <span class="text-h6">Create Property</span>
      </v-card-title>

      <v-card-text>
        <div v-if="!props.selectedClubId" class="mb-4">
          <v-alert type="info" dense text>
            You must select or create a Hunt Club before creating a Property.
          </v-alert>
        </div>
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field v-model="formState.name" label="Property name" required dense />

          <v-combobox
            v-model="formState.types"
            :items="typeOptions"
            label="Type (tags)"
            multiple
            chips
            clearable
            dense
          />

          <v-text-field v-model="formState.address" label="Address" dense />
          <v-text-field v-model="formState.city" label="City" dense />
          <v-text-field v-model="formState.state" label="State" dense />
          <v-text-field v-model="formState.zip" label="ZIP" dense />
          <v-textarea v-model="formState.description" label="Description" rows="3" dense />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="submit" :disabled="!props.selectedClubId" :title="props.selectedClubId ? '' : 'Create or select a Hunt Club first'">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../services/api'

const props = defineProps({
  accountId: { type: [String, Number], required: true },
  selectedClubId: { type: [String, Number], required: false },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['update:show', 'saved'])

const showLocal = ref(props.show)
watch(() => props.show, v => showLocal.value = v)
watch(showLocal, v => emit('update:show', v))

const formState = ref({ name: '', types: [], address: '', city: '', state: '', zip: '', description: '' })
const typeOptions = ['Dove','Deer','Quail','Bear','Fishing']

function close() {
  showLocal.value = false
}

async function submit() {
  if (!formState.value.name) return alert('Name required')

  try {
    const payload = {
      name: formState.value.name,
      // send types as a comma-separated string for backend compatibility
      type: (formState.value.types || []).join(','),
      description: formState.value.description,
      address: formState.value.address,
      city: formState.value.city,
      state: formState.value.state,
      zip: formState.value.zip
    }

    if (!props.selectedClubId) {
      return alert('You must select or create a Hunt Club before creating a property')
    }
    await api.post(`/accounts/${props.accountId}/huntclubs/${props.selectedClubId}/properties`, payload)

    // reset form
    formState.value = { name: '', types: [], address: '', city: '', state: '', zip: '', description: '' }
    emit('saved')
    close()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create property')
  }
}
</script>

<style scoped>
.me-1 { margin-right: 4px; }
</style>
