
var handleTimer;
draw_radial_layout = (json_file) => {
    svgContainer.selectAll("*").remove();
    // svgContainer.attr("transform", "translate(" + w / 2 + ",0)");

    var normal_nodesArr = [];
    var hierNodeArr = [];

    //load node data(one files) 
    jQuery.ajax({
        dataType: "json",
        url: "json/" + json_file,
        async: false,
        success: function (data) { normal_nodesArr = data }
    });
    var filename = json_file.substring(0, json_file.length - 5);//node file
    // global  parent
    hierNodeArr.push({
        name: '0',
        parent: '',
        c: '#000',
        t: '',
        r: 10,
        ex: false,
        v: true
    });
    var hierRootNode = normal_nodesArr.filter(node => node.root == true);
    for (k = 0; k < hierRootNode.length; k++) {
        //visual parent for each tree
        hierNodeArr.push({
            name: hierRootNode[k].id,
            parent: '0',
            c: hierRootNode[k].c,
            t: hierRootNode[k].t,
            r: hierRootNode[k].r,
            img: hierRootNode[k].img,
            node_url: hierRootNode[k].node_url,
            ex: hierRootNode[k].ex,
            v: hierRootNode[k].v
        });
    }

    var i = 0;
    var temp_links = [];
    normal_nodesArr.forEach(function (node) {
        temp_links = loadLinksArr(filename, node.id);
        if (temp_links != false) {
            temp_links.forEach(function (l) {
                hierNodeArr.push({
                    name: l.target.id,
                    parent: l.source.id,
                    c: l.target.c,
                    t: l.target.t,
                    r: l.target.r,
                    img: l.target.img,
                    node_url: l.target.node_url,
                    ex: l.target.ex,
                    v: l.target.v
                });
            });
        }
    });

    //node tooltip
    var div = d3.select("body").append("foreignObject")
        .attr("class", "tooltip")
        .style("opacity", 0);
    //calculated properties
    var calc = {}
    calc.chartLeftMargin = 0;
    calc.chartTopMargin = 0;
    calc.chartWidth = w;
    calc.chartHeight = h;

    //########################## HIERARCHY STUFF  #########################
    var hierarchy = {};
    var stratify = d3.stratify()
        .id(d => d.name)
        .parentId(d => d.parent);

    hierarchy.root = d3.hierarchy(stratify(hierNodeArr));

    //###########################   BEHAVIORS #########################
    var behaviors = {};
    behaviors.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);

    //###########################   LAYOUTS #########################
    var layouts = {};

    // custom radial kayout
    layouts.radial = d3.radial();

    //###########################   FORCE STUFF #########################
    var force = {};
    force.link = d3.forceLink().id(d => d.id);
    force.charge = d3.forceManyBody()
    force.center = d3.forceCenter(calc.chartWidth / 2, calc.chartHeight / 2)

    // prevent collide
    force.collide = d3.forceCollide().radius(d => {

        // if parent has many children, reduce collide strength
        if (d.parent) {
            if (d.parent.children.length > 10) {

                // also slow down node movement
                slowDownNodes();
                return d.data.data.r;
            }
        }

        // increase collide strength 
        if (d.children && d.depth > 2) {
            return d.data.data.r;
        }
        return d.data.data.r * 2;
    });

    //manually set x positions (which is calculated using custom radial layout)
    force.x = d3.forceX()
        .strength(0.5)
        .x(function (d, i) {

            // if node does not have children and is channel (depth=2) , then position it on parent's coordinate
            if (!d.children && d.depth > 2) {
                if (d.parent) {
                    d = d.parent;
                }
            }

            // custom circle projection -  radius will be -  (d.depth - 1) * 150
            return projectCircle(d.proportion, (d.depth - 1) * 350)[0];
        });


    //manually set y positions (which is calculated using d3.cluster)
    force.y = d3.forceY()
        .strength(0.5)
        .y(function (d, i) {
            // if node does not have children and is channel (depth=2) , then position it on parent's coordinate
            if (!d.children && d.depth > 2) {
                if (d.parent) {
                    d = d.parent;
                }
            }

            // custom circle projection -  radius will be -  (d.depth - 1) * 150
            return projectCircle(d.proportion, (d.depth - 1) * 350)[1];
        })


    //---------------------------------  INITIALISE FORCE SIMULATION ----------------------------

    // get based on top parameter simulation
    force.simulation = d3.forceSimulation()
        .force('link', force.link)
        .force('charge', force.charge)
        .force('center', force.center)
        .force("collide", force.collide)
        .force('x', force.x)
        .force('y', force.y)

    //###########################   HIERARCHY STUFF #########################

    // flatten root 
    var arr = flatten(hierarchy.root);

    // hide members based on their depth
    // arr.forEach(d => {
    //     if (d.depth > 1) {
    //         d._children = d.children;
    //         d.children = null;
    //     }
    // })

    //####################################  DRAWINGS #######################

    //add container g element
    var chart = svgContainer.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');


    //################################   Chart Content Drawing ##################################

    //link wrapper
    var linksWrapper = chart.patternify({ tag: 'g', selector: 'links-wrapper' })

    //node wrapper
    var nodesWrapper = chart.patternify({ tag: 'g', selector: 'nodes-wrapper' })
    var nodes, links, enteredNodes;

    // reusable function which updates visual based on data change
    update();

    //update visual based on data change
    function update(clickedNode) {

        //  set xy and proportion properties with custom radial layout
        layouts.radial(hierarchy.root);

        //nodes and links array
        var nodesArr = flatten(hierarchy.root, true)
            .orderBy(d => d.depth)
            .filter(d => !d.hidden);

        var linksArr = hierarchy.root.links()
            .filter(d => !d.source.hidden)
            .filter(d => !d.target.hidden)

        // make new nodes to appear near the parents
        nodesArr.forEach(function (d, i) {
            if (clickedNode && clickedNode.id == (d.parent && d.parent.id)) {
                d.x = d.parent.x;
                d.y = d.parent.y;
            }
        });

        nodes = nodesWrapper.selectAll('.node').data(nodesArr.filter(d => d.parent != null));
        nodes.exit().remove();

        var enteredNodes = nodes.enter().append('g').attr('class', 'node');
        // bind event handlers
        enteredNodes
            .on('click', nodeClick)
            .on('mouseover', nodeMouseover)
            .on('mouseout', nodeMouseout)
            .call(behaviors.drag);

        enteredNodes.append("circle").attr('class', 'node-circle');
        enteredNodes.append("circle").attr('class', 'info-circle');
        enteredNodes.append('text').attr("class", "node-text");
        enteredNodes.append('text').attr("class", "info-text");

        //merge  node groups and style it
        nodes = enteredNodes.merge(nodes);

        nodes
            .style('cursor', 'pointer');
        nodes
            .select('.node-circle')
            .attr('r', d => d.data.data.r)
            .style('fill', d => d.data.data.c);
        nodes
            .select('.info-circle')
            .attr('r', d => d.data.data.r / 2)
            .attr('cx', d => d.data.data.r / 2 + 5)
            .attr('cy', d => -(d.data.data.r / 2 + 5))
            .style('visibility', function (d) {
                if (d.children == null && d._children != null) {
                    return 'visible';
                }
                if (d._children == null && d.children != null) {
                    return 'hidden';
                }
                if (d.children == null && d._children == null) {
                    return 'hidden';
                }
            });
        nodes
            .select('.node-text')
            .text(d => d.data.data.t)
            .attr("dy", d => -d.data.data.r - 10)
            .attr("text-anchor", "middle");
        nodes
            .select('.info-text')
            .text(function (d) {
                if (d.children == null && d._children != null) {
                    return d._children.length;
                }
                if (d._children == null && d.children != null) {
                    return 0;
                }
                if (d.children == null && d._children == null) {
                    return 0;
                }
            })
            .style('visibility', function (d) {
                if (d.children == null && d._children != null) {
                    return 'visible';
                }
                if (d._children == null && d.children != null) {
                    return 'hidden';
                }
                if (d.children == null && d._children == null) {
                    return 'hidden';
                }
            })
            .attr("dx", d => d.data.data.r / 2 + 1)
            .attr("dy", d => -d.data.data.r / 2);


        //link groups        
        links = linksWrapper.selectAll('.link').data(linksArr.filter(d => d.source.parent != null));
        links.exit().remove();
        var enteredLinks = links.enter().append('g').attr('class', 'link');

        linkpaths = enteredLinks.append('path')
            .attrs({
                'class': 'link-path',
                'id': function (d, i) { return 'link-path' + i }
            });

        linklabels = enteredLinks.append('text').attr('class', 'link-label').attr('id', function (d, i) { return 'link-label' + i })
        linklabels.append('textPath')
            .attr('xlink:href', function (d, i) { return '#link-path' + i })
            .style("text-anchor", "middle")
            .attr("startOffset", "50%")

        links = enteredLinks.merge(links);

        links
            .style('cursor', 'pointer');
        links
            .select('path')
            .style("stroke-width", 5)
            .style("stroke", d => d.target.data.c)
            .style("pointer-events", "none");
        links
            .select('.link-label')
            .attr('dy', d => -7)
            .style('fill', d => d.target.data.c)
            .style('stroke', d => '#000');
        links
            .select('textPath')
            .text(d => d.target.data.t)
            .style('fill', d => d.target.data.c)
            .style('storke', d => '#000');

        //force simulation
        force.simulation.nodes(nodesArr)
            .on('tick', ticked);

        // links simulation
        force.simulation.force("link").links(linksArr).id(d => d.id).distance(100).strength(d => 1);
    }

    //####################################### EVENT HANDLERS  ########################

    //tick handler
    function ticked() {

        links.select("path").attr('d', function (d) {
            return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
        });
        //set nodes position
        svgContainer.selectAll('.node').attr("transform", function (d) { return `translate(${d.x},${d.y})`; });

    }

    //handler drag start event
    function dragstarted(d) {
        //disable node fixing
        nodes.each(d => { d.fx = null; d.fy = null })
    }


    // handle dragging event
    function dragged(d) {
        // make dragged node fixed
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }



    //-------------------- handle drag end event ---------------
    function dragended(d) {
        // we are doing nothing, here , aren't we? 
    }

    function nodeClick(d) {
        //free fixed nodes
        nodes.each(d => { d.fx = null; d.fy = null })

        // collapse or expand node
        if (d.children) {//collapse                
            d._children = d.children;
            d.children = null;
            update(d);
            force.simulation.restart();
            force.simulation.alphaTarget(0.15);
        } else if (d._children) {//expand                
            d.children = d._children;
            d._children = null;
            update(d);
            force.simulation.restart();
            force.simulation.alphaTarget(0.15);
        } else {
            //nothing is to collapse or expand
        }
        freeNodes();
    }
    function nodeMouseover(d) {
        nodesWrapper.selectAll('.node-circle')
            .style('stroke', "#ffe");

        nodesWrapper.selectAll('.node')
            .filter(n => d.id == n.id)
            .select('.node-circle')
            .style('stroke', 'green');

        div.transition()
            .duration(200)
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
            + `Name:` + d.data.data.t + `<br/>`
            + `Color:` + d.data.data.c + `<br/>`
            + `Radius:` + d.data.data.r + `<br/>`
            + `<div class='button-view-detail'><a href='` + d.data.data.node_url + `'>&nbsp;View&nbsp;Details&nbsp;</a></div>`
            + `</div>`;
        div.html(innerHtml)
            .style("color", d.data.data.c)
            .style("left", (d3.event.pageX) + 5/1 + "px")
            .style("top", (d3.event.pageY) + 5/1 + "px");
    }

    function nodeMouseout(d) {
        nodesWrapper.selectAll('.node-circle')
            .style('stroke', "#ffe");

        div.transition()
            .duration(2000)
            .style("opacity", 0);
    }
    function slowDownNodes() {
        force.simulation.alphaTarget(0.05);
    };

    function freeNodes() {
        d3.selectAll('.node').each(n => { n.fx = null; n.fy = null; })
    }

    function projectCircle(value, radius) {
        var r = radius || 0;
        var corner = value * 2 * Math.PI;
        return [Math.sin(corner) * r, -Math.cos(corner) * r];
    }


    //recursively loop on children and extract nodes as an array
    function flatten(root, clustered) {
        var nodesArray = [];
        var i = 0;
        function recurse(node, depth) {
            if (node.children)
                node.children.forEach(function (child) {
                    recurse(child, depth + 1);
                });
            if (!node.id) node.id = ++i;
            else ++i;
            node.depth = depth;
            if (clustered) {
                if (!node.cluster) {
                    // if cluster coordinates are not set, set it
                    node.cluster = { x: node.x, y: node.y }
                }
            }
            nodesArray.push(node);
        }
        recurse(root, 1);
        return nodesArray;
    }

    function loadLinksArr(filename, id) {
        var dump_links, dump_linksArr = [];
        var temp_nodes = normal_nodesArr.filter(n => n.id == id && !n.leaf);

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

            dump_linksArr = dump_links;
            dump_linksArr.forEach(function (e, i) {
                dump_linksArr[i] = {
                    id: e.id,
                    t: e.t,
                    c: e.c,
                    thick: e.thick,
                    source: normal_nodesArr.filter(n => n.id == e.id1)[0],
                    target: normal_nodesArr.filter(n => n.id == e.id2)[0]
                };
            });
            return dump_linksArr;
        } else {
            return false;
        }
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

