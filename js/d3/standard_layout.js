var handleTimer;
var d_r = 17;
var outlinks = [];//outlinks per node
var inlinks = [];// inlinks per node
let g_id = 0;
let duration = 500;
let tip_delay = 3;
//for total canvas information
let canvas_sz; //x side size of canvas must be odd
let cen_i;// start from 0
let sec_sz = 800; // size of each section in canvas, each rectangle is regular square. unit is px
let total_parent_nodes; // total parent nodes from json.
let sect_info = { x: 0, y: 0, cx: 0, cy: 0, ix: 0, iy: 0, has_node: false };// info of each section
let t_sects = []; //total array of section
let can_selectable = false;
let select_rect = { x: 0, y: 0, width: 0, height: 0 };
let cur_t;//variable for current zoom, translate state.
let flag_key_down = false;

draw_standard_layout = (json_file) => {
    console.log("passhere!!!")
    $("#expand-all-button").off('click');
    $("#social-normal").off('click');
    $("#social-degree").off('click');
    $("#social-pagerank").off('click');

    d3.select("svg").selectAll("*").remove()
    //zoom-home handler

    svgContainer = d3.select("svg")
        .attr("width", w)
        .attr("height", h)
        .call(d3.zoom()
            .scaleExtent([1 / 32, 8])
            .on("zoom", zoomed))
        .append("g");

    zoom = d3.zoom().on("zoom", zoomed);
    function zoomed() {
        cur_t = d3.event.transform;
        svgContainer.attr("transform", cur_t);
    }
    $("#zoom-home").on("click", function () {
        dx = 0;
        dy = 0;
        x = canvas_sz * sec_sz / 2;
        y = canvas_sz * sec_sz / 2;
        scale_rate = h / (canvas_sz * sec_sz);
        translate = [w / 2 - scale_rate * x, h / 2 - scale_rate * y];

        d3.select("svg").transition()
            .duration(500)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale_rate)); // updated for d3 v4        
    });
    $("#zoom-plus").on("click", function (d) {
        zoom.scaleBy(d3.select("svg").transition().duration(750), 1.2);
    });
    $("#zoom-minus").on("click", function (d) {
        zoom.scaleBy(d3.select("svg").transition().duration(750), 0.8);
    });
    //initial zoom
    d3.select("svg")
        .call(zoom.transform, d3.zoomIdentity); // updated for d3 v4


    svgContainer.append('defs').append('marker')
        .attr("x", 20)
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 19)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('xoverflow', 'visible')
        .append('path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', 'grey')
        .style('stroke', 'none');

    var behaviors = {};
    behaviors.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);

    //######################  DRAWINGS #######################

    //node tooltip
    var div = d3.select("body").append("foreignObject")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //add container g element
    var chart = svgContainer.patternify({ tag: 'g', selector: 'chart' });

    //for debug
    var canvas_area = chart.patternify({ tag: 'g', selector: 'canvas-area' });

    //################################   Chart Content Drawing ##################################

    //link wrapper
    var linksWrapper = chart.patternify({ tag: 'g', selector: 'links-wrapper' })

    //node wrapper
    var nodesWrapper = chart.patternify({ tag: 'g', selector: 'nodes-wrapper' })

    var nodesArr = [], linksArr = [], nodesdata;
    var filename = json_file.substring(0, json_file.length - 5);

    //load node data(one files)
    jQuery.ajax({
        dataType: "json",
        url: "json/" + json_file,
        async: false,
        success: function (data) { nodesdata = data }
    });
    nodesArr = nodesdata;

    /*construct total canvas size*/
    function construct_canvas() {
        parent_nodes = nodesdata.filter(n => n.leaf == false);
        canvas_sz = Math.ceil(Math.sqrt(parent_nodes.length)) + 1;
        cen_i = (canvas_sz + 1) * Math.floor(canvas_sz / 2);
        for (i = 0; i < canvas_sz; i++) {
            for (j = 0; j < canvas_sz; j++) {
                sect_info = {
                    x: j * sec_sz,
                    y: i * sec_sz,
                    cx: j * sec_sz + sec_sz / 2 + Math.floor(Math.random() * 100),
                    cy: i * sec_sz + sec_sz / 2 + Math.floor(Math.random() * 100),
                    ix: j,
                    iy: i,
                    has_node: false
                };
                t_sects.push(sect_info);
            }
        }

        t_sects[cen_i].has_node = true;//initial showing rectangle
        svgContainer.transition().duration(500)
            .attr("transform", "translate(" + (w / 2 - t_sects[cen_i].cx) + "," + (h / 2 - t_sects[cen_i].cy) + ")scale(" + 1 + ")")
            .on("end", function () { d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate((w / 2 - t_sects[cen_i].cx), (h / 2 - t_sects[cen_i].cy)).scale(1)) });
    }
    construct_canvas();
    d3.select("body")
        .on("keydown", function () {
            if (flag_key_down != true && d3.event.keyCode == 16) {//pressed ctrl                        
                flag_key_down = true;
                set_selection_handler();
            }
        })
        .on("keyup", function () {
            can_selectable = false;
            d3.select("svg").on("mousemove", null);
            d3.select("svg").select("rect").remove();
            d3.select("svg").call(zoom);
            flag_key_down = false;
        });
    d3.select("body")
        .on("click", function () {
            nodesWrapper.selectAll('.node-circle')
                .style('stroke', "#ffe");
            restore_zoom_handler();
        });
    //for debug
    function draw_canvas() {
        //for test canvas size

        rect_area = canvas_area.enter().append("g");
        for (i = 0; i < t_sects.length; i++) {
            canvas_area.append("rect")
                .attr("x", t_sects[i].x)
                .attr("y", t_sects[i].y)
                .attr("height", sec_sz)
                .attr("width", sec_sz)
                .attr("fill", "#eee")
                .attr("fill-opacity", 0.1)
                .attr("stroke-width", "1")
        }
    }

    let first_show_nodes = [];
    nodesArr.some(function (node, i) {
        if (node.v == true) {
            node.outs = get_outlinks_count(node);
            first_show_nodes.push(node);
        }
    })

    let first_center = { x: t_sects[cen_i].cx, y: t_sects[cen_i].cy, g_rad: guess_radius(first_show_nodes.length) };
    let first_show_links = linksArr;

    expand_children(first_show_nodes, first_show_links, first_center, 1);
    //draw_canvas();
    //expanded children nodes
    function expand_children(g_nodes, g_links, c_node, p_f_ex) {//partial : 0 or full : 1 expand

        g_links.forEach(function (gl) {
            linksWrapper.selectAll('.link').filter(link => link.id == gl.id).remove();
        });

        g_n_len = g_nodes.length;//children length
        nodes = nodesWrapper.selectAll('.node' + (g_id++)).data(g_nodes);
        nodes.exit().remove();

        var enteredNodes = nodes.enter().append('g').attr('class', 'node');
        // bind event handlers
        enteredNodes
            .on('click', nodeClick)
            .on('mouseover', nodeMouseover)
            .on('mouseout', nodeMouseout)
            .call(behaviors.drag);

        enteredNodes.append("circle")
            .attr('class', 'node-circle')
            .attr('cx', d => d.x = c_node.x)
            .attr('cy', d => d.y = c_node.y);
        enteredNodes
            .append('image')
            .attr('x', d => d.x = c_node.x)
            .attr('y', d => d.y = c_node.y);
        enteredNodes.append("circle")
            .attr('class', 'info-circle')
            .attr('cx', d => d.x = c_node.x)
            .attr('cy', d => d.y = c_node.y);
        //node texts
        enteredNodes.append('text')
            .attr("class", "node-text")
            .attr('x', d => d.x = c_node.x)
            .attr('y', d => d.y = c_node.y);
        enteredNodes.append('text')
            .attr("class", "info-text")
            .attr('x', d => d.x = c_node.x)
            .attr('y', d => d.y = c_node.y);

        //merge node groups and style it
        nodes = enteredNodes.merge(nodes);
        nodes
            .style('cursor', 'pointer');
        nodes
            .select('.node-circle')
            .transition().duration(duration)
            .attr('cx', function (d, i) {
                if (p_f_ex == 0) {
                    d.x = d.save_x;
                } else {
                    angle = (i / (g_n_len / 2)) * Math.PI;
                    d.c_node = c_node;
                    if (i % 2 == 0) {
                        d.x = (c_node.g_rad * Math.cos(angle + 1)) + (c_node.x);
                    } else {
                        d.x = (c_node.g_rad * 0.7 * Math.cos(angle + 1)) + (c_node.x);
                    }
                    d.save_x = d.x;
                }
                return d.x;
            })
            .attr('cy', function (d, i) {
                if (p_f_ex == 0) {
                    d.y = d.save_y;
                } else {
                    angle = (i / (g_n_len / 2)) * Math.PI;
                    if (i % 2 == 0) {
                        d.y = (c_node.g_rad * Math.sin(angle + 1)) + (c_node.y);
                    } else {
                        d.y = (c_node.g_rad * 0.7 * Math.sin(angle + 1)) + (c_node.y);
                    }
                    d.save_y = d.y;
                }
                return d.y;
            })
            .attr('r', d => d.r)
            .style('fill', d => d.c);
        nodes
            .select('image')
            .transition().duration(duration)
            .attr("xlink:href", d => d.img)
            .attr("x", d => d.x - d.r / 2)
            .attr("y", d => d.y - d.r / 2)
            .attr("width", d => d.r)
            .attr("height", d => d.r);
        nodes
            .select('.info-circle')
            .transition().duration(duration)
            .attr('r', d => d.r / 2 + 3)
            .attr('cx', d => d.x + d.r / 2 + 5)
            .attr('cy', d => d.y - (d.r / 2 + 5))
            .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');

        nodes
            .select('.node-text')
            .transition().duration(duration)
            .text(d => d.t)
            .attr("x", d => d.x)
            .attr("y", d => d.y - d.r - 10)
            .attr("text-anchor", "middle");
        nodes
            .select('.info-text')
            .transition().duration(duration)
            .text(d => d.outs)
            .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden')
            .attr("x", d => d.x + d.r / 2 + 5)
            .attr("y", d => d.y - d.r / 2 - 1)
            .attr("text-anchor", "middle");

        // link groups
        links = linksWrapper.selectAll('.link' + (g_id++)).data(g_links);
        links.exit().remove();

        var enteredLinks = links.enter().append('g').attr('class', 'link');

        enteredLinks.append('path')
            .attr("d", "M " + c_node.x + " " + c_node.y + " L " + c_node.x + " " + c_node.y)
            .attrs({
                'class': 'link-path',
                'id': function (d, i) { return 'link-path' + i + g_id; }
            })
            .attr('marker-end', 'url(#arrowhead)');
        linklabels = enteredLinks.append('text').attr('class', 'link-label').attr('id', function (d, i) { return 'link-label' + i })
        linklabels.append('textPath')
            .attr('xlink:href', function (d, i) { return '#link-path' + i + g_id })
            .style("text-anchor", "middle")
            .attr("startOffset", "50%");

        links = enteredLinks.merge(links);
        links
            .style('cursor', 'pointer');
        links
            .select('path')
            .transition().duration(duration)
            .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + d.target.x + " " + d.target.y)
            .style("stroke-width", d => d.thick)
            .style("stroke", d => d.c)
            .style("pointer-events", "none");
        links
            .select('.link-label')
            .attr('dy', d => -(d.thick) - 2)
            .style('fill', d => d.c)
            .style('stroke', '#000');
        links
            .select('textPath')
            .text(d => d.t)
            .style('fill', d => d.c)
            .style('storke', '#000');
    }
    //collpase children    
    function collpase_children(g_nodes, g_links) {
        g_nodes.forEach(function (n) {
            nodesWrapper.selectAll('.node').filter(node => node.id == n.id).remove();
        });
        g_links.forEach(function (l) {
            linksWrapper.selectAll('.link').filter(link => link.id == l.id).remove();
        });
    }

    //handler drag start event
    function dragstarted(d) {

        d.movable = true;
        ce = d3.event;
        nodesArr.filter(n => n.v == true && n.movable == true).forEach(function (nn) {
            nn.diff_x = ce.x - nn.x;
            nn.diff_y = ce.y - nn.y;
        });
    }
    // handle dragging event
    function dragged(d) {
        ce = d3.event;
        nodesWrapper.selectAll('.node').filter(n => n.v == true && n.movable == true).select(".node-circle")
            .attr("cx", d => d.x = ce.x - d.diff_x)
            .attr("cy", d => d.y = ce.y - d.diff_y);
        nodesWrapper.selectAll('.node').filter(n => n.v == true && n.movable == true).select(".info-circle")
            .attr("cx", d => d.x + d.r / 2 + 5)
            .attr("cy", d => d.y - (d.r / 2 + 5));
        nodesWrapper.selectAll('.node').filter(n => n.v == true && n.movable == true).select("image")
            .attr("x", d => d.x - d.r / 2)
            .attr("y", d => d.y - d.r / 2);
        nodesWrapper.selectAll('.node').filter(n => n.v == true && n.movable == true).select(".node-text")
            .attr("x", d => d.x)
            .attr("y", d => d.y - d.r - 10);
        nodesWrapper.selectAll('.node').filter(n => n.v == true && n.movable == true).select(".info-text")
            .attr("x", d => d.x + d.r / 2 + 5)
            .attr("y", d => d.y - d.r / 2 - 1)
            .attr("text-anchor", "middle");

        // s_link_paths = linksWrapper.selectAll(".link").filter(link => link.source.id == d.id);
        // t_link_paths = linksWrapper.selectAll(".link").filter(link => link.target.id == d.id);
        linksWrapper.selectAll(".link").filter(link => link.source.movable == true).select("path")
            .attr("d", function (d) { return "M " + (ce.x - d.source.diff_x) + " " + (ce.y - d.source.diff_y) + " L " + d.target.x + " " + d.target.y; });
        linksWrapper.selectAll(".link").filter(link => link.target.movable == true).select("path")
            .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + (ce.x - d.target.diff_x) + " " + (ce.y - d.target.diff_y));
    }
    //-------------------- handle drag end event ---------------
    function dragended(d) {
        //d.movable = false;
        // console.log("dragedn")
    }

    //-------------------------- node mouse hover handler ---------------
    function nodeMouseover(d) {
        var movnodes_len = nodesArr.filter(n => n.movable == true).length;
        if (movnodes_len == 0) {
            nodesWrapper.selectAll('.node-circle')
                .style('stroke', "#ffe");

            nodesWrapper.selectAll('.node')
                .filter(n => d.id == n.id)
                .select('.node-circle')
                .style('stroke', 'green');


            div.transition()
                .delay(tip_delay * 1000)
                .duration(100)
                .style("opacity", .9);
            var styles = `position: absolute;` +
                `text-align: left;` +
                `width: auto;` +
                `height: auto;` +
                `cursor: pointer;` +
                `font: 14px sans-serif;` +
                `background: rgb(196,200,206);` +
                `border-radius: 5px;` +
                `border: solid 1px #999;` +
                `box-shadow: 2px 2px 5px 0 rgba(0, 0, 0, .16), 0 2px 10px 0 rgba(0, 0, 0, .12);` +
                `padding: 5px;`;

            var innerHtml = `<div style="` + styles + `">`
                + `ID:` + d.id + `<br/>`
                + `Name:` + d.t + `<br/>`
                + `Color:` + d.c + `<br/>`
                + `Radius:` + d.r + `<br/>`
                + `<div class='button-view-detail'><a href='` + d.node_url + `'>&nbsp;View&nbsp;Details&nbsp;</a></div>`
                + `</div>`;
            div.html(innerHtml)
                .style("color", d.c)
                .style("left", (d3.event.pageX) + 5 / 1 + "px")
                .style("top", (d3.event.pageY) + 5 / 1 + "px");
        }
    }

    function nodeMouseout(d) {
        var movnodes_len = nodesArr.filter(n => n.movable == true).length;
        if (movnodes_len == 0) {
            nodesWrapper.selectAll('.node-circle')
                .style('stroke', "#ffe");

            div.transition()
                .duration(2000)
                .style("opacity", 0);
        }

    }
    function nodeClick(d) {
        if (can_selectable) return;
        if (d.leaf == true) return;
        let ex_links = get_expandable_links_of(d);
        if (ex_links.length == 0) {//collapse            
            let temp_nodes = [];
            let temp_links = [];
            let mov_checks = [];
            let k = 0;
            for (i = 0; i < linksArr.length; i++) {
                if (linksArr[i].source.id == d.id) {
                    if (get_target_nodes_count(linksArr[i].target) == 0 && get_source_nodes_count(linksArr[i].target) == 1) {
                        mov_checks[k] = false;
                        linksArr[i].v = false;
                        linksArr[i].target.v = false;
                        temp_nodes.push(linksArr[i].target);
                        temp_links.push(linksArr[i]);
                    } else {
                        mov_checks[k] = true;
                    }
                    k++;
                }
            }

            linksArr = linksArr.filter(l => l.v == true); 3 + collpase_children(temp_nodes, temp_links);

            d.outs = get_outlinks_count(d) - mov_checks.filter(mc => mc == true).length;//check whether all child nodes has been collapsed.
            if (d.outs != get_outlinks_count(d)) {
                d3.select(this).select(".info-circle").text(d.outs).style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');
                d3.select(this).select(".info-text").text(d.outs).style('visibility', d => d.outs > 0 ? 'visible' : 'hidden').attr("x", d => d.x + d.r / 2 + 5).attr("y", d => d.y - d.r / 2 - 1).attr("text-anchor", "middle");
                //d3.select(this).select(".info-text").text(d.outs).style('visibility', d => d.outs > 0 ? 'visible' : 'hidden').attr("text-anchor", "middle");
            }
            else {// all collpased                      
                let t_x = d.prev_x; // Calculate the x position of the element.
                let t_y = d.prev_y; // Calculate the y position of the element.  

                d3.select(this).select(".node-circle").transition().attr("cx", d => d.x = t_x).attr("cy", d => d.y = t_y);
                d3.select(this).select(".info-circle").transition()
                    .text(d.outs)
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden')
                    .attr("cx", d => d.x + d.r / 2 + 5).attr("cy", d => d.y - (d.r / 2 + 5));
                d3.select(this).select("image").transition().attr("x", d => d.x - d.r / 2).attr("y", d => d.y - d.r / 2);
                d3.select(this).select(".node-text").transition().attr("x", t_x).attr("y", d => t_y - d.r - 10);
                d3.select(this).select(".info-text").transition()
                    .text(d.outs)
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden')
                    .attr("x", d => t_x + d.r / 2 + 5).attr("y", d => t_y - d.r / 2 - 1).attr("text-anchor", "middle");

                linksWrapper.selectAll('.link')
                    .filter(link => link.target.id == d.id)
                    .select('path')
                    .transition().duration(300)
                    .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + t_x + " " + t_y);

                linksWrapper.selectAll('.link')
                    .filter(link => link.source.id == d.id)
                    .select('path')
                    .transition().duration(300)
                    .attr("d", d => "M " + t_x + " " + t_y + " L " + d.target.x + " " + d.target.y);

                svgContainer.transition().duration(500)
                    .attr("transform", "translate(" + (w / 2 - t_x) + "," + (h / 2 - t_y) + ")scale(" + 1 + ")")
                    .on("end", function () { d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate((w / 2 - t_x), (h / 2 - t_y)).scale(1)) });
            }

        } else {//expand            
            let temp_links = loadLinksArr(filename, d.id);
            if (temp_links == false)// node is leaf or has no children
                return;

            linksArr = [...linksArr, ...temp_links];
            linksArr = make_unique(linksArr);
            linksArr.forEach(function (l) {
                l.v = true;
            })
            let temp_nodes = [];

            temp_links.forEach(function (l, i) {
                nodesArr.forEach(function (n) {
                    if (n.id == l.target.id && n.v != true) {
                        n.v = true;
                        n.outs = get_outlinks_count(n);
                        temp_nodes.push(n);
                    }
                })
            });

            //guess group radius using group's nodes size
            d.g_rad = guess_radius(temp_nodes.length);


            if (ex_links.length < temp_links.length) {
                t_x = d.x; // Calculate the x position of the element.
                t_y = d.y; // Calculate the y position of the element.                                

                //update info-text
                d.outs = get_outlinks_count(d) - temp_links;

                d3.select(this).select(".node-circle").transition().attr("cx", d => d.x = t_x).attr("cy", d => d.y = t_y);
                d3.select(this).select(".info-circle").transition()
                    .attr("cx", d => d.x + d.r / 2 + 5).attr("cy", d => d.y - (d.r / 2 + 5))
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');
                d3.select(this).select("image").transition().attr("x", d => d.x - d.r / 2).attr("y", d => d.y - d.r / 2);
                d3.select(this).select(".node-text").transition().attr("x", t_x).attr("y", d => t_y - d.r - 10);
                d3.select(this).select(".info-text").transition()
                    .text(d.outs)
                    .attr("x", d => t_x + d.r / 2 + 5).attr("y", d => t_y - d.r / 2 - 1).attr("text-anchor", "middle")
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');
                expand_children(temp_nodes, temp_links, d, 0);// 0: partial expand, 1: full expand
            } else {
                //save the prev position
                d.prev_x = d.x;
                d.prev_y = d.y;

                e_index = search_empty_section_index();
                t_x = t_sects[e_index].cx;
                t_y = t_sects[e_index].cy;
                t_sects[e_index].has_node = true;
                //update info-text
                d.outs = get_outlinks_count(d) - temp_links;

                d3.select(this).select(".node-circle").transition().attr("cx", d => d.x = t_x).attr("cy", d => d.y = t_y);
                d3.select(this).select(".info-circle").transition()
                    .attr("cx", d => d.x + d.r / 2 + 5).attr("cy", d => d.y - (d.r / 2 + 5))
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');
                d3.select(this).select("image").transition().attr("x", d => d.x - d.r / 2).attr("y", d => d.y - d.r / 2);
                d3.select(this).select(".node-text").transition().attr("x", t_x).attr("y", d => t_y - d.r - 10);
                d3.select(this).select(".info-text").transition()
                    .text(d.outs)
                    .attr("x", d => t_x + d.r / 2 + 1).attr("y", d => t_y - d.r / 2)
                    .style('visibility', d => d.outs > 0 ? 'visible' : 'hidden');

                svgContainer.transition().duration(500)
                    .attr("transform", "translate(" + (w / 2 - t_x) + "," + (h / 2 - t_y) + ")scale(" + 1 + ")")
                    .on("end", function () { d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate((w / 2 - t_x), (h / 2 - t_y)).scale(1)) });

                linksWrapper.selectAll('.link')
                    .filter(link => link.source.id == d.c_node.id && link.target.id == d.id)
                    .select('path')
                    .transition().duration(duration)
                    .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + t_x + " " + t_y);

                linksWrapper.selectAll('.link')
                    .filter(link => link.target.id == d.id)
                    .select('path')
                    .transition().duration(duration)
                    .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + t_x + " " + t_y);

                expand_children(temp_nodes, temp_links, d, 1);
            }

        }
    }
    //set handler to draw selection
    function set_selection_handler() {
        can_selectable = true;
        nodesArr.filter(n => n.v == true).forEach(function (nn) {
            nn.movable = false;
        })
        d3.select("svg").on('.zoom', null);
        d3.select("svg")
            .on("mousedown", selection_mousedown)
            .on("mouseup", selection_mouseup)

    }
    //restore handler to zoom
    function restore_zoom_handler() {
        can_selectable = false;
        nodesArr.filter(n => n.v == true).forEach(function (nn) {
            nn.movable = false;
        })
        d3.select("svg").selectAll("rect").remove();
        d3.select("svg").call(zoom);

    }
    //handler for selection 
    function selection_mousedown() {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        if (can_selectable) {
            var m = d3.mouse(this);
            d3.select("svg").selectAll("rect").remove();
            select_rect.x = m[0];
            select_rect.y = m[1];

            rect = d3.select("svg").append("rect")
                .attr("fill-opacity", 0.2)
                .attr("x", m[0])
                .attr("y", m[1])
                .attr("height", 0)
                .attr("width", 0);

            d3.select("svg").on("mousemove", selection_mousemove);
        }
    }

    function selection_mousemove() {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        if (can_selectable) {
            var m = d3.mouse(this);
            if (m[0] < select_rect.x && m[1] < select_rect.y) {
                rect
                    .attr("x", m[0])
                    .attr("y", m[1])
                    .attr("width", Math.abs(m[0] - select_rect.x))
                    .attr("height", Math.abs(m[1] - select_rect.y));
            } else if (m[0] < select_rect.x) {
                rect
                    .attr("x", m[0])
                    .attr("y", select_rect.y)
                    .attr("width", Math.abs(m[0] - select_rect.x))
                    .attr("height", Math.abs(m[1] - select_rect.y));
            } else if (m[1] < select_rect.y) {
                rect
                    .attr("x", select_rect.x)
                    .attr("y", m[1])
                    .attr("width", Math.abs(m[0] - select_rect.x))
                    .attr("height", Math.abs(m[1] - select_rect.y));
            } else {
                rect
                    .attr("width", Math.abs(m[0] - select_rect.x))
                    .attr("height", Math.abs(m[1] - select_rect.y));
            }
        }
    }

    function selection_mouseup() {
        if (can_selectable) {
            select_rect.x = rect.attr("x");
            select_rect.y = rect.attr("y");
            select_rect.width = rect.attr("width");
            select_rect.height = rect.attr("height");

            sel_nodes = nodesArr.filter(node => node.v == true);

            nodesWrapper.selectAll('.node-circle')
                .style('stroke', "#ffe");
            sel_nodes.forEach(function (sn) {
                if (ptInRegion(sn, select_rect)) {
                    sn.movable = true;
                    nodesWrapper.selectAll('.node')
                        .filter(n => sn.id == n.id)
                        .select('.node-circle')
                        .style('stroke', 'green');
                }
            });
            can_selectable = false;
            d3.select("svg").on("mousemove", null);
            d3.select("svg").select("rect").remove();
            d3.select("svg").call(zoom);
        }
    }
    //************Kit functions***************/  
    //search empty section
    function ptInRegion(node, region) {
        rx = cur_t.k * node.x + cur_t.x;
        ry = cur_t.k * node.y + cur_t.y;
        rect_x = region.x;
        rect_y = region.y;
        rect_w = (region.x / 1 + region.width / 1);
        rect_h = (region.y / 1 + region.height / 1);

        if ((rx > rect_x && rx < rect_w) && (ry > rect_y && ry < rect_h)) {
            return true;
        }
        return false;
    }
    function search_empty_section_index() {
        while (true) {
            empty_index = Math.floor(Math.random() * canvas_sz * canvas_sz);
            if (t_sects[empty_index].has_node == false) {
                return empty_index;
            }
        }
    }
    //get current index of canvas
    function get_index_in_canvas(cx, cy) {
        for (i = 0; i < t_sects.length; i++) {
            if ((t_sects[i].x <= cx && cx <= t_sects[i].x + sec_sz) && (t_sects[i].y <= cy && cy <= t_sects[i].y + sec_sz)) {
                return i;
            }
        }
    }

    //1.check whether can collpase or expand
    //2. get unrepeated links of this node
    function get_expandable_links_of(node) {
        let cur_links = linksArr.filter(la => la.source.id == node.id);
        let temp_links = loadLinksArr(filename, node.id);

        if (temp_links == false)// node is leaf or has no children
            return;
        return filter_array(temp_links, cur_links);
    }
    //get counts of node that this node is target
    function get_source_nodes_count(node) {
        let len = 0;
        linksArr.forEach(function (l) {
            if (node.id == l.target.id) {
                len++;
            }
        });
        return len;// 
    }
    //get counts of node that this node is source
    function get_target_nodes_count(node) {
        let len = 0;
        linksArr.forEach(function (l) {
            if (node.id == l.source.id) {
                len++;
            }
        });
        return len;
    }
    // make unique nodes
    function filter_array(marr, farr) {
        return filteredArray = marr.filter(function (array_el) {
            return farr.filter(function (anotherOne_el) {
                return anotherOne_el.id == array_el.id;
            }).length == 0
        });
    }
    function make_unique(arr) {
        var ret = [];
        var u_ids = [...new Set(arr.map(ai => ai.id))];
        for (i = 0; i < u_ids.length; i++) {
            for (j = 0; j < arr.length; j++) {
                if (u_ids[i] == arr[j].id) {
                    ret.push(arr[j]);
                    break;
                }
            }
        }
        return ret;
    }
    function guess_radius(len) {
        if (len < 20) {
            return sec_sz * 0.30;
        } else if (len >= 20 && len < 50) {
            return sec_sz * 0.4;
        } else if (len >= 50 && len < 100) {
            return sec_sz * 0.44;
        } else {
            return sec_sz * 0.48;
        }
    }
    //------------------------read sync json data ---------------------------
    function loadLinksArr(filename, id) {//default type = 0 : out link, 1 : in link        
        var dump_links, dump_linksArr = [], temp_nodes = [];

        temp_nodes = nodesArr.filter(n => n.id == id && !n.leaf);
        if (temp_nodes.length > 0) {

            jQuery.ajax({
                dataType: "json",
                url: "json/" + filename + "/" + id + ".json",
                async: false,
                success: function (data) {
                    dump_links = data;
                    ajax_ret = true;
                },
                error: function (err) {
                    console.log(err);
                }
            });
            dump_linksArr = [...dump_linksArr, ...dump_links];
            dump_linksArr.forEach(function (e, i) {
                dump_linksArr[i] = {
                    id: e.id,
                    t: e.t,
                    c: e.c,
                    thick: e.thick,
                    v: true,
                    source: nodesArr.filter(n => n.id == e.id1)[0],
                    target: nodesArr.filter(n => n.id == e.id2)[0]
                };
            });
            return dump_linksArr;
        } else {
            return false;
        }
    }
    $("#expand-all-button").on("click", function (evt) {
        if (layout_type == 0) {
            autoExpand();
        }
    });
    $('#social-normal').click(() => {
        $('#social-degree').removeClass("disabled");
        $('#social-pagerank').removeClass("disabled");
        social_type = 0;
        nodesArr = nodesArr.filter(n => n.r = d_r);
        update();
    });
    $('#social-degree').click(() => {
        social_type = 1;
        // calc_outlinks();
        // calc_inlinks();

        nodesArr.forEach(function (n) {
            if (inlinks[n.id] + outlinks[n.id] == 0) {
                n.r = 17;
            } else {
                n.r = 20 + (inlinks[n.id] + outlinks[n.id]) * 3;
            }
        });
        update();
    });
    $('#social-pagerank').click(() => {
        social_type = 3;
        // calc_inlinks();
        nodesArr.forEach(function (n) {
            if (inlinks[n.id] == 0) {
                n.r = 17;
            } else {
                n.r = 20 + inlinks[n.id] * 3;
            }
        });
        update();
    });
    function get_outlinks_count(node) {
        temp_links = loadLinksArr(filename, node.id);
        return temp_links != false ? temp_links.length : 0;
    }

};

