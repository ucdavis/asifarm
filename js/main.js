MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Name" }, { "sTitle": "Organization" }, { "sTitle": "Department / Program" }, { "sTitle": "City" }, { "sTitle": "Project" }
];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/0AhTxmYCYi3fpdGRrelZaT2F0ajBmalJzTlEzQU96dUE/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var name = val.gsx$name.$t;
            var organization = val.gsx$organization.$t;
            var dept = val.gsx$departmentprogram.$t;
            var city = val.gsx$citytown.$t + ', ' + val.gsx$state.$t;
            var project = val.gsx$project1title.$t;

            // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$researchareas.$t;
            
            MyApp.spreadsheetData.push(
                [
                    // GenerateResearcherColumn(val), 
                    name, organization, dept, city, project
                ]);

            /*
            if ($.inArray(keyword, MyApp.keywords) === -1 && keyword.length !== 0) {
                MyApp.keywords.push(keyword);
            }
            */
        });

        //MyApp.keywords.sort();

        createDataTable();
        // researcherPopup();
        //addFilters();
        //abstractPopup();
    });
})

function abstractPopup() {
    $("#spreadsheet").popover({
        selector: '.abstract-popover',
        trigger: 'hover'
    });
}

function researcherPopup(){
    $("#spreadsheet").popover({ 
        selector: '.researcher-popover',
        trigger: 'hover'
    });
}

function GenerateResearcherColumn(val /* entry value from spreadsheet */){
    var name = val.gsx$name.$t;
        
    //var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
    //var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";
    var allResearchInfo = val.gsx$gsx:positiontitle.$t + ', ' + val.gsx$telephone.$t + ', ' + val.gsx$researchareas.$t;

    var content = research; //could expand content later
    var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a>";
        
    return researcher;
}

function addFilters(){
    var $filter = $("#filter_elements");
    
    $.each(MyApp.keywords, function (key, val) {
        $filter.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });
        
    $filter.on("change", function (e) {
        e.preventDefault();
        var selected = this.name;

        var filterRegex = "";
        var filters = [];

        $("input:checkbox", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += "(^" + val.name + "$)"; //Use the hat and dollar to require an exact match
            }
        });

        console.log(filterRegex);
        MyApp.oTable.fnFilter(filterRegex, 4, true, false);
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", $filter).each(function () {
            this.checked = false;
        });

        $filter.change();
    });
}

function displayCurrentFilters() {
    var $filterAlert = $("#filters");
    
    var filters = "";
    
    $(":checked", "#filter_elements").each(function () {
        if (filters.length !== 0) {
            filters += " + "
        }
        filters += "<strong>" + this.name + "</strong>";
    });

    if (filters.length !== 0) {
        var alert = $("<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " + filters + "</p></div>")

        $filterAlert.html(alert);
        $filterAlert[0].scrollIntoView(true);
    } else {
        $filterAlert.html(null);
    }
}

function createDataTable() {
    //Create a sorter that uses case-insensitive html content
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "link-content-pre": function (a) {
            return $(a).html().trim().toLowerCase();
        },

        "link-content-asc": function (a, b) {
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        },

        "link-content-desc": function (a, b) {
            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        }
    });

    MyApp.oTable = $("#spreadsheet").dataTable({
        "aoColumnDefs": [
            //{ "sType": "link-content", "aTargets": [ 0 ] },
            //{ "bVisible": false, "aTargets": [ -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}