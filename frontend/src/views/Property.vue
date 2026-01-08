<template>
  <v-container>
    <v-row>
      <v-col class="d-flex justify-end">
        <v-btn text @click="goBack" title="Back">Back</v-btn>
      </v-col>
    </v-row>

    <!-- Club Properties View -->
    <div v-if="isClubPropertiesView">
      <v-row>
        <v-col>
          <h2>Properties for {{ clubName }}</h2>
          <v-row class="d-flex align-center mb-3">
            <v-col>
              <v-btn color="primary" @click="openCreateProperty">Create Property</v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Show property detail if one is selected, otherwise show list -->
      <div v-if="selectedPropertyId">
        <v-row>
          <v-col class="d-flex justify-start mb-3">
            <v-btn text @click="deselectProperty">← Back to Properties</v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-card>
              <v-card-title>
                <div>
                  <div class="text-h5">{{ selectedProperty.name }}</div>
                  <div class="text-subtitle-1 text--secondary">{{ selectedProperty.description }}</div>
                </div>
                <v-spacer />
                <div>
                  <v-icon role="button" title="Edit property" tabindex="0" style="cursor:pointer; margin-right:8px;" @click="openEditProperty" @keydown.enter="openEditProperty">mdi-pencil</v-icon>
                  <v-chip v-for="(t,i) in selectedPropertyTypes" :key="i" class="me-1" small color="primary" variant="tonal">{{ t }}</v-chip>
                </div>
              </v-card-title>
              <v-card-text>
                <div>{{ selectedProperty.address }}</div>
                <div class="text--secondary">{{ selectedProperty.city }} {{ selectedProperty.state }} {{ selectedProperty.zip }}</div>
              </v-card-text>
            </v-card>

            <!-- Edit Property Dialog -->
            <v-dialog v-model="showEditPropertyDialog" max-width="700">
              <v-card>
                <v-card-title>Edit Property</v-card-title>
                <v-card-text>
                  <v-form @submit.prevent="saveEditProperty">
                    <v-text-field v-model="editingProperty.name" label="Name" required />
                    <v-combobox v-model="editingProperty.types" label="Types" multiple chips clearable placeholder="Add types" />
                    <v-textarea v-model="editingProperty.description" label="Description" rows="3" />
                    <v-text-field v-model="editingProperty.address" label="Address" />
                    <v-text-field v-model="editingProperty.city" label="City" />
                    <v-text-field v-model="editingProperty.state" label="State" />
                    <v-text-field v-model="editingProperty.zip" label="ZIP" />
                  </v-form>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="closeEditPropertyDialog">Cancel</v-btn>
                  <v-btn color="primary" @click="saveEditProperty">Save</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <div class="text-h6">Stands</div>
                    <v-spacer />
                    <v-btn small color="primary" @click="showAddStand = true">Add Stand</v-btn>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="standHeaders" :items="selectedPropertyStands">
                      <template #item.assigned="{ item }">
                        <div>
                          <v-chip v-for="(a,i) in assignedForStand(item.id)" :key="i" class="me-1" small color="primary" variant="tonal">
                            {{ a.first_name }} {{ a.last_name }}
                          </v-chip>
                        </div>
                      </template>
                      <template #item.actions="{ item }">
                        <v-select dense :items="membersAssignedToSelectedProperty()" item-title="display_name" item-value="id" label="Assign" hide-details @change="assignStand(item.id, $event)" />
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>
                    <div class="text-h6">Food Plots</div>
                    <v-spacer />
                    <v-btn small color="primary" @click="showAddPlot = true">Add Plot</v-btn>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="plotHeaders" :items="selectedPropertyPlots">
                      <template #item.assigned="{ item }">
                        <div>
                          <v-chip v-for="(a,i) in assignedForPlot(item.id)" :key="i" class="me-1" small color="primary" variant="tonal">
                            {{ a.first_name }} {{ a.last_name }}
                          </v-chip>
                        </div>
                      </template>
                      <template #item.actions="{ item }">
                        <v-select dense :items="membersAssignedToSelectedProperty()" item-title="display_name" item-value="id" label="Assign" hide-details @change="assignPlot(item.id, $event)" />
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-dialog v-model="showAddStand" width="500">
              <v-card>
                <v-card-title>Add Stand</v-card-title>
                <v-card-text>
                  <v-text-field v-model="newStandForProperty.name" label="Name" dense />
                  <v-textarea v-model="newStandForProperty.description" label="Description" dense rows="3" />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="showAddStand = false">Cancel</v-btn>
                  <v-btn color="primary" @click="createStandForProperty">Create</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-dialog v-model="showAddPlot" width="500">
              <v-card>
                <v-card-title>Add Food Plot</v-card-title>
                <v-card-text>
                  <v-text-field v-model="newPlotForProperty.name" label="Name" dense />
                  <v-textarea v-model="newPlotForProperty.description" label="Description" dense rows="3" />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="showAddPlot = false">Cancel</v-btn>
                  <v-btn color="primary" @click="createPlotForProperty">Create</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </div>

      <!-- Properties list -->
      <div v-else>
        <v-data-table :headers="propertyHeaders" :items="propertiesList" class="elevation-1">
          <template #item.name="{ item }">
            <strong>{{ item.name }}</strong>
          </template>
          <template #item.address="{ item }">
            <span class="text--secondary">{{ item.address || '—' }}</span>
          </template>
          <template #item.city="{ item }">
            <span>{{ item.city || '—' }}</span>
          </template>
          <template #item.actions="{ item }">
            <v-icon
              class="me-2"
              role="button"
              tabindex="0"
              title="View details"
              style="cursor: pointer;"
              @click="selectProperty(item)"
              @keydown.enter="selectProperty(item)"
            >
              mdi-eye
            </v-icon>
            <v-icon
              class="me-2"
              role="button"
              tabindex="0"
              title="Manage members"
              style="cursor: pointer;"
              @click="manageMembership(item)"
              @keydown.enter="manageMembership(item)"
            >
              mdi-account-multiple
            </v-icon>
          </template>
        </v-data-table>
      </div>

      <!-- Create Property Dialog -->
      <v-dialog v-model="showCreatePropertyDialog" max-width="700">
        <v-card>
          <v-card-title>Create Property</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveNewProperty">
              <v-text-field v-model="newProperty.name" label="Name" required />
              <v-combobox v-model="newProperty.types" label="Types" multiple chips clearable placeholder="Add types" />
              <v-textarea v-model="newProperty.description" label="Description" rows="3" />
              <v-text-field v-model="newProperty.address" label="Address" />
              <v-text-field v-model="newProperty.city" label="City" />
              <v-text-field v-model="newProperty.state" label="State" />
              <v-text-field v-model="newProperty.zip" label="ZIP" />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click="closeCreatePropertyDialog">Cancel</v-btn>
            <v-btn color="primary" @click="saveNewProperty">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <!-- Property Detail View -->
    <div v-else>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title>
              <div>
                <div class="text-h5">{{ property.name }}</div>
                <div class="text-subtitle-1 text--secondary">{{ property.description }}</div>
              </div>
              <v-spacer />
              <div>
                <v-icon role="button" title="Edit property" tabindex="0" style="cursor:pointer; margin-right:8px;" @click="openEdit" @keydown.enter="openEdit">mdi-pencil</v-icon>
                <v-chip v-for="(t,i) in types" :key="i" class="me-1" small color="primary" variant="tonal">{{ t }}</v-chip>
              </div>
            </v-card-title>
            <v-card-text>
              <div>{{ property.address }}</div>
              <div class="text--secondary">{{ property.city }} {{ property.state }} {{ property.zip }}</div>
            </v-card-text>
          </v-card>

          <!-- Edit Property Dialog -->
          <v-dialog v-model="showEdit" max-width="700">
            <v-card>
              <v-card-title>Edit Property</v-card-title>
              <v-card-text>
                <v-form @submit.prevent="saveEdit">
                  <v-text-field v-model="editing.name" label="Name" required />
                  <v-select v-model="editing.hunt_club_id" :items="clubs" item-title="name" item-value="id" clearable label="Hunt Club (optional)" />
                  <v-combobox v-model="editing.types" label="Types" multiple chips clearable placeholder="Add types" />
                  <v-textarea v-model="editing.description" label="Description" rows="3" />
                  <v-text-field v-model="editing.address" label="Address" />
                  <v-text-field v-model="editing.city" label="City" />
                  <v-text-field v-model="editing.state" label="State" />
                  <v-text-field v-model="editing.zip" label="ZIP" />
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="closeEdit">Cancel</v-btn>
                <v-btn color="primary" @click="saveEdit">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-row class="mt-4">
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>
                  <div class="text-h6">Stands</div>
                  <v-spacer />
                  <v-btn small color="primary" @click="showStand = true">Add Stand</v-btn>
                </v-card-title>
                <v-card-text>
                  <v-data-table :headers="standHeaders" :items="stands">
                    <template #item.assigned="{ item }">
                      <div>
                        <v-chip v-for="(a,i) in assignedForStand(item.id)" :key="i" class="me-1" small color="primary" variant="tonal">
                          {{ a.first_name }} {{ a.last_name }}
                        </v-chip>
                      </div>
                    </template>
                    <template #item.actions="{ item }">
                      <v-select dense :items="membersAssignedToSelectedProperty()" item-title="display_name" item-value="id" label="Assign" hide-details @change="assignStand(item.id, $event)" />
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>
                  <div class="text-h6">Food Plots</div>
                  <v-spacer />
                  <v-btn small color="primary" @click="showPlot = true">Add Plot</v-btn>
                </v-card-title>
                <v-card-text>
                  <v-data-table :headers="plotHeaders" :items="plots">
                    <template #item.assigned="{ item }">
                      <div>
                        <v-chip v-for="(a,i) in assignedForPlot(item.id)" :key="i" class="me-1" small color="primary" variant="tonal">
                          {{ a.first_name }} {{ a.last_name }}
                        </v-chip>
                      </div>
                    </template>
                    <template #item.actions="{ item }">
                      <v-select dense :items="membersAssignedToSelectedProperty()" item-title="display_name" item-value="id" label="Assign" hide-details @change="assignPlot(item.id, $event)" />
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-dialog v-model="showStand" width="500">
            <v-card>
              <v-card-title>Add Stand</v-card-title>
              <v-card-text>
                <v-text-field v-model="newStand.name" label="Name" dense />
                <v-textarea v-model="newStand.description" label="Description" dense rows="3" />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="showStand = false">Cancel</v-btn>
                <v-btn color="primary" @click="createStand">Create</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Add Plot Dialog -->
          <v-dialog v-model="showPlot" width="500">
            <v-card>
              <v-card-title>Add Food Plot</v-card-title>
              <v-card-text>
                <v-text-field v-model="newPlot.name" label="Name" dense />
                <v-textarea v-model="newPlot.description" label="Description" dense rows="3" />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="showPlot = false">Cancel</v-btn>
                <v-btn color="primary" @click="createPlot">Create</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const propertyId = route.params.id
