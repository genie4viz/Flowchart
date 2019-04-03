

var delay = 150;
draw_hier_layout = (json_file) => {

    svgContainer.selectAll("*").remove();
    // svgContainer.attr("transform", "translate(" + w / 2 + ",0)");

    var normal_nodesArr = []; //this variable uses in loadLinksArr
    var hierNodeArr = [];

    //load node data(one files) 
    jQuery.ajax({
        dataType: "json",
        url: "json/" + json_file,
        async: false,
        success: function (data) { normal_nodesArr = data }
    });
    var filename = json_file.substring(0, json_file.length - 5);//node file
    //global  parent
    hierNodeArr.push({
        name: '0',
        parent: ''
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
            leaf: hierRootNode[k].leaf,
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
                    leaf: l.target.leaf,
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

    var draw_linear = (s, d) => `M ${s.x} ${s.y} L ${d.x} ${d.y}`;

    var stratify = d3.stratify()
        .id(d => d.name)
        .parentId(d => d.parent);

    var treemap = d3.tree().nodeSize([100, 150]);
    var root = d3.hierarchy(stratify(hierNodeArr), function (d) { return d.children });

    root.x0 = 0;
    root.y0 = 0;

    root.children.forEach(collapse);

    update(root);

    var nodes, links;
    //update visual based on data change
    function update(source) {

        var treeData = treemap(root);

        var rootNode = treeData.descendants()[0];
        nodes = treeData.descendants().slice(1);
        links = treeData.descendants().slice(rootNode.children.length + 1);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.x += w / 2;
            d.y = d.depth * 180;
        });

        // ****************** Nodes section ***************************
        {
            // Update the nodes...        
            var node = svgContainer.selectAll('g.node')
                .data(nodes, function (d) { return d.id || (d.id = ++i); });

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", function (d) {
                    return "translate(" + source.x0 + "," + source.y0 + ")";
                })
                .on('click', nodeClick)
                .on('mouseover', nodeMouseover)
                .on('mouseout', nodeMouseout);

            // Add Circle for the nodes
            nodeEnter.append('circle').attr('class', 'node-circle');
            nodeEnter.append('circle').attr('class', 'info-circle');
            nodeEnter.append('text').attr('class', 'node-text');
            nodeEnter.append('text').attr('class', 'info-text');
            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(delay)
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            // Update the node attributes and style
            nodeUpdate
                .select('circle.node-circle')
                .attr('r', d => d.data.data.r)
                .style("fill", d => d.data.data.c)
                .attr('cursor', 'pointer');
            nodeUpdate
                .select('circle.info-circle')
                .attr('r', d => d.data.data.r / 2)
                .attr('cx', d => d.data.data.r / 2 + 5)
                .attr('cy', d => -(d.data.data.r / 2 + 5))
                .attr('cursor', 'pointer');
            nodeUpdate
                .select('text.node-text')
                .attr("dy", d => -d.data.data.r - 10)
                .attr("text-anchor", "middle")
                .text(d => d.data.data.t);
            nodeUpdate
                .select('text.info-text')
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
            nodeUpdate
                .select('circle.info-circle')
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


            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
                .duration(delay)
                .attr("transform", function (d) {
                    return "translate(" + source.x + "," + source.y + ")";
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

        }
        // ****************** links section ***************************
        {
            // Update the links...
            var link = svgContainer.selectAll('path.link')
                .data(links, function (d) { return d.id; });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .style("stroke", d => d.data.data.c)
                .style("stroke-width", 5)
                .attr('d', function (d) {
                    var o = { x: source.x0, y: source.y0 }
                    return draw_linear(o, o)
                });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(delay)
                .attr('d', function (d) { return draw_linear(d, d.parent) })

            // Remove any exiting links
            var linkExit = link.exit().transition()
                .duration(delay)
                .attr('d', function (d) {
                    var o = { x: source.x, y: source.y }
                    return draw_linear(o, o)
                })
                .remove();

        }
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    //-------------------------- node mouse hover handler ---------------
    function nodeMouseover(d) {
        svgContainer
            .selectAll('circle.node-circle')
            .style('stroke', "#ffe");

        svgContainer.selectAll('g.node')
            .filter(n => d.id == n.id)
            .select('circle.node-circle')
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
        svgContainer.selectAll('circle.node-circle')
            .style('stroke', "#ffe");

        div.transition()
            .duration(2000)
            .style("opacity", 0);
    }
    function nodeClick(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    //----------------------------------------------------------------      

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
    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

};