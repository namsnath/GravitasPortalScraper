$(document).ready(function () {
    //$("#data-table").tabulator();
    $("#data-table").tabulator({
        columns: [
            {title: "Name", field: "name", sortable: true},
            {title: "Phone Number", field: "phno", sortable: false},
            {title: "Type", field: "type", sortable: true},
            {title: "Status", field: "status", sortable: true},
            {title: "Email", field: "email", sortable: false},
        ]
    });

    $.get( "http://localhost:3000/" + window.location.pathname + "/getData", function( data ) {
        $("#data-table").tabulator("setData", data);
    });

    //$("#data-table").tabulator("setData", "http://localhost:3000/" + window.location.pathname + "/getData");

});