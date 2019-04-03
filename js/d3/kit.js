
//get tree structure's max depth
get_max_depth = (obj) => { //obj : json data
    var depth = 0;
    if (obj.children) {
        obj.children.forEach(function (d) {
            var tmpDepth = get_max_depth(d)
            if (tmpDepth > depth) {
                depth = tmpDepth
            }
        })
    }
    return 1 + depth
};

get_random_color = () =>  "#"+((1<<24)*Math.random()|0).toString(16);

get_depth_colors = (d_max) => {
    colors = [];
    for(i = 0; i < d_max; i++){
        colors[i] = get_random_color();
    }
    return colors;
};

get_c_depth_color = (index) => {
    return depth_colors[index];
};

// //image file selector

// document.getElementById('hidden-file-upload').addEventListener('change', handleFileSelect, false);

// $("#choose-file").click(() => {
//     $("#hidden-file-upload").click();
// });
// function handleFileSelect(evt){
//     var files = evt.target.files; // FileList object    
//     d_img = "img/node_img/" + files[0].name;
// }

