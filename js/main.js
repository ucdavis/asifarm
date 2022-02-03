MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
  { sTitle: "Name" },
  { sTitle: "Organization" },
  { sTitle: "Projects" },
  { sTitle: "Contact" },
  { sTitle: "City" },
  { sTitle: "region" },
  { sTitle: "organizations" },
  { sTitle: "researchareas" },
];
MyApp.filterIndexes = { organizations: 6, regions: 5, researcharea: 7 };
(MyApp.Organizations = []), (MyApp.Regions = []), (MyApp.ResearchAreas = []);

/* column mapping for reference
-----
0: "NAME"
1: "POSITION/TITLE"
2: "ORGANIZATION"
3: "Type of Organization "
4: "DEPARTMENT/PROGRAM"
5: "CITY/TOWN"
6: "Region"
7: "STATE"
8: "ZIP"
9: "EMAIL"
10: "PERSONAL WEBSITE LINK"
11: "TELEPHONE"
12: "RESEARCH AREAS"
13: ""
14: "PROJECT #1 TITLE"
15: "Expected Completion Date"
16: "Link to Project Website"
17: "PROJECT #2 TITLE"
18: "Expected Completion Date"
19: "Link to Project Website"
20: "PROJECT #3 TITLE"
21: "Expected Completion Date"
22: "Link to Project Website"
*/

String.prototype.trunc = function (n) {
  return this.substr(0, n - 1) + (this.length > n ? "&hellip;" : "");
};

$(function () {
  var url =
    "https://sheets.googleapis.com/v4/spreadsheets/14tKhBGwwwBkkgpATiCf5jYH5POyQRnM1jqrjCZsdNmE/values/Sheet1?key=AIzaSyA3dk7j-VOX78HlLFqsOEHNL5rDljrMtIA";

  $.getJSON(url, {}, function (data) {
    for (let i = 1; i < data["values"].length; i++) {
      const currRow = data["values"][i];

      var name = currRow[0];
      var title = currRow[1];
      var dept =
        currRow[4] + '<br /><span class="discreet">' + currRow[2] + "</span>";
      var orgtype = currRow[3];
      var website =
        "<a target='_blank' href='" +
        currRow[10] +
        "'><i class='icon-globe'></i></a>";
      var email =
        "<a href='mailto:" + currRow[9] + "'><i class='icon-envelope'></i></a>";
      var contact =
        email + " " + (currRow[10] ? website : "") + "<br />" + currRow[11];
      var city =
        "<span class='city'>" + currRow[5] + ", " + currRow[7] + "</span>";
      var region = currRow[6];
      var researchareas = currRow[12];

      // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$researchareas.$t;

      MyApp.spreadsheetData.push([
        GenerateResearcherColumn(name, title, researchareas),
        dept,
        GenerateProjectColumn(currRow),
        contact,
        city,
        region,
        orgtype,
        researchareas,
      ]);

      if (
        $.inArray(orgtype, MyApp.Organizations) === -1 &&
        orgtype.length !== 0
      ) {
        MyApp.Organizations.push(orgtype);
      }
      if ($.inArray(region, MyApp.Regions) === -1 && region.length !== 0) {
        MyApp.Regions.push(region);
      }

      /*
            if ($.inArray(keyword, MyApp.keywords) === -1 && keyword.length !== 0) {
                MyApp.keywords.push(keyword);
            }
            */

      /* DOH */
      //Add the keywords, which are semi-colon separated. First trim them and then replace the CRLF, then split.
      $.each(
        researchareas
          .trim()
          .replace(/^[\r\n]+|\.|[\r\n]+$/g, "")
          .split(";"),
        function (key, val) {
          val = val.trim(); //need to trim the semi-colon separated values after split

          if ($.inArray(val, MyApp.ResearchAreas) === -1 && val.length !== 0) {
            MyApp.ResearchAreas.push(val);
          }
        }
      );

      MyApp.ResearchAreas.sort();
    }

    MyApp.Organizations.sort();
    MyApp.Regions.sort();
    //MyApp.keywords.sort();

    createDataTable();
    addFilters();
    configurePopups();
  });
});