const clubId = route.params.clubId

const isClubPropertiesView = computed(() => !!clubId)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/account')
}

const property = ref({})
const stands = ref([])
const plots = ref([])
const members = ref([])
const standAssignments = ref([])
const plotAssignments = ref([])
const clubs = ref([])
const propertiesList = ref([])
const clubName = ref('')
const selectedPropertyId = ref(null)
const selectedProperty = ref({})
const selectedPropertyStands = ref([])
const selectedPropertyPlots = ref([])
const selectedPropertyStandAssignments = ref([])
const selectedPropertyPlotAssignments = ref([])
const selectedPropertyAssignments = ref([])
const selectedPropertyTypes = ref([])

const showStand = ref(false)
const showPlot = ref(false)
const newStand = ref({ name: '', description: '' })
const newPlot = ref({ name: '', description: '' })
const showAddStand = ref(false)
const showAddPlot = ref(false)
const newStandForProperty = ref({ name: '', description: '' })
const newPlotForProperty = ref({ name: '', description: '' })
const showEditPropertyDialog = ref(false)
const editingProperty = ref({ name: '', types: [], description: '', address: '', city: '', state: '', zip: '' })

const showEdit = ref(false)
const showCreatePropertyDialog = ref(false)
const editing = ref({ name: '', types: [], description: '', address: '', city: '', state: '', zip: '' })
const newProperty = ref({ name: '', types: [], description: '', address: '', city: '', state: '', zip: '' })

const types = ref([])

const standHeaders = [
  { title: 'ID', value: 'id' },
  { title: 'Name', value: 'name' },
  { title: 'Assigned', value: 'assigned', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
]

const plotHeaders = [
  { title: 'ID', value: 'id' },
  { title: 'Name', value: 'name' },
  { title: 'Assigned', value: 'assigned', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
]

const propertyHeaders = [
  { title: 'Name', key: 'name', value: 'name' },
  { title: 'Address', key: 'address', value: 'address' },
  { title: 'City', key: 'city', value: 'city' },
  { title: 'Actions', key: 'actions', value: 'actions' }
]

async function load() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    clubs.value = me.data.hunt_clubs || []

    if (isClubPropertiesView.value) {
      // Load properties for this club
      const club = clubs.value.find(c => c.id === clubId)
      clubName.value = club ? club.name : 'Unknown Club'
      
      // Fetch all properties and filter by club
      const allProps = me.data.properties || []
      propertiesList.value = allProps.filter(p => p.hunt_club_id === clubId)
      // load members for this hunt club so assign dropdowns can show club members
      try {
        const mres = await api.get(`/accounts/${accountId}/huntclubs/${clubId}/members`)
        members.value = (mres.data.members || []).map(m => ({ ...m, display_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() }))
      } catch (e) {
        // fallback to account members if club members endpoint fails
        members.value = me.data.members ? (me.data.members || []).map(m => ({ ...m, display_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() })) : []
      }
    } else {
      // Load specific property details
      const res = await api.get(`/accounts/${accountId}/properties/${propertyId}`)
      property.value = res.data.property || {}
      stands.value = res.data.stands || []
      plots.value = res.data.plots || []
      members.value = (res.data.members || []).map(m => ({ ...m, display_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() }))
      standAssignments.value = res.data.stand_assignments || []
      plotAssignments.value = res.data.plot_assignments || []
      types.value = (property.value.type || '').split(',').filter(Boolean)
      // initialize editing model
      editing.value = {
        name: property.value.name || '',
        hunt_club_id: property.value.hunt_club_id || null,
        types: types.value.slice(),
        description: property.value.description || '',
        address: property.value.address || '',
        city: property.value.city || '',
        state: property.value.state || '',
        zip: property.value.zip || ''
      }
    }
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to load data')
  }
}

onMounted(load)

async function createStand() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    await api.post(`/accounts/${accountId}/properties/${propertyId}/stands`, newStand.value)
    newStand.value = { name: '', description: '' }
    showStand.value = false
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create stand')
  }
}

async function createPlot() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    await api.post(`/accounts/${accountId}/properties/${propertyId}/foodplots`, newPlot.value)
    newPlot.value = { name: '', description: '' }
    showPlot.value = false
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create plot')
  }
}

function openEdit() {
  // populate editing from current property
  editing.value = {
    name: property.value.name || '',
    types: (property.value.type || '').split(',').filter(Boolean),
    description: property.value.description || '',
    address: property.value.address || '',
    city: property.value.city || '',
    state: property.value.state || '',
    zip: property.value.zip || ''
  }
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
}

async function saveEdit() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    const payload = {
      name: editing.value.name,
      type: (editing.value.types || []).join(','),
      hunt_club_id: editing.value.hunt_club_id || null,
      description: editing.value.description,
      address: editing.value.address,
      city: editing.value.city,
      state: editing.value.state,
      zip: editing.value.zip
    }
    await api.put(`/accounts/${accountId}/properties/${propertyId}`, payload)
    showEdit.value = false
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to save property')
  }
}

function openCreateProperty() {
  newProperty.value = { name: '', types: [], description: '', address: '', city: '', state: '', zip: '' }
  showCreatePropertyDialog.value = true
}

function closeCreatePropertyDialog() {
  showCreatePropertyDialog.value = false
  newProperty.value = { name: '', types: [], description: '', address: '', city: '', state: '', zip: '' }
}

async function saveNewProperty() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    const payload = {
      name: newProperty.value.name,
      type: (newProperty.value.types || []).join(','),
      hunt_club_id: clubId,
      description: newProperty.value.description,
      address: newProperty.value.address,
      city: newProperty.value.city,
      state: newProperty.value.state,
      zip: newProperty.value.zip
    }
    await api.post(`/accounts/${accountId}/properties`, payload)
    closeCreatePropertyDialog()
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create property')
  }
}

function selectProperty(item) {
  selectedPropertyId.value = item.id
  selectedProperty.value = { ...item }
  selectedPropertyTypes.value = (item.type || '').split(',').filter(Boolean)
  loadPropertyDetails(item.id)
}

function deselectProperty() {
  selectedPropertyId.value = null
  selectedProperty.value = {}
  selectedPropertyStands.value = []
  selectedPropertyPlots.value = []
  selectedPropertyStandAssignments.value = []
  selectedPropertyPlotAssignments.value = []
}

async function loadPropertyDetails(propId) {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    const res = await api.get(`/accounts/${accountId}/properties/${propId}`)
    selectedPropertyStands.value = res.data.stands || []
    selectedPropertyPlots.value = res.data.plots || []
    selectedPropertyStandAssignments.value = res.data.stand_assignments || []
    selectedPropertyPlotAssignments.value = res.data.plot_assignments || []
    selectedPropertyAssignments.value = res.data.property_assignments || []
    // Ensure members list includes display_name so v-select shows full name
    if (res.data.members) {
      members.value = (res.data.members || []).map(m => ({ ...m, display_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() }))
    }
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to load property details')
  }
}

