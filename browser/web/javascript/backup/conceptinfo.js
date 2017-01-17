TreeManager.info = function(container)
{
	InfoManager.init(container);
	return this;
}

var InfoManager = (function(){
	var container;
	
	var init = function(c)
	{
		container = c;
		c.html(
			"<div id='infoDiv'> \
				<h3>Concept Code</h3> \
				<div id='infoConceptCode'/> \
				<h3>Labels</h3> \
				<div id='infoLabels'/> \
				<h3>Notations</h3> \
				<div id='infoNotations' /> \
			</div>"
		);
		TreeManager.subscribeCreateTreeItem(onTreeItemCreate);
	}
	
	var onTreeItemCreate = function(treeItemDiv)
	{
		var infoDiv = $("<div>");
		infoDiv.html("Info")
			.addClass("detailsButton")
			.addClass("infoButton")
			.click(function(e){
				e.stopPropagation();
				loadInfo(treeItemDiv);
				$("div.currentDetailsSource").removeClass("currentDetailsSource");
				$(this).parent().addClass("currentDetailsSource");
			});
		treeItemDiv.append(infoDiv);		
	}
	
	var loadInfo = function(treeItemDiv)
	{
		$("#infoConceptCode, #infoLabels, #infoNotations").html("");
		var queryString = QueryManager.queries.getConceptInfos.replace(/CONCEPT/g, treeItemDiv.attr("data-concepturl"));
		QueryManager.query(queryString, putInfo);
	}
	
	var putInfo = function(item)
	{
		if (item["label"]) appendInfo($("#infoLabels"), item["lang"].value.toUpperCase() + ": " + item["label"].value);
		if (item["notation"]) appendInfo($("#infoNotations"), item["notation"].value);
		if (item["concept"]) appendInfo($("#infoConceptCode"), item["concept"].value);	
	}
	
	var appendInfo = function(div, value)
	{
		if (div.html().indexOf(value) == -1)
		{
			if (div.html() == "") div.html(value);
			else div.html(div.html() + "<br/>" + value);		
		}
	}
	
	return {
		init:init
	}
}());