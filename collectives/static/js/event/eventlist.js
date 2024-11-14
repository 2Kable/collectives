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
   refreshFilterDisplay();
}