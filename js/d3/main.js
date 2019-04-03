//environment constructor
// e : env, d : default, r : radius, c : current
mymap = null;
view_type = 0; // 0 : graph, 1 : geospatial
layout_type = 0; // 0 : normal, 1 : tree, 2 : radial
social_type = 0;//0: normal, 1:degree, 2:centrality, 3:pagerank
json_file = "normal_data2.json";
w = window.innerWidth;
h = window.innerHeight;
e_color = d3.scaleOrdinal(d3.schemeCategory20);
depth_color = "grey";
depth_colors = [depth_color];
max_depth = 1;
d_img = "";
jdata = [];//json data from filedialog.

//initial screen size
$('#map-zone').css("display", "none");
$('#map-zone').css("width", w);
$('#map-zone').css("height", h);

$(document).ready(() => {
    
    d3.select("svg").on("dblclick.zoom", null);
    function readJsonFile(evt) {
        //Retrieve the first (and only!) File from the FileList object
        var f = evt.target.files[0];
        json_file = f.name;
        draw_standard_layout(json_file);
    }
    document.getElementById('fileinput').addEventListener('change', readJsonFile, false);
    function set_social_view() {
        view_type = 0;
        console.log("aaa")
        $('#map-zone').css("display", "none");

        $('#svg-zone').css("display", "block");
        $('#layout-pane').css("display", "block");
        $('#json-select-pane').css("display", "block");
        $('#expand-all-button').css("display", "flex");
        $('.zoom-pane').css("display", "block");
        draw_standard_layout(json_file);    
    }
    // set_social_view();
    
    $('#flowchart').click(() => {
        view_type = 2;
        $('#map-zone').css("display", "none");
        $('#svg-zone').css("display", "block");
        $('#layout-pane').css("display", "none");
        $('#json-select-pane').css("display", "none");
        $('#expand-all-button').css("display", "none");
        $('.zoom-pane').css("display", "none");
        draw_flowchart("flowchart.json");
    });
    $('#flowchart').click();
    $('#geospatial').click(() => {
        view_type = 1;
        $('#map-zone').css("display", "block");

        $('#svg-zone').css("display", "none");
        $('#layout-pane').css("display", "none");
        $('#json-select-pane').css("display", "none");
        $('#expand-all-button').css("display", "none");
        $('.zoom-pane').css("display", "none");

        $('#social-degree').addClass("disabled");
        $('#social-centrality').addClass("disabled");
        $('#social-pagerank').addClass("disabled");
        draw_geospatial("map_data1.json");

    });
    $('#standard-layout').click(() => {
        if (!$('#social-group').hasClass('active')) {
            $('#social-group').addClass('active')
        }
        if ($('#social-group').hasClass('disabled')) {
            $('#social-group').removeClass('disabled')
        }
        layout_type = 0;
        $('#expand-all-button').css("display", "flex");
        draw_standard_layout(json_file);
    });
    $('#hier-layout').click(() => {
        if ($('#social-group').hasClass('active')) {
            $('#social-group').removeClass('active')
        }
        if (!$('#social-group').hasClass('disabled')) {
            $('#social-group').addClass('disabled')
        }
        layout_type = 1;
        $('#expand-all-button').css("display", "none");
        draw_hier_layout(json_file);
    });
    $('#radial-layout').click(() => {
        if ($('#social-group').hasClass('active')) {
            $('#social-group').removeClass('active')
        }
        if (!$('#social-group').hasClass('disabled')) {
            $('#social-group').addClass('disabled')
        }
        layout_type = 2;
        $('#expand-all-button').css("display", "none");
        draw_radial_layout(json_file);
    });

    // set_social_view();

    //top-pane social button handlers for only visual effect
    $('#social-normal').click(() => {
        set_social_view();
        if (!$('#social-normal').hasClass('active')) {
            $('#social-normal').addClass('active');
        }
        if ($('#social-degree').hasClass("active")) {
            $('#social-degree').removeClass("active");
        }
        if ($('#social-centrality').hasClass('active')) {
            $('#social-centrality').removeClass('active');
        }
        if ($('#social-pagerank').hasClass('active')) {
            $('#social-pagerank').removeClass('active');
        }
    });
    $('#social-degree').click(() => {
        if (!$('#social-degree').hasClass("active")) {
            $('#social-degree').addClass("active");
        }
        if ($('#social-normal').hasClass("active")) {
            $('#social-normal').removeClass("active");
        }
        if ($('#social-centrality').hasClass('active')) {
            $('#social-centrality').removeClass('active');
        }
        if ($('#social-pagerank').hasClass('active')) {
            $('#social-pagerank').removeClass('active');
        }
    });
    $('#social-centrality').click(() => {
        if (!$('#social-centrality').hasClass("active")) {
            $('#social-centrality').addClass("active");
        }
        if ($('#social-normal').hasClass("active")) {
            $('#social-normal').removeClass("active");
        }
        if ($('#social-degree').hasClass('active')) {
            $('#social-degree').removeClass('active');
        }
        if ($('#social-pagerank').hasClass('active')) {
            $('#social-pagerank').removeClass('active');
        }
    });
    $('#social-pagerank').click(() => {
        if (!$('#social-pagerank').hasClass("active")) {
            $('#social-pagerank').addClass("active");
        }
        if ($('#social-normal').hasClass("active")) {
            $('#social-normal').removeClass("active");
        }
        if ($('#social-centrality').hasClass('active')) {
            $('#social-centrality').removeClass('active');
        }
        if ($('#social-degree').hasClass('active')) {
            $('#social-degree').removeClass('active');
        }
    });

    d3.select("svg").on("click", function (d) {
        d3.contextMenu('close');
    });
});


