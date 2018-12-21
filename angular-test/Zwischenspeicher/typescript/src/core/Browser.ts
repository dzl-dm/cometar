import Tree from "./Tree";
import Observer from "./Observer";

let getDomo = function() { 
    return $(`<div id='conceptTreeContainer'>
<div id='treeMenu'>
    <div class='treeMenuItem selectedMenuOption' target='conceptTree'>concepts</div>
    <div class='treeMenuItem' target='searchDiv'>search</div>
</div>
<div id='treeContent'>
</div>
<div id='logoDiv'> 
    <a href='./index.html'> 
        <img src='images/CoMetaR_Logo.png'/> 
        <img src='images/loading.png' id='loadingPng' /> 
    </a> 
    <a href='http://www.dzl.de'><img src='images/DZL_Logo.png'/></a> 
</div> 
</div></div> 
<div id='containerSpacer'/> 
<div id='modulesContainer'><div> 
<div id='modulesMenu'></div> 
<div id='modulesContents'></div> 
</div>`) }

$.fn.cometar_browser = function() {
    let domo = getDomo();
    domo.find(".treeMenuItem").click(function(){
        $("#treeMenu .selectedMenuOption").removeClass("selectedMenuOption");
        $(this).addClass("selectedMenuOption");
        $("#treeContent .optionDiv.selectedContentOption").removeClass("selectedContentOption");
        $(`#treeContent #${$(this).attr("target")}`).addClass("selectedContentOption");
    });
    $(this).addClass("cometarContainer").append(domo);
    
    Tree.init();
    Observer.init();
        
    $("#treeContent").append(Tree.getDomo().addClass("optionDiv").addClass("selectedContentOption"));
}