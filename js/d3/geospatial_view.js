
draw_geospatial = (json_file) => {
    if (mymap == null)
        mymap = L.map('map-zone').setView([39.505, 10], 3);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
        {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1Ijoic2VsaXMiLCJhIjoiY2pvbzZrcmtmMDA0dzNwcXNtcDRlNWV5cCJ9.VK3zv_k9wN3lGYO82qusDw'
        }).addTo(mymap);


    var selected_circle_node, selected_path_link;


    d3.json("json/" + json_file, function (error, data) {
        if (error) throw error;

        clearMap();
        var nodesData = [], linksData = [];
        for (i = 0; i < data.items.length; i++) {
            if (data.items[i].type == "node") {
                nodesData.push(data.items[i]);
            } else {
                linksData.push(data.items[i]);
            }
        }
        var map_nodesArr = nodesData;
        var map_linksArr = linksData;

        map_linksArr.forEach(function (e, i) {
            map_linksArr[i] = {
                type: e.type,
                id: e.id,
                thick: e.thick,
                c: e.c,
                t: e.t,
                node_url: e.node_url,
                source: nodesData.filter(function (n) { return n.id == e.id1; })[0],
                target: nodesData.filter(function (n) { return n.id == e.id2; })[0]
            };
        });
        update();

        function update() {
            clearMap();

            var draw_link = [];
            for (k = 0; k < map_linksArr.length; k++) {
                draw_link = [];
                x0 = map_linksArr[k].source.pos.lat;
                y0 = map_linksArr[k].source.pos.lng;
                x1 = map_linksArr[k].target.pos.lat;
                y1 = map_linksArr[k].target.pos.lng;
                draw_link.push([x0, y0]);
                draw_link.push([x1, y1]);

                L.polyline(draw_link, {
                    id: map_linksArr[k].id,
                    name: map_linksArr[k].t,
                    weight: map_linksArr[k].thick,
                    dashArray: '20,15',
                    color: map_linksArr[k].c
                }).bindLabel(map_linksArr[k].t, { noHide: true }).addTo(mymap).on("click", pathClick);
            }

            for (i = 0; i < map_nodesArr.length; i++) {
                var customPopup = `City:` + map_nodesArr[i].t + `<br/>` +
                    `Color:` + map_nodesArr[i].c + `<br/>` +
                    `<div class='button-view-detail'><a href='` + map_nodesArr[k].node_url + `'>&nbsp;View&nbsp;Details&nbsp;</a></div>`;

                // specify popup options 
                var customOptions =
                {
                    'maxWidth': '300',
                    'className': 'custom'
                }
                var marker = L.circleMarker([map_nodesArr[i].pos.lat, map_nodesArr[i].pos.lng], {
                    type: map_nodesArr[i].type,
                    id: map_nodesArr[i].id,
                    name: map_nodesArr[i].t,
                    color: map_nodesArr[i].c,
                    fillColor: map_nodesArr[i].c,
                    fillOpacity: 0.5,
                    opacity: 1.0,
                    radius: map_nodesArr[i].r
                }).bindLabel(map_nodesArr[i].t, { noHide: true }).bindPopup(customPopup, customOptions).addTo(mymap)
                    .on("click", circleMarkerClick)
                    .on("mouseover", function () {
                        this.openPopup();
                    });


            }
        }

        function circleMarkerClick(e) {

            var clickedCircle = e.target;

            $('#node-name').val(clickedCircle.options.name);
            $('#node-radius').val(clickedCircle.options.radius);
            $('#node-color').val(clickedCircle.options.color);
            $('#node-color').change();
            selected_circle = clickedCircle;

            selected_circle_node = map_nodesArr.filter(d => d.id == clickedCircle.options.id)[0];
        }
        function pathClick(e) {
            var path = e.target;

            $('#link-name').val(path.options.name);
            $('#link-thick').val(path.options.weight);
            $('#link-color').val(path.options.color);
            $('#link-color').change();
            selected_path_link = map_linksArr.filter(l => l.id == path.options.id)[0];
        }
        function clearMap() {
            for (i in mymap._layers) {
                if (mymap._layers[i]._path != undefined) {
                    try {
                        mymap.removeLayer(mymap._layers[i]);
                    }
                    catch (e) {
                        console.log("problem with " + e + mymap._layers[i]);
                    }
                }
            }
        }

        $('#node-apply').on('click', function () {
            if (view_type == 0) return;
            map_nodesArr = map_nodesArr.map(node => node.id == selected_circle_node.id
                ? ({ ...node, c: $('#node-color').val(), t: $('#node-name').val(), r: $('#node-radius').val() })
                : node);


            // map_linksArr.forEach(function (e, i) {
            //     map_linksArr[i] = {
            //         id: e.id,
            //         t: e.t,
            //         c: e.c,
            //         thick: e.thick,
            //         source: map_nodesArr.filter(n => n.id == e.source.id)[0],
            //         target: map_nodesArr.filter(n => n.id == e.target.id)[0]
            //     };
            // });

            update();

        });

        $('#link-apply').on('click', function () {
            if (view_type == 0) return;
            map_linksArr.forEach(function (d, i) {
                map_linksArr = map_linksArr.map(link => link.id === selected_path_link.id
                    ? ({ ...link, c: $('#link-color').val(), t: $('#link-name').val(), thick: $('#link-thick').val() })
                    : link);
            });

            update();
        });

        // mymap.on("zoomstart", function(e){
        //     update();
        // });
    });

};
