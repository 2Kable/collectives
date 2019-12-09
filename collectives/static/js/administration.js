
window.onload = function(){
    var table = new Tabulator("#users-table",
        {
          ajaxURL: '/api/users/',
          layout:"fitColumns",
          columns:[
            {title:"Email", field:"mail", headerFilter:"input", widthGrow:3},
            {title:"Admin", field:"isadmin",  formatter:"tick", widthGrow:1},
            {title:"Enable", field:"enabled",  formatter:"tickCross", widthGrow:1},
            {title:"Roles", field:"roles_uri",  formatter:"link", formatterParams:{label:"Roles"}, widthGrow:1},
    ],});
    console.log("Fin du chargement du tableau");
}
