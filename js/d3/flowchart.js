function draw_flowchart(json_file) {
    //-------------------config variables-----------------------
    var c_w = 80, c_h = 50, m = 40, //c_w:cell width, c_h: cell_height, m: margin
        maps = [], nodes = [], links = [];        
    //----------------------------------------------------------

    d3.select("svg").selectAll("*").remove();    

    var svgContainer = d3.select("svg")
        .attr("width", w)
        .attr("height", h)
        .append("g")
        .attr("transform", "translate(" + w / 2 + ", 50)");

    svgContainer.append('defs').append("marker")
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('xoverflow', 'visible')
        .append('path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', 'black')
        .style('stroke', 'none')
        .attr("class", "arrowHead");        

    //load json data    
    jQuery.ajax({
        dataType: "json",
        url: "json/" + json_file,
        async: false,
        success: function (data) {
            nodes = data.nodes;
            nodes.forEach((n, i) => {
                nodes[i] = {
                    id: n.id,
                    category: n.category,
                    i: n.i,
                    j: n.j,
                    pos: getPositions(n.i, n.j, n.category),
                    text: n.text
                };
            });
            links = data.links;
            links.forEach((e, i) => {
                links[i] = {                    
                    source: nodes.filter(n => n.id == e.from)[0],
                    target: nodes.filter(n => n.id == e.to)[0]
                };
            });
            console.log(nodes)
        }
    });
    
    var map_w = d3.max(nodes.map(d => d.i)) + 1,
        map_h = d3.max(nodes.map(d => d.j)) + 1;
    
    //construct map
    for(var i = 0; i < map_w; i++){
        for(var j = 0; j < map_h; j++){
            var cell = {
                i: i,
                j: j,
                is_any: false
            }
            for(var p = 0; p < nodes.length; p++){
                if(nodes[p].i == i && nodes[p].j == j){
                    cell.is_any = true;
                    break;
                }
            }
            maps.push(cell);
        }
    }
    //move graph to screen center
    var flowContainer = svgContainer.append('g')
        .attr('transform', 'translate(-' + map_w * (c_w + m) /2 + ', 0)');

    drawChart();

    function drawChart() {

        var linksGroup = flowContainer
            .selectAll(".link")
            .data(links);
        var enteredLinks = linksGroup.enter().append('g').attr('class', 'link');
        enteredLinks.append('path')
            .attr("d", d => getPath(d))            
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr('marker-end', 'url(#arrowhead)');

        var nodesGroup = flowContainer
            .selectAll(".node") 
            .data(nodes);
        var enteredNodes = nodesGroup.enter().append('g').attr('class', 'node');                    

        enteredNodes
            .append("rect")
            .attr("x", d => d.pos.l.x)
            .attr("y", d => d.pos.t.y)
            .attr("rx", d => d.category == "circle" ? c_h : 0)
            .attr("ry", d => d.category == "circle" ? c_h : 0)
            .attr("width", d => d.category == "circle" ? c_h : c_w)
            .attr("height", c_h)
            .attr("fill", "#00a9c9");
            
        enteredNodes
            .append("text")
            .attr("x", d => d.pos.c.x)
            .attr("y", d => d.pos.c.y)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .text(d => d.text);
    }
    
    //--------------------Matrix helper functions-----------------------
    function getPath(d) {  
        var strPath = '';      
        var src = d.source,
            tar = d.target;
        // rows
        if(src.i == tar.i){
            if(src.j > tar.j){
                if(src.j - tar.j == 1){
                    strPath = 'M' + src.pos.l.x + ',' + src.pos.l.y + 'L' + tar.pos.r.x + ',' + tar.pos.r.y;
                }else{
                    strPath = 'M' + src.pos.l.x + ',' + src.pos.l.y + 
                            'l' + (-m/2) + ',0' + 
                            'l0,' + (c_h + m)/2 + 
                            'l' + (-(m + c_w) * (src.j - tar.j - 1)) + ',0' +
                            'l0,' + (-(c_h + m)/2) + 
                            'l' + (-m/2) + ',0';                    
                }                
            }else if(src.j < tar.j){
                if(tar.j - src.j == 1){
                    strPath = 'M' + src.pos.r.x + ',' + src.pos.r.y + 'L' + tar.pos.l.x + ',' + tar.pos.l.y;
                }else{
                    strPath = 'M' + src.pos.r.x + ',' + src.pos.r.y + 
                            'l' + (m/2) + ',0' + 
                            'l0,' + (c_h + m)/2 + 
                            'l' + ((m + c_w) * (tar.j - src.j - 1)) + ',0' +
                            'l0,' + (-(c_h + m)/2) + 
                            'l' + (m/2) + ',0';
                }
            }
        }else{// src.i < tar.i            
            if(src.j > tar.j){
                strPath += 'M' + src.pos.b.x + ',' + src.pos.b.y +
                        'l0,' + m/2 + 
                        'l' + (-(c_w + m)) * (src.j - tar.j) + ',0';
                if(tar.i - src.i > 1){
                    strPath +=  'l' + (-(c_w + m)/2) + ',0' +
                                'l0,' + (tar.i - src.i - 1) * (m + c_h) + 
                                'l' + (c_w + m)/2 + ',0';                                 
                }
                strPath += 'l0,' + m/2;                
            }else if(src.j < tar.j){
                strPath += 'M' + src.pos.b.x + ',' + src.pos.b.y +
                        'l0,' + m/2 + 
                        'l' + ((c_w + m)) * (tar.j - src.j) + ',0';
                if(tar.i - src.i > 1){
                    strPath +=  'l' + ((c_w + m)/2) + ',0' +
                                'l0,' + (tar.i - src.i - 1) * (m + c_h) + 
                                'l' + (-(c_w + m)/2) + ',0';                                 
                }
                strPat += 'l0,' + m/2;                
            }else{// src.j = tar.j
                if(tar.i - src.i > 1){
                    strPath = 'M' + src.pos.b.x + ',' + src.pos.b.y +
                        'l0,' + m/2 + 
                        'l' + ((c_w + m)/2) + ',0' +
                        'l0,' + (tar.i - src.i) * (m + c_h) + 
                        'l' + (-(c_w + m)/2) + ',0' +
                        'l0,' + m/2;                    
                }else{
                    strPath = 'M' + src.pos.b.x + ',' + src.pos.b.y + 'L' + tar.pos.t.x + ',' + tar.pos.t.y;
                }                
            }
        }
        return strPath;
    }  
    function getPositions(i, j, category) { //category : circle or rect
        var cx = j * (c_w + m) + c_w/2,
            cy = i * (c_h + m) + c_h/2;
        return {
            l: { x: category == "circle" ? cx - c_h/2 : cx - c_w/2, y: cy},//left
            r: { x: category == "circle" ? cx + c_h/2 : cx + c_w/2, y: cy},//right
            t: { x: cx, y: cy - c_h/2},//top
            b: { x: cx, y: cy + c_h/2},//bottom
            c: { x: cx, y: cy}//center
        };
    }

    function wrap(text, width) {
        text.each(function () {
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
};