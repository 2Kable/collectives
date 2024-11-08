
var locale = window.navigator.userLanguage || window.navigator.language;
var eventsTable;
moment.locale(locale);
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function buildEventsTable() {

    var newSession = true;
    var itemsPerPage = 25;
    try {
        var currentTime = new Date();
        var sessionTime = sessionStorage.getItem("eventlist-sessionDate");
        if (sessionTime) {
            var elapsedMilliseconds = currentTime - Date.parse(sessionTime)
            if(elapsedMilliseconds < 86400 * 1000)
            {
                // Last seen less that a day ago, keep session filters
                newSession = false;

                // Retrieve persisted items per page
                sessionPageSize = sessionStorage.getItem("eventlist-sessionPageSize");
                if(sessionPageSize) {
                    itemsPerPage = parseInt(sessionPageSize)
                }
            }
        }
        sessionStorage.setItem("eventlist-sessionDate", currentTime)
    } catch(error) {}

    eventsTable = new Tabulator("#eventstable", {
        layout:"fitColumns",
        //ajaxURL: '/api/events/',
        ajaxSorting:true,
        ajaxFiltering:true,
        resizableColumns:false,

        persistence:{
            sort: true, //persist column sorting
            filter: true, //persist filter sorting
            page: false, // /!\ page persistence does not work with remote pagination
        },

        // Activate grouping only if we sort by start date
        dataSorting : function(sorters){
            // If eventsTable is not ready to be used: exit
            if(eventsTable == undefined)
                return 0;
            if(sorters[0]['field'] == 'title')
                eventsTable.setGroupBy(false);
            else if (sorters[0]['field'] == 'start')
                eventsTable.setGroupBy(function(data){
                    return moment(data.start).format('dddd D MMMM YYYY').capitalize();
                });
            else
                eventsTable.setGroupBy(sorters[0]['field']);
        },
        pagination : 'remote',
        paginationSize : itemsPerPage,
        paginationSizeSelector:[25, 50, 100],
        pageLoaded :  updatePageURL,

        initialSort: [ {column:"start", dir:"asc"}],
        columns:[
            {title:"Titre", field:"title", sorter:"string"},
            {title:"Date", field:"start", sorter:"string"},
            {title:"Encadrant", field:"leaders", headerSort:false},
        ],
        headerVisible:false,
        rowFormatter: eventRowFormatter,
        groupHeader:function(value, count, data, group){
            return value;
        },

        locale: 'fr-fr',
        langs:{
            "fr-fr":{
                "ajax":{
                    "loading":"Chargement", //ajax loader text
                    "error":"Erreur", //ajax error text
                },
                "pagination":{
                    "page_size":"Collectives par page", //label for the page size select element
                    "first":"Début", //text for the first page button
                    "first_title":"Première Page", //tooltip text for the first page button
                    "last":"Fin",
                    "last_title":"Dernière Page",
                    "prev":"Précédente",
                    "prev_title":"Page Précédente",
                    "next":"Suivante",
                    "next_title":"Page Suivante",
                }
            }
        },
    });

    if(newSession) {
        // Don't keep stored filters about leader, date and title
        // between browser sessions
        removeFilter(eventsTable, 'leaders');
        removeFilter(eventsTable, 'start');
        removeFilter(eventsTable, 'end');
        removeFilter(eventsTable, 'title');

        document.querySelector('#datefilter').value = moment().format("MM/DD/YYYY");
    }

   document.querySelectorAll('.tabulator-paginator button').forEach(function(button){
       button.addEventListener('click', gotoEvents);
   });

   document.querySelectorAll('.tabulator-pages').forEach(function(buttons){
       buttons.addEventListener('click', gotoEvents);
   });

   // Try to extract and set page
   var page = document.location.toString().split('#p')[1];
   eventsTable.modules.ajax.setUrl('/api/events/');
   if(! isNaN(page) ){
       eventsTable.setMaxPage(page); // We extends max page to avoid an error
       eventsTable.setPage(page);
   }
   else{
       eventsTable.setPage(1);
       console.log('No page defined');
   }

   var tailOpts = {locale: "fr", dateFormat: "dd/mm/YYYY", timeFormat: false,};
   tail.DateTime(document.querySelector('#datefilter'), tailOpts);

   refreshFilterDisplay();
}


// Put age number in browser URL
function updatePageURL(){
    var page = eventsTable.getPage();
    var location = document.location.toString().split('#');
    document.location = `${location[0]}#p${page}` ;

    // Persist page size in session
    var pageSize = eventsTable.getPageSize();
    sessionStorage.setItem("eventlist-sessionPageSize", pageSize);
}

function gotoEvents(event){
    // if we are not on top during a load, do not mess with page position
    if(window.scrollY > 50 && event.type !== 'click')
        return 0;

    var position = document.querySelector('#eventlist').getBoundingClientRect().top +  window.scrollY - 60;
    window.scrollTo(    {
        top: position,
        behavior: 'smooth'
    });
}


// Functions to set up autocomplete of leaders

function getLeaderHeaderFilter() {
    return document.querySelector('#leader');
}

function onSelectLeaderAutocomplete(id, val) {
    const searchInput = getLeaderHeaderFilter();
    searchInput.value = val;
}


function removeFilter(table, type){
    table.getFilters().forEach(function(filter){
        if(filter['field'] == type)
            table.removeFilter(filter['field'], filter['type'], filter['value'])
    })
}