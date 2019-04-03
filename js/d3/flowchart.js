function draw_flowchart(json_file){
    var lvl_margin = 30;
    

    d3.select("svg").selectAll("*").remove();
    
    var svgContainer = d3.select("svg")
        .attr("width", w)
        .attr("height", h)
        .append("g")
        .attr("transform", "translate(" + w / 3 + ", 100)");

    var behaviors = {};
    behaviors.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);

    var nodesArr = [], linksArr = [];
    //load json data    
    jQuery.ajax({
        dataType: "json",
        url: "json/" + json_file,
        async: false,
        success: function (data) {
            nodesArr = data.nodes;            
            nodesArr.forEach((n, i) => {
                nodesArr[i] = {
                    key: n.key,
                    category: n.category,
                    x: parsePosition(n.loc).x,
                    y: parsePosition(n.loc).y,
                    text: n.text
                };
            });
            linksArr = data.links;
            linksArr.forEach((e, i) => {                
                linksArr[i] = {
                    fromPort: e.fromPort,
                    toPort: e.toPort,
                    source: nodesArr.filter(n => n.key == e.from)[0],
                    target: nodesArr.filter(n => n.key == e.to)[0]
                };
            });            
        }
    });
    
    var r_w = 150, r_h = 60, fontsize = 10;
    
    drawChart();

    function drawChart(){
        var nodes = svgContainer
            .selectAll(".node")
            .data(nodesArr);
        
        var enteredNodes = nodes.enter().append('g').attr('class', 'node');

        enteredNodes            
            .append("rect")            
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("rx", d => d.category ? r_h : 0)
            .attr("ry", d => d.category ? r_h : 0)
            .attr("width", d => d.category ? r_h : r_w)
            .attr("height", r_h)
            .attr("fill", "#00a9c9")
            .attr("opacity", 1);
            
        enteredNodes
            .attr('class', 'node-text')
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y - 100)
            .attr("dy", fontsize)
            .text(d => d.text);

        enteredNodes
            .selectAll(".node-text text")
            .call(wrap, r_w);
        
        var links = svgContainer
            .selectAll(".link")
            .data(linksArr);

        var enteredLinks = links.enter().append('g').attr('class', 'link');

        enteredLinks.append('path')
            .attr("d", d => "M " + d.source.x + " " + d.source.y + " L " + d.target.x + " " + d.target.y)
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
    
    }

    //parse position
    function parsePosition(strPosition){
        var posArr = strPosition.split(" ");
        return {x: posArr[0], y: posArr[1]};
    }
    //handler drag start event
    function dragstarted(d) {

    }
    // handle dragging event
    function dragged(d) {
        
    }
    //-------------------- handle drag end event ---------------
    function dragended(d) {
 
    }

    //-------------------------- node mouse hover handler ---------------
    function nodeMouseover(d) {
        
    }
    function nodeMouseout(d) {        

    }
    function nodeClick(d) {
        
    }
};
function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          x = text.attr("x"),
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }