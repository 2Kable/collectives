const { ref, inject } = Vue

const selectedCity = ref();
const cities = ref([
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' }
]);

export default {

  props: ["filters"],
  components: {
  },

  setup (props) {
    const displayMoreFilters = ref(false)
    const config = inject('config')

    return {
      displayMoreFilters,
      filters: props.filters,
      config,
      selectedCity, cities,
      value: 100,
      toggleCancelled: () => props.filters.displayCancelled = !props.filters.displayCancelled,
    }
  },
  template: `
  <div class="collectives-list-filters">
    <p-multiselect 
      class="select-activity w-full sm:w-100>" 
      v-model="filters.activities" 
      display="chip" 
      :options="config.activityList" 
      optionLabel="name" 
      optionValue="id"
      filter 
      placeholder="Toutes activités"
    />

    <div 
      v-if="!displayMoreFilters"
      class="toggle-button collectives-list-filters-toggle-label button-primary"
      @click="displayMoreFilters = true"
    >
      + Plus de filtres
    </div>

    <template v-if="displayMoreFilters">

      <p-multiselect 
        class="select-type"
        v-model="filters.eventTypes" 
        :options="config.activityList" 
        optionLabel="name" 
        optionValue="id"
        placeholder="Tout types d'événement"
        display="chip" 
        filter 
      />

      <p-multiselect 
        class="select-tag"
        v-model="filters.eventTags" 
        :options="config.eventTags" 
        optionLabel="name" 
        optionValue="id"
        placeholder="Tous labels"
        display="chip" 
        filter 
      />

      <div class="input date">
        <label class="borders"> 📅 Depuis
          <p-datepicker v-model="filters.date"></p-datepicker>
        </label>
      </div>

      <input class="borders" id="title" type="text" v-model="filters.title" placeholder="🔍 Titre">

      <input class="borders" id="leader" type="text" v-model="filters.leader" placeholder="🔍 Encadrant">

      <div id="cancelled" class="toggle-button font-size-s"  @click="toggleCancelled" :class="{ enabled: filters.displayCancelled }">
        Sorties annulées :
        <span v-if="filters.displayCancelled" class="icon-button display-for-on">affichées <img src="/static/img/icon/ionicon/eye.svg" alt="&#128065"/></span>
        <span v-if="!filters.displayCancelled" class="icon-button display-for-off">cachées <img src="/static/img/icon/ionicon/eye-off.svg"/></span>
      </div>

    </template>
  </div>
  `
}