function hideUnavailableOrganizations() {
  var fileredData = MyApp.oTable._("tr", { filter: "applied" });

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

function configurePopups() {
  $("#spreadsheet").popover({
    selector: ".researcher-popover, .project-popover",
    trigger: "hover",
  });
}

function addFilters() {
  var $organizations = $("#organizations");

  $.each(MyApp.Organizations, function (key, val) {
    $organizations.append(
      '<li><label><input type="checkbox" name="' +
        val +
        '"> ' +
        val +
        "</label></li>"
    );
  });

  var $region = $("#regions");

  $.each(MyApp.Regions, function (key, val) {
    $region.append(
      '<li><label><input type="checkbox" name="' +
        val +
        '"> ' +
        val +
        "</label></li>"
    );
  });

  var $researcharea = $("#researcharea");

  $.each(MyApp.ResearchAreas, function (key, val) {
    $researcharea.append(
      '<li><label><input type="checkbox" name="' +
        val +
        '"> ' +
        val +
        "</label></li>"
    );
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

        filterRegex += val.name; //Use the hat and dollar to require an exact match
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

    $("ul.filterlist").click();
  });
}

function GenerateResearcherColumn(name, title, researchAreas) {
  var allResearchInfo = researchAreas;

  var researcher =
    "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" +
    allResearchInfo +
    "' data-original-title='" +
    name +
    "'>" +
    name +
    "</a><br /><span class='discreet'>" +
    title +
    "</span>";

  return researcher;
}

function GenerateProjectColumn(row /* data from spreadsheet */) {
  var p1Title = row[14] || "";
  var p1Completion = row[15];

  var p2Title = row[17] || "";
  var p2Completion = row[18];

  var p3Title = row[20] || "";
  var p3Completion = row[21];

  var project1title =
    "<span style='font-size: 0.8em;'>" + p1Title.trunc(100) + "</span>";
  var project1details = "Project Completed: " + p1Completion;
  var project1 =
    "<a href='#' class='project-popover' data-toggle='popover' data-content='" +
    project1details +
    "' data-original-title='" +
    p1Title +
    "'>" +
    project1title +
    "</a>";

  var project2title =
    "<span style='font-size: 0.8em;'>" + p2Title.trunc(100) + "</span>";
  var project2details = "Project Completed: " + p2Completion;
  var project2 =
    "<a href='#' class='project-popover' data-toggle='popover' data-content='" +
    project2details +
    "' data-original-title='" +
    p2Title +
    "'>" +
    project2title +
    "</a>";

  var project3title =
    "<span style='font-size: 0.8em;'>" + p3Title.trunc(100) + "</span>";
  var project3details = "Project Completed: " + p3Completion;
  var project3 =
    "<a href='#' class='project-popover' data-toggle='popover' data-content='" +
    project3details +
    "' data-original-title='" +
    p3Title +
    "'>" +
    project3title +
    "</a>";

  var projects =
    project1 + (p2Title ? project2 : "") + (p3Title ? project3 : "");

  //   var allResearchInfo = val.gsx$researchareas.$t;

  // var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";

  return projects;
}

function displayCurrentFilters() {
  var $filterAlert = $("#filters");
  //var regionFilter = $("#regions"); // Wrong selector..?

  var filters = "";

  /*
    if (regionFilter){
        filters += "<strong>" + this.name + "</strong>";
    }
    */

  $("input:checked", "#filterAccordian").each(function () {
    if (filters.length !== 0) {
      filters += " + ";
    }
    filters += "<strong>" + this.name + "</strong>";
  });

  if (filters.length !== 0) {
    var alert = $(
      "<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " +
        filters +
        "</p></div>"
    );

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
      return a < b ? -1 : a > b ? 1 : 0;
    },

    "link-content-desc": function (a, b) {
      return a < b ? 1 : a > b ? -1 : 0;
    },
  });

  MyApp.oTable = $("#spreadsheet").dataTable({
    bAutoWidth: false,
    aoColumnDefs: [
      //{ "sType": "link-content", "aTargets": [ 0 ] },
      { bVisible: false, aTargets: [-2, -3, -1] }, //hide the keywords column for now (the last column, hence -1)
      { sWidth: "20%", aTargets: [0] },
      { sWidth: "20%", aTargets: [1] },
      { sWidth: "30%", aTargets: [2] },
      { sWidth: "20%", aTargets: [3] },
      { sWidth: "10%", aTargets: [4] },
    ],
    iDisplayLength: 25,
    bLengthChange: false,
    aaData: MyApp.spreadsheetData,
    aoColumns: MyApp.headerData,
  });
}
