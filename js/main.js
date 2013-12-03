MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Name" }, { "sTitle": "Organization" }, { "sTitle": "Contact" }, { "sTitle": "City" }, { "sTitle": "Project" }, { "sTitle": "organizations" }
];
MyApp.filterIndexes = { "organizations": 1 };
MyApp.Organizations = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/0AhTxmYCYi3fpdGRrelZaT2F0ajBmalJzTlEzQU96dUE/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var name = val.gsx$name.$t;
            var dept = val.gsx$departmentprogram.$t + '<br /><span class="discreet">' + val.gsx$organization.$t + '</span>';
            var orgtype = val.gsx$typeoforganization.$t;
            var website = "<a target='_blank' href='" + val.gsx$personalwebsitelink.$t + "'><i class='icon-globe'></i></a>";
            var email = "<a href='mailto:" + val["gsx$email"].$t + "'><i class='icon-envelope'></i></a>";
            var contact = email + ' ' + (val.gsx$personalwebsitelink.$t ? website : '') + '<br />' + val.gsx$telephone.$t;
            var city = val.gsx$citytown.$t + ', ' + val.gsx$state.$t;
            var project = val.gsx$project1title.$t.trunc(25);

            // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$researchareas.$t;
            
            MyApp.spreadsheetData.push(
                [
                    GenerateResearcherColumn(val), 
                    dept, contact, city, project, orgtype
                ]);

            if ($.inArray(orgtype, MyApp.Organizations) === -1 && orgtype.length !== 0) {
                MyApp.Organizations.push(orgtype);
            }

            /*
            if ($.inArray(keyword, MyApp.keywords) === -1 && keyword.length !== 0) {
                MyApp.keywords.push(keyword);
            }
            */
        });

        MyApp.Organizations.sort();
        //MyApp.keywords.sort();

        createDataTable();
        addFilters();
        researcherPopup();
    });
})

function hideUnavailableOrganizations(){
    var fileredData = MyApp.oTable._('tr', {"filter":"applied"});

    //Get departments available after the filters are set
    MyApp.Organizations = [];
    $.each(fileredData, function (key, val) {
        var org = val[MyApp.filterIndexes["organizations"]];

        if ($.inArray(org, MyApp.Organizations) === -1 && org.length !== 0) {
                MyApp.Organizations.push(org);
        }
    });

    // $(":checkbox", "#organizations").each(function () {
    //     //if a checkbox isn't in the list of available departments, hide it
    //     if ($.inArray(this.name, MyApp.Organizations) === -1) {
    //         $(this).parent().css("display", "none");
    //     } else {
    //         $(this).parent().css("display", "block");
    //     }
    // });
}


function researcherPopup(){
    $("#spreadsheet").popover({ 
        selector: '.researcher-popover',
        trigger: 'hover'
    });
}



function addFilters(){
    var $filter = $("#filter_elements");
    
    $.each(MyApp.Organizations, function (key, val) {
        $filter.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });



    $(".filterrow").on("click", "ul.filterlist", function (e) {
        var filterRegex = "";
        var filterName = this.id;
        var filterIndex = MyApp.filterIndexes[filterName];
        
        var filters = [];
        $("input", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += val.name ; //Use the hat and dollar to require an exact match                
            }
        });

        MyApp.oTable.fnFilter(filterRegex, filterIndex, true, false);
        hideUnavailableOrganizations();
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", "ul.filterlist").each(function () {
            this.checked = false;
        });

        $("#researchfilter").val(0);

        $("ul.filterlist").click();
    });
}

function GenerateResearcherColumn(val /* entry value from spreadsheet */){
    var name = val.gsx$name.$t;
    var title = val.gsx$positiontitle.$t;
        
    //var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
    //var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";
    var allResearchInfo = val.gsx$researchareas.$t;

    var content = allResearchInfo; //could expand content later
    var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";
        
    return researcher;
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
            { "bVisible": false, "aTargets": [ -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}