//----------- PROTOTYEPE FUNCTIONS  ----------------------
d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // pattern in action
    var selection = container.selectAll('.' + selector).data(data)
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
}
// custom radial layout
d3.radial = function () {
    return function setProportions(root) {
        recurse(root, 0, 1);
        function recurse(node, min, max) {
            node.proportion = (max + min) / 2;
            if (!node.x) {

                // if node has parent, match entered node positions to it's parent
                if (node.parent) {
                    node.x = node.parent.x;
                } else {
                    node.x = 0;
                }
            }

            // if node had parent, match entered node positions to it's parent
            if (!node.y) {
                if (node.parent) {
                    node.y = node.parent.y;
                } else {
                    node.y = 0;
                }
            }

            //recursively do the same for children
            if (node.children) {
                var offset = (max - min) / node.children.length;
                node.children.forEach(function (child, i, arr) {
                    var newMin = min + offset * i;
                    var newMax = newMin + offset;
                    recurse(child, newMin, newMax);
                });
            }
        }
    }
}
Array.prototype.orderBy = function (func) {
    this.sort((a, b) => {
        var a = func(a);
        var b = func(b);
        if (typeof a === 'string' || a instanceof String) {
            return a.localeCompare(b);
        }
        return a - b;
    });
    return this;
}