function openEditProperty() {
  editingProperty.value = {
    name: selectedProperty.value.name || '',
    types: selectedPropertyTypes.value.slice(),
    description: selectedProperty.value.description || '',
    address: selectedProperty.value.address || '',
    city: selectedProperty.value.city || '',
    state: selectedProperty.value.state || '',
    zip: selectedProperty.value.zip || ''
  }
  showEditPropertyDialog.value = true
}

function closeEditPropertyDialog() {
  showEditPropertyDialog.value = false
}

async function saveEditProperty() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    const payload = {
      name: editingProperty.value.name,
      type: (editingProperty.value.types || []).join(','),
      hunt_club_id: clubId,
      description: editingProperty.value.description,
      address: editingProperty.value.address,
      city: editingProperty.value.city,
      state: editingProperty.value.state,
      zip: editingProperty.value.zip
    }
    await api.put(`/accounts/${accountId}/properties/${selectedPropertyId.value}`, payload)
    showEditPropertyDialog.value = false
    await load()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to save property')
  }
}

function assignedForStand(standId) {
  // For club property view
  if (isClubPropertiesView.value) {
    const assigned = selectedPropertyStandAssignments.value.filter(s => s.stand_id === standId)
    return assigned.map(a => members.value.find(m => m.id === a.user_id)).filter(Boolean)
  }
  // For property detail view
  const assigned = standAssignments.value.filter(s => s.stand_id === standId)
  return assigned.map(a => members.value.find(m => m.id === a.user_id)).filter(Boolean)
}

function assignedForPlot(plotId) {
  // For club property view
  if (isClubPropertiesView.value) {
    const assigned = selectedPropertyPlotAssignments.value.filter(p => p.plot_id === plotId)
    return assigned.map(a => members.value.find(m => m.id === a.user_id)).filter(Boolean)
  }
  // For property detail view
  const assigned = plotAssignments.value.filter(p => p.plot_id === plotId)
  return assigned.map(a => members.value.find(m => m.id === a.user_id)).filter(Boolean)
}

function membersAssignedToSelectedProperty() {
  // return members that have a property assignment for the currently selected property
  const ids = new Set((selectedPropertyAssignments.value || []).map(a => a.user_id))
  if (!ids.size) return members.value
  return members.value.filter(m => ids.has(m.id))
}

async function createStandForProperty() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    await api.post(`/accounts/${accountId}/properties/${selectedPropertyId.value}/stands`, newStandForProperty.value)
    newStandForProperty.value = { name: '', description: '' }
    showAddStand.value = false
    await loadPropertyDetails(selectedPropertyId.value)
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create stand')
  }
}

async function createPlotForProperty() {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    await api.post(`/accounts/${accountId}/properties/${selectedPropertyId.value}/foodplots`, newPlotForProperty.value)
    newPlotForProperty.value = { name: '', description: '' }
    showAddPlot.value = false
    await loadPropertyDetails(selectedPropertyId.value)
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to create plot')
  }
}

async function assignStand(standId, userId) {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    // ensure the user is assigned to the property first
    const propId = selectedPropertyId.value || propertyId
    if (propId && !(selectedPropertyAssignments.value || []).find(a => a.user_id === userId)) {
      await api.post(`/accounts/${accountId}/properties/${propId}/assign`, { userId })
      // reload property assignments
      await loadPropertyDetails(propId)
    }
    await api.post(`/accounts/${accountId}/stands/${standId}/assign`, { userId })
    // Reload appropriate data based on context
    if (isClubPropertiesView.value) {
      await loadPropertyDetails(selectedPropertyId.value)
    } else {
      await load()
    }
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to assign stand')
  }
}

async function assignPlot(plotId, userId) {
  try {
    const me = await api.get('/me')
    const accountId = me.data.account.id
    // ensure the user is assigned to the property first
    const propId = selectedPropertyId.value || propertyId
    if (propId && !(selectedPropertyAssignments.value || []).find(a => a.user_id === userId)) {
      await api.post(`/accounts/${accountId}/properties/${propId}/assign`, { userId })
      // reload property assignments
      await loadPropertyDetails(propId)
    }
    await api.post(`/accounts/${accountId}/foodplots/${plotId}/assign`, { userId })
    // Reload appropriate data based on context
    if (isClubPropertiesView.value) {
      await loadPropertyDetails(selectedPropertyId.value)
    } else {
      await load()
    }
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Failed to assign plot')
  }
}

function viewPropertyDetail(item) {
  router.push({ name: 'property-detail', params: { id: item.id } })
}

function manageMembership(item) {
  router.push('/account/members')
}
</script>

<style scoped>
.me-1 { margin-right: 6px; }
</style>
