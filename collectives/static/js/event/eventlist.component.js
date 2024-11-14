import EventListItem from './eventlist-item.component.js'
import EventListFilters from './eventlist-filters.component.js'
import { getEvents } from '../api.js'
import moment from 'moment'
import EventListSkeleton from './eventlist-skeleton.component.js'

const { ref, watch, reactive } = Vue

export default {
    setup() {
        const loading = ref(false)
        const eventParams = reactive({
            page: 1,
            pageSize: 25,
        })
        const events = ref([])
        const eventCount = ref(0)

        const eventFilters = reactive({
            activities: [],
            eventTypes: [],
            eventTags: [],
            date: moment().format("DD/MM/YYYY"),
            title: null,
            leader: null,
            displayCancelled: false, 
        })

        function groupByDate(events) {
            return events.reduce((acc, event) => {
                const date = moment(event.start).format("LL")
                if(!acc[date]) acc[date] = []
                acc[date].push(event)
                return acc
            }, {})
        }

        watch([eventParams, eventFilters], async ([params, filters]) => {
            loading.value = true
            const { data } = await getEvents(params, filters)
            events.value = groupByDate(data.data)
            // TODO Improve API
            eventCount.value = data.last_page * params.pageSize
            loading.value = false
        }, { immediate: true })

        function setPage(pageIndex) {
            eventParams.page = (pageIndex / eventParams.pageSize) +1
        }
        function setPageSize(pageSize) {
            eventParams.pageSize = pageSize
        }

        return { 
            events,
            IsLoading: () => loading.value,
            eventParams,
            eventFilters,
            eventCount,
            setPage,
            setPageSize,
        }
    },
    components: {
        EventListItem,
        EventListFilters,
        EventListSkeleton
    },
    template: `
        <div class="collectives-list tabulator">

            <EventListFilters v-bind:filters="eventFilters"/>

            <template v-if="IsLoading()">
                <EventListSkeleton v-for="n in 5" v-bind:eventItem="null" :key="n"/>
            </template>


            <Accordion v-if="!IsLoading()" multiple :value="Object.keys(events)">
                <AccordionPanel :value="date" header="Header" toggleable v-for="(dateEvents, date) in events">
                    <AccordionHeader>{{ date }}</AccordionHeader>
                    <AccordionContent>
                        <EventListItem v-for="eventItem in dateEvents" v-bind:eventItem="eventItem" :key="eventItem.id"/>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <Paginator 
                @update:first="setPage"
                @update:rows="setPageSize"
                :totalRecords="eventCount" 
                :rows="eventParams.pageSize" 
                :rowsPerPageOptions="[25, 50, 100]"
            ></Paginator>

        </div>
    `,
}