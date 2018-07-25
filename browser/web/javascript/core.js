var conf = {};

$.fn.ontologieManager = function() {
	conf.container = $(this);
	$(this).bind("DOMSubtreeModified", function(e) {
		$(e.target).find("div").hover(
			function() {
				var tt = $( this ).attr("tooltip");
				if (tt != undefined)
				{
					var tooltip = $("#tooltipDiv");
					tooltip.html(tt);
					tooltip.css("top", ($(this).offset().top - tooltip.outerHeight()) + "px");
					tooltip.css("left", ($(this).offset().left - tooltip.outerWidth()) + "px");
					tooltip.show();
				}
				var tt = $( this ).data("tooltip");
				if (tt != undefined)
				{
					var tooltip = $("#tooltipDiv");
					tooltip.html(tt($(this).data("tooltiparg")));
				}
			}, function() {
				$("#tooltipDiv").hide();
			}
		);
	});
	$(this).html(	
		"<div id='conceptTreeContainer'><div> \
			<div id='treeMenu'>\
				<div class='treeMenuItem activeMenuItemDiv' target='conceptTree'>concepts</div>\
				<div class='treeMenuItem' target='searchDiv'>search</div>\
			</div>\
			<div id='treeContent'>\
				<div id='conceptTree' class='treeContentItem activeTreeContentDiv'></div> \
				<div id='searchDiv' class='treeContentItem'> \
					<form> \
						<input type='text' id='searchPatternText'/> \
						<input type='submit' value='search' id='searchSubmitButton'/> \
					</form> \
					<div id='searchResultDiv'></div> \
				</div> \
			</div>\
			<div id='logoDiv'> \
				<a href='./index.html'><img src='images/CoMetaR_Logo.png'/></a> \
				<a href='http://www.dzl.de'><img src='images/DZL_Logo.png'/></a> \
			</div> \
		</div></div> \
		<div id='containerSpacer'/> \
		<div id='modulesContainer'><div> \
			<div id='modulesMenu'></div> \
			<div id='modulesContents'></div> \
		</div></div> \
		<div id='tooltipDiv'></div>"
	).addClass("cometarContainer");
	ModuleManager.renderModules();
	
	TreeManager.load();
	$("#conceptTreeContainer").resizable({
		handles: "e"
	});
	//$("#modulesContainer").resizable();
	//$(this).resizable();
	
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
		conceptUrl = Helper.getCurrentConceptUrl();
		TreeManager.openPaths(conceptUrl, true);
		ModuleManager.showTab("details");
	}
	$(window).bind( 'hashchange', function(e) {
		conceptUrl = Helper.getCurrentConceptUrl();
		TreeManager.openPaths(conceptUrl, true);
		ModuleManager.showTab("details");
	});
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
		QueryManager.getTopElements(function(url){
			putTreeItem(url, container);
		});
	}
	
	var fillWithSubConcepts = function(treeItemDiv)
	{
		QueryManager.getSubElements(treeItemDiv.attr("data-concepturl"), function(url){
			putTreeItem(url, treeItemDiv);
		});
	}
	
	//checks weather there already exists a corresponding div (same data-concepturl)
	var putTreeItem = function(url, treeItemDiv)
	{		
		if (treeItemDiv.children("div[data-concepturl='"+url+"']").length == 0)
		{
			createTreeItem(url, treeItemDiv);
		}
	}

	var createTreeItem = function(url, treeItemDiv)
	{
		var ti = new treeItem().load(url);
		QueryManager.getProperty(url, "skos:prefLabel", "lang(?result) = 'en'", function(r){
			ti.setTitle(r.value);
		});	
		QueryManager.getMultiProperties(url, [ "skos:narrower", "rdf:hasPart", "skos:member" ], function(r){
			ti.setHasChildren();
		});
		QueryManager.getProperty(url, "rdf:partOf", function(r){
			ti.setIsModifier();
		});
		QueryManager.getProperty(url, "rdf:type", function(r){
			if (r.value == "http://www.w3.org/2004/02/skos/core#Collection") ti.setIsCollection();
		});
		QueryManager.getProperty(url, ":status", function(r){
			ti.setStatus(r.value);
		});
		
		var newItemDiv = ti.getItemDiv();
		newItemDiv.click(function(){$(document).trigger("tree:treeItemClicked");});
		treeItemDiv.append(newItemDiv);
		$(document).trigger("tree:treeItemCreated", newItemDiv);
		newItemDiv.show();//(100);
		return ti;		
	}
	
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
			QueryManager.getSearchResults(pattern, function(results){
				putTreeItem(results["concept"].value, $("#searchResultDiv"));
				appendSearchMatches(results, pattern);				
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
		if (queryResultItem["label2"] && queryResultItem["label2"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["label2"].value;
			appendSearchMatchInfo(textDiv, "Label ("+queryResultItem["lang2"].value+")", appendString);			
		}
		if (queryResultItem["altlabel"] && queryResultItem["altlabel"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["altlabel"].value;
			appendSearchMatchInfo(textDiv, "Alternative Label ("+queryResultItem["altlang"].value+")", appendString);			
		}
		if (queryResultItem["notation"] && queryResultItem["notation"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["notation"].value;
			appendSearchMatchInfo(textDiv, "Notation", appendString);			
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
		if (queryResultItem["status"] && queryResultItem["status"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["status"].value;
			appendSearchMatchInfo(textDiv, "Status", appendString);			
		}
		if (queryResultItem["creator"] && queryResultItem["creator"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["creator"].value;
			appendSearchMatchInfo(textDiv, "Author", appendString);			
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
	
	var closeFalsePaths = function(conceptUrl)
	{
		$(".treeItem.expanded[data-concepturl!='"+conceptUrl+"']").each(function(){
			if ($(this).find(".treeItem[data-concepturl='"+conceptUrl+"']").length == 0)
			{
				($(this).data("treeobject")).collapse();
				//elements from within each-loop might already have been removed from DOM at this point
				closeFalsePaths(conceptUrl);
				return false;
			}
		});
	}
	
	var openPaths = function(conceptUrl, closeFalsePathsBeforeOpening)
	{
		$(".pathPart").removeClass("pathPart");
		unmarkTreeItems(conceptUrl);
		if (closeFalsePathsBeforeOpening) closeFalsePaths(conceptUrl);
		Helper.getPathsByConceptUrl(conceptUrl, function(path){
			TreeManager.openPath(path[0]);
		});
	}
	
	var openPath = function(path, scrollThere)
	{
		var conceptUrl = path[path.length-1];
		unmarkTreeItems(conceptUrl);
		
		$("#conceptTree .pathPart").removeClass("pathPart");
		$("#conceptTree").addClass("pathPart");
		var pathDepth = 1;
		while (path.length > 0)
		{
			$("#conceptTree .treeItem[data-concepturl='"+path[0]+"']").each(function(){
				pathPart = $(this);
				if (pathPart.parent().hasClass("pathPart") && pathPart.parents(".pathPart").length == pathDepth)
				{
					path.shift();
					pathDepth++;
					pathPart.addClass("pathPart");
					if (path.length > 0)
						pathPart.data("treeobject").expand();
					else 
					{
						mark(conceptUrl);
						if (scrollThere) scrollToTreeItem(pathPart);
					}
				}
			});
		}
	}
	
	var scrollToTreeItem = function(treeItemDiv)
	{
		$("#conceptTree").animate({
			scrollTop: $("#conceptTree").scrollTop() + treeItemDiv.offset().top - 150
		},200);
	}
	
	var unmarkTreeItems = function(excludeConceptUrl)
	{
		$("div.currentDetailsSource[data-concepturl!='"+excludeConceptUrl+"']").removeClass("currentDetailsSource");
	}
	
	var mark = function(conceptUrl)
	{
		$(".treeItem[data-concepturl='"+conceptUrl+"']").addClass("currentDetailsSource");
	}
	
	return {
		load: load,
		createTopTreeItems: createTopTreeItems,
		fillWithSubConcepts: fillWithSubConcepts,
		openPath: openPath,
		openPaths: openPaths,
		mark: mark
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
				var conceptUrl = $(this).attr("data-concepturl");
				Helper.setCurrentConceptUrl(conceptUrl);
				if (treeItemDiv.hasClass("expandable")) expandOrCollapse();
				TreeManager.mark(conceptUrl);
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
	
	var load = function(conceptURL)
	{
		treeItemDiv.attr("data-concepturl", conceptURL)
			.data("treeobject", this);
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
	
	var setTitle = function(label)
	{
		treeItemDiv.children(".treeItemTitleDiv").prepend(label);				
	}
	
	var setHasChildren = function(){
		treeItemDiv.addClass("expandable");
		//might already have been expanded because of automatic tree opening
		if (!treeItemDiv.hasClass("expanded")) treeItemDiv.addClass("collapsed");
	}
	
	var setIsModifier = function(){
		treeItemDiv.addClass("isModifier");
	}
	
	var setStatus = function(stat){
		if(stat == "draft") treeItemDiv.addClass("isOnDraft");
		else if(stat == "obsolete") treeItemDiv.addClass("isObsolete");
		else if(stat == "new") treeItemDiv.addClass("isNew");
		treeItemDiv.children(".treeItemTitleDiv").append("<div class='treeItemStatusDiv "+stat+"'>"+stat+"</div>");
	}
	
	var setIsCollection = function(){
		treeItemDiv.addClass("isCollection");
	}			
		
	return {
		load:load,
		getItemDiv: getItemDiv,
		setTitle: setTitle,
		collapse: collapse,
		expand: expand,
		setHasChildren: setHasChildren,
		setIsModifier: setIsModifier,
		setStatus: setStatus,
		setIsCollection: setIsCollection
	};
}

$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});