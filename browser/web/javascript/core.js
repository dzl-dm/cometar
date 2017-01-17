var conf = {};

$.fn.ontologieManager = function() {
	conf.container = $(this);
	$(this).bind("DOMSubtreeModified", function(e) {
		$(e.target).find("div").hover(
			function() {
				if ($( this ).attr("tooltip") != undefined)
				{
					var tooltip = $("#tooltipDiv");
					tooltip.html($(this).attr("tooltip"));
					tooltip.css("top", ($(this).offset().top - tooltip.outerHeight()) + "px");
					tooltip.css("left", ($(this).offset().left - tooltip.outerWidth()) + "px");
					tooltip.show();
				}
			}, function() {
				$("#tooltipDiv").hide();
			}
		);
	});
	$(this).html(	
		"<div id='conceptTreeContainer'> \
			<div id='treeMenu'>\
				<div class='treeMenuItem activeMenuItemDiv' target='conceptTree'>concepts</div>\
				<div class='treeMenuItem' target='searchDiv'>search</div>\
			</div>\
			<div id='conceptTree' class='treeContentItem activeTreeContentDiv'></div> \
			<div id='searchDiv' class='treeContentItem'> \
				<form> \
					<input type='text' id='searchPatternText'/> \
					<input type='submit' value='search' id='searchSubmitButton'/> \
				</form> \
				<div id='searchResultDiv'></div> \
			</div> \
		</div> \
		<div id='containerSpacer'/> \
		<div id='modulesContainer'> \
			<div id='modulesMenu'></div> \
			<div id='modulesContents'></div> \
		</div> \
		<div id='tooltipDiv'></div>"
	).css("display", "table");
	TreeManager.load();
	TreeManager.renderTree();
	ModuleManager.renderModules();
	$("#conceptTreeContainer").resizable();
	/*$("#modulesContainer").resizable();*/
	$(this).resizable();
	
	var match = location.search.match(new RegExp("[?&]"+"search"+"=([^&]+)(&|$)"));
	var searchString = match && decodeURIComponent(match[1].replace(/\+/g, " "));
	if (searchString != null)
	{
		$(".treeMenuItem[target='searchDiv']").click();
		$("#searchPatternText").val(searchString);
		$("#searchSubmitButton").click();
	}
	
	if (location.hash != "")
	{
		conceptUrl = decodeURIComponent(location.hash).substring(1);
		Helper.getPathsByConceptUrl(conceptUrl, function(paths){
			var urlPathsOnly = [];
			for (var i = 0; i < paths.length; i++)
			{
				urlPathsOnly = $.merge(urlPathsOnly, [paths[i][0]]);
			}
			TreeManager.openPaths(urlPathsOnly);
		});
	}
}

var TreeManager = (function(){		
	var load = function()
	{
		initClickEvents();
		createTopTreeItems($("#conceptTree"));
		return this;
	}
	
	var createTopTreeItems = function(container)
	{
		var queryString = QueryManager.queries.getTopConcepts;
		QueryManager.query(queryString, function(queryResultItem){
			var newItem = putTreeItem(queryResultItem, container);
		});
	}
	
	var fillWithSubConcepts = function(treeItemDiv)
	{
		var queryString = QueryManager.queries.getModifiers.replace(/PARENTCONCEPT/g, treeItemDiv.attr("data-concepturl"));
		QueryManager.query(queryString, function(queryResultItem){
			putTreeItem(queryResultItem, treeItemDiv);
		});
		var queryString = QueryManager.queries.getSubConcepts.replace(/PARENTCONCEPT/g, treeItemDiv.attr("data-concepturl"));
		QueryManager.query(queryString, function(queryResultItem){
			putTreeItem(queryResultItem, treeItemDiv);
		});
	}
	
	//checks weather there already exists a corresponding div (same data-concepturl)
	var putTreeItem = function(queryResultItem, treeItemDiv)
	{
		var conceptURL = queryResultItem["concept"].value;
		var childItemDiv = treeItemDiv.children("div[data-concepturl='"+conceptURL+"']");
		if (!childItemDiv.length) 
		{
			childItem = createTreeItem(queryResultItem, treeItemDiv);
		}
		else childItem = childItemDiv.data("treeobject");
		childItem.putTitleIfNotPutYet(queryResultItem);
	}
	
	//creates a new tree Item, is expandable by subscribeCreateTreeItem
		// createTreeItem({
			// concept: { value: "test" },
			// label: { value: "test" }
		// }, $("#conceptTree").append($("<div>")));
	var createTreeItem = function(queryResultItem, treeItemDiv)
	{
		var ti = new treeItem().load(queryResultItem);
		var newItemDiv = ti.getItemDiv();
		treeItemDiv.append(newItemDiv);
		newItemDiv.show(100);
		return ti;		
	}
	
	//calls additionalFunction with the created treeItem of type <div> as argument
	var subscribeCreateTreeItem = function(additionalFunction)
	{
		var oldFunction = createTreeItem;
		createTreeItem = extendedFunction;
		function extendedFunction() {
			var treeItem = oldFunction.apply(TreeManager, arguments);
			additionalFunction(treeItem.getItemDiv());
			return treeItem;
		}
	}
	
	var subscribeClickTreeItem = function(additionalFunction)
	{
		var oldFunction = createTreeItem;
		createTreeItem = extendedFunction;
		function extendedFunction() {
			var treeItem = oldFunction.apply(TreeManager, arguments);
			treeItem.getItemDiv().click(additionalFunction);
			return treeItem;
		}
	}
	
	var renderTree = function()
	{
		$(".treeContentItem").css("maxHeight", (conf.container.height()- $("#treeMenu").height())+"px");
	}
	
	/*var markByLabel = function(label)
	{
		$("#conceptTree span.conceptLabel").css("backgroundColor", "");
		$("#conceptTree span.conceptLabel:contains('"+label+"')").css("backgroundColor", "yellow");
	}*/
	
	var initClickEvents = function()
	{
		$(".treeMenuItem").click(function(){
			$(".activeTreeContentDiv").removeClass("activeTreeContentDiv");
			$("#"+$(this).attr("target")).addClass("activeTreeContentDiv");
			$("#conceptTreeContainer .activeMenuItemDiv").removeClass("activeMenuItemDiv");
			$(this).addClass("activeMenuItemDiv");
		});
		$("#searchSubmitButton").click(function(){
			$("#searchResultDiv").html("");
			var pattern = $("#searchPatternText").val();
			var queryString = QueryManager.queries.getSearchBySubstring.replace(/EXPRESSION/g, pattern);
			QueryManager.query(queryString, function(queryResultItem){
				putTreeItem(queryResultItem, $("#searchResultDiv"));
				appendSearchMatches(queryResultItem, pattern);
			});
			markSearchMatches(pattern);
			if (/^\s*$/.test($("#searchResultDiv").html())) $("#searchResultDiv").html("<div style='padding:15px'>Keine Suchergebnisse.</div>");
			//else $("#searchResultDiv .treeItem:first").click();
			return false;
		});
	}
	
	var appendSearchMatches = function(queryResultItem, pattern)
	{
		var conceptURL = queryResultItem["concept"].value;
		var textDiv = $("#searchResultDiv div[data-concepturl='"+conceptURL+"']");
		if (queryResultItem["notation"] && queryResultItem["notation"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["notation"].value;
			appendSearchMatchInfo(textDiv, "Notation", appendString);			
		}
		if (queryResultItem["altlabel"] && queryResultItem["altlabel"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["altlabel"].value;
			appendSearchMatchInfo(textDiv, "Label ("+queryResultItem["altlang"].value+")", appendString);			
		}
		if (queryResultItem["description"] && queryResultItem["description"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["description"].value;
			appendSearchMatchInfo(textDiv, "Description", appendString);			
		}
		if (queryResultItem["unit"] && queryResultItem["unit"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["unit"].value;
			appendSearchMatchInfo(textDiv, "Unit", appendString);			
		}
		if (queryResultItem["concept"] && queryResultItem["concept"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["concept"].value;
			appendSearchMatchInfo(textDiv, "URN", appendString);			
		}
		//textDiv.children("br").first().remove();
	}
	
	var appendSearchMatchInfo = function(div, type, appendString)
	{
		if (div.html().indexOf(appendString) == -1)
			div.append("<div class='treeItemInfoDiv'><div class='treeItemInfoTypeDiv'>"+type+": </div>"+appendString+"</div>");
	}
	
	var markSearchMatches = function(pattern)
	{
		$("#searchResultDiv .treeItemTitleDiv:contains('"+pattern+"'), #searchResultDiv .treeItemInfoDiv:contains('"+pattern+"')").each(function(){
			var re = new RegExp("("+pattern+")","gi");
			var infoTypeDiv = $(this).children(".treeItemInfoTypeDiv").remove()[0];
			var newHtml = "";
			if (infoTypeDiv != undefined) newHtml += infoTypeDiv.outerHTML;
			newHtml += $(this).html().replace(re,"<span class='searchHighlight'>$1</span>");
			$(this).html(newHtml);
		});
	}
	
	var collapseAll = function()
	{
		$("#conceptTree").children().each(function(){
			$(this).data("treeobject").collapse();
		});
	}
	
	var openPaths = function(paths)
	{
		$(".treeMenuItem[target='conceptTree']").click();
		collapseAll();
		$("#conceptTree .pathPart").removeClass("pathPart");
		$("#conceptTree").addClass("pathPart");
		for (var i = 0; i < paths.length; i++)
		{
			var pathToOpen = paths[i];
			var pathDepth = 1;
			while (pathToOpen.length > 0)
			{
				$("#conceptTree .treeItem[data-concepturl='"+pathToOpen[0]+"']").each(function(){
					pathPart = $(this);
					if (pathPart.parent().hasClass("pathPart") && pathPart.parents(".pathPart").length == pathDepth)
					{
						pathToOpen.shift();
						pathDepth++;
						pathPart.addClass("pathPart");
						if (pathToOpen.length > 0)
							pathPart.data("treeobject").expand();
						else if (i == 0)
							pathPart.click();
					}
				});
			}
		}
	}
	
	return {
		load: load,
		createTopTreeItems: createTopTreeItems,
		fillWithSubConcepts: fillWithSubConcepts,
		subscribeCreateTreeItem: subscribeCreateTreeItem,
		subscribeClickTreeItem: subscribeClickTreeItem,
		renderTree: renderTree,
		openPaths: openPaths
	};
}());

var treeItem = function(){
	var treeItemDiv;

	var initDiv = function()
	{
		treeItemDiv = $("<div>");
		treeItemDiv.addClass("treeItem")
			.click(function(e){
				e.stopPropagation();
				if (treeItemDiv.hasClass("expandable")) expandOrCollapse();
				$("div.currentDetailsSource").removeClass("currentDetailsSource");
				var conceptUrl = $(this).attr("data-concepturl");
				$(".treeItem[data-concepturl='"+conceptUrl+"']").addClass("currentDetailsSource");
				location.hash = encodeURIComponent(conceptUrl);
			});
		var expandDiv = $("<div>");
		expandDiv.addClass("expandDiv");
		treeItemDiv.append(expandDiv);
		expandDiv.click(function(e){
			e.stopPropagation();
			if (treeItemDiv.hasClass("expandable")) expandOrCollapse();
		});
		var treeItemTitleDiv = $("<div>");
		treeItemTitleDiv.addClass("treeItemTitleDiv");
		treeItemDiv.append(treeItemTitleDiv);
	}();
	
	var createRoot = function(container)
	{
		treeItemDiv = container;
		return this;
	}
	
	var load = function(queryResultItem)
	{
		var conceptURL = queryResultItem["concept"].value;
		treeItemDiv.attr("data-concepturl", conceptURL)
			.data("treeobject", this);
		if (queryResultItem["subconcept"] != undefined)
		{
			treeItemDiv.addClass("expandable").addClass("collapsed");
		}
		if (queryResultItem["isModifier"])
			treeItemDiv.addClass("isModifier");
		return this;
	}
	
	var getItemDiv = function()
	{
		return treeItemDiv;
	}
	
	var expandOrCollapse = function()
	{
		if (treeItemDiv.hasClass("collapsed")) expand(treeItemDiv);
		else collapse(treeItemDiv);
	}
	
	var expand = function()
	{
		treeItemDiv.removeClass("collapsed").addClass("expanded");
		TreeManager.fillWithSubConcepts(treeItemDiv);
	}
	
	var collapse = function()
	{
		treeItemDiv.removeClass("expanded").addClass("collapsed");
		treeItemDiv.children("div.treeItem").remove();
	}
	
	var putTitleIfNotPutYet = function(queryResultItem)
	{
		if (queryResultItem["lang"].value.toLowerCase() == "en") 
			treeItemDiv.children(".treeItemTitleDiv").text(queryResultItem["label"].value);		
	}
	
	return {
		load:load,
		getItemDiv: getItemDiv,
		putTitleIfNotPutYet, putTitleIfNotPutYet,
		collapse: collapse,
		expand: expand
	};
}

$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});