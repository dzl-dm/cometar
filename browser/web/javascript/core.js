var CB = (function(){	
	var init = function(container){
		container
			.addClass("cometarContainer")
			.html(html);
		loadTooltipFunctionality(container);
		$(window).bind( 'hashchange', function(e) {
			var conceptUrl = Helper.getCurrentConceptUrl();
			TreeManager.openSelectMark({
				IRIs: [conceptUrl],
				closeFalsePathsBeforeOpening: true,
				oneSelectedIri: true
			});
			ModuleManager.showTab("details");
		});
	}
	
	var loadModules = function(){
		$(document).trigger("cometar:readyForModuleRegister");
		ModuleManager.render();	
		if (Helper.getQueryParameter("mode")!="advanced") ModuleManager.hideMenu();
	}
	
	var loadQueries = function(){
		return $.Deferred(function(dfd){
			QueryManager.init().done(dfd.resolve);
		}).promise();
	}
	
	var loadTree = function(){
		return $.Deferred(function(dfd){
			TreeManager.init().then(dfd.resolve);
		}).promise();
	}
	
	var showCurrentConcept = function(){
		if (location.hash != "")
		{
			var conceptUrl = Helper.getCurrentConceptUrl();
			TreeManager.openSelectMark({
				IRIs: [conceptUrl],
				closeFalsePathsBeforeOpening: true,
				oneSelectedIri: true
			});
		}
		ModuleManager.showTab("details");
	}
	
	var html = function(){
		var result = $(
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
					<a href='./index.html' style='position:relative'> \
						<img src='images/CoMetaR_Logo.png'/> \
						<img src='images/loading.png' id='loadingPng' /> \
					</a> \
					<a href='http://www.dzl.de'><img src='images/DZL_Logo.png'/></a> \
				</div> \
			</div></div> \
			<div id='containerSpacer'/> \
			<div id='modulesContainer'><div> \
				<div id='modulesMenu'></div> \
				<div id='modulesContents'></div> \
			</div></div>"
		);
		$(result[0]).resizable({
			handles: "e"
		});
		return result;
	}();
	
	var loadTooltipFunctionality = function(container){
		container.append("<div id='tooltipDiv'>");
		$("#tooltipDiv").before($("<div id='tooltipbackgrounddiv' style='width:100%;height:100%;background-color:grey;opacity:0.9;position:fixed;left:0px;top:0px;display:none'>"));
		$("#tooltipDiv").append($("<div id='tooltipContentDiv'>"));
		var showTooltip = function(ttdiv)
		{
			var tt = $(ttdiv).attr("tooltip");
			var tooltip = $("#tooltipDiv");
			var tooltipcontent = $("#tooltipContentDiv");
			
			tooltipcontent.html(tt);
			/*tooltip.css("maxWidth", $(this).offset().left-10);
			tooltip.css("maxHeight", $(this).offset().top-10);
			var newleft = $(this).offset().left - tooltip.outerWidth();
			if (newleft<0)newleft=10;
			tooltip.css("left", newleft + "px");					
			var newtop = $(this).offset().top - tooltip.outerHeight();
			if (newtop<0)newtop=10;
			tooltip.css("top", newtop + "px");*/
			tooltip.css("width", $("#modulesContents").width()-50+"px");
			tooltip.css("left", $("#modulesContents").offset().left+10+"px");
			tooltip.css("height", "calc(50% - 50px)");
			tooltipcontent.css("height", (tooltip.outerHeight()-20) +"px");
			var newtop = ttdiv.offset().top - tooltip.outerHeight();
			if (newtop < 0)
			{
				newtop = ttdiv.offset().top + ttdiv.outerHeight();
			}
			tooltip.css("top", newtop+"px");
			$("#tooltipbackgrounddiv")
				.css("left",$("#modulesContents").offset().left)
				.css("width",$("#modulesContents").width())
				.css("top",$("#modulesContents").offset().top)
				.css("height",$("#modulesContents").height())
				.css("display","block");
			tooltipcontent.scrollTop(0);
			tooltip.css("display","block");
		}
		var hideTooltip = function(){
			$("#tooltipDiv").css("display","none");
			$("#tooltipbackgrounddiv").css("display","none");
			$(".tooltipedDiv").removeClass("tooltipedDiv");	
		}
		container.bind("DOMSubtreeModified", function(e) {
			var tooltiptimeout;
			$(e.target).find("div").hover(
				function() {
					var ttdiv = $(this);
					if ($(ttdiv).attr("tooltip") != undefined)
					{
						ttdiv.addClass("tooltipedDiv");
						tooltiptimeout = setTimeout(function(){showTooltip(ttdiv)},300);
					}
				}, function() {
					clearTimeout(tooltiptimeout);
					var tooltip = $("#tooltipDiv");
					if (!tooltip.is(":hover")) {
						hideTooltip();
					}
				}
			);
		});	
		$("#tooltipDiv").hover(function(){},function(){
			var ttdiv = $(".tooltipedDiv:first");
			if (ttdiv.length == 0 || !ttdiv.is(":hover")) {
				hideTooltip();
			}
		});
	}
	
	return {
		init: init,
		loadModules: loadModules,
		loadQueries: loadQueries,
		loadTree: loadTree,
		showCurrentConcept: showCurrentConcept
	}
}());

$.fn.ontologieManager = function() {
	CB.init($(this));
	CB.loadModules();
	CB.loadQueries()
		.then(function(){
			CB.loadTree();
			CB.showCurrentConcept();
		});
}

var TreeManager = (function(){		
	var initItem = function(iri, parentDiv) {
		(new TreeItem()).init(iri, parentDiv);
	}
	var getItem = function(iri){
		return getItemDiv(iri).data("treeobject");
	}
	var getItemDiv = function(iri){
		return $(".treeItem[rdf-iri='"+iri+"']");
	}
	var TreeItem = function(){	
		var treeItemDiv;
		var iri;
		var init = function(elementiri, parentDiv) {
			iri = elementiri;
			treeItemDiv = $("<div>")
				.attr("rdf-iri", iri)
				.addClass("treeItem")
				.data("treeobject", this)
				.click(function(e){
					e.stopPropagation();
					Helper.setCurrentConceptUrl(iri);
					//if ($(this).hasClass("expandable")) expandOrCollapse();
				});
				
			var expandDiv = $("<div>")
				.addClass("expandDiv");
			treeItemDiv.append(expandDiv);
			expandDiv.click(function(e){
				e.stopPropagation();
				if (treeItemDiv.hasClass("expandable")) expandOrCollapse();
			});
			
			var treeItemTitleDiv = $("<div>")
				.addClass("treeItemTitleDiv");
			treeItemDiv.append(treeItemTitleDiv);	
		
			parentDiv.append(treeItemDiv);
			$(document).trigger("tree:treeItemCreated", treeItemDiv);
			treeItemDiv.show();//(100);	
			
			return this;
		}
		
		var expandOrCollapse = function()
		{
			if (treeItemDiv.hasClass("collapsed")) return expand(treeItemDiv);
			else collapse(treeItemDiv);
		}
		
		var expand = function()
		{
			if (treeItemDiv.hasClass("expandable") && treeItemDiv.hasClass("collapsed")){
				var dfd = $.Deferred();
				treeItemDiv.removeClass("collapsed").addClass("expanded");
				var processes = [];
				QueryManager.getSubElements(iri, function(subiri){
					processes.push(createTreeItemIfNotExist(subiri, treeItemDiv));
				}, function(){
					$.when.apply($,processes).then(dfd.resolve);
				});
				return dfd.promise();
			}
		}
		
		var collapse = function()
		{
			if (treeItemDiv.hasClass("expandable") && treeItemDiv.hasClass("expanded")){
				treeItemDiv.removeClass("expanded").addClass("collapsed");
				treeItemDiv.children("div.treeItem").remove();
			}
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

		var markAsSelected = function(){
			treeItemDiv.addClass("currentDetailsSource");
		}
			
		return {
			init:init,
			setTitle: setTitle,
			collapse: collapse,
			expand: expand,
			setHasChildren: setHasChildren,
			setIsModifier: setIsModifier,
			setStatus: setStatus,
			setIsCollection: setIsCollection
		};
	};
	var init = function()
	{
		var dfd = $.Deferred();
		initMenu();
		var processItems = [];
		QueryManager.getTopElements(function(url){
			processItems.push(createTreeItemIfNotExist(url, $("#conceptTree")));
		}, function(){
			$.when.apply($, processItems).then(dfd.resolve);
		});
		
		return dfd.promise();
	}
	
	//checks weather there already exists a corresponding div (same rdf-iri)
	var createTreeItemIfNotExist = function(iri, treeItemDiv){		
		if (treeItemDiv.children("div[rdf-iri='"+iri+"']").length == 0){
			return createTreeItem(iri, treeItemDiv);
		}
	}

	var createTreeItem = function(url, treeItemDiv){
		var dfd = $.Deferred();
		var ti = (new TreeItem()).init(url, treeItemDiv);
		$.when(
			QueryManager.getProperty(url, "skos:prefLabel", "lang(?result) = 'en'", function(r){
				ti.setTitle(r.value);
			}),
			QueryManager.getMultiProperties(url, [ "skos:narrower", "rdf:hasPart", "skos:member" ], function(r){
				ti.setHasChildren();
			}),
			QueryManager.getProperty(url, "rdf:partOf", function(r){
				ti.setIsModifier();
			}),
			QueryManager.getProperty(url, "rdf:type", function(r){
				if (r.value == "http://www.w3.org/2004/02/skos/core#Collection") ti.setIsCollection();
			}),
			QueryManager.getProperty(url, ":status", function(r){
				ti.setStatus(r.value);
			})
		).then(dfd.resolve);
		return dfd.promise();		
	}
	
	var initMenu = function()
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
				createTreeItemIfNotExist(results["concept"].value, $("#searchResultDiv"));
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
		var textDiv = $("#searchResultDiv div[rdf-iri='"+conceptURL+"']");
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
	
	//currently only works for a single concept
	var closeFalsePaths = function(pathParts)
	{
		$(".treeItem.expanded").each(function(){
			if (pathParts.indexOf($(this).attr("rdf-iri")) == -1){
				($(this).data("treeobject")).collapse();
				//elements from within each-loop might already have been removed from DOM at this point
				closeFalsePaths(pathParts);
				return false;	
			}
		});
	}
	
	var collapseAll = function(){
		$("#conceptTree > div.treeItem.expandable.expanded").each(function(){
			$(this).data("treeobject").collapse();
		});
	}
	
	var markItemAsSelected = function(iri){
		getItemDiv(iri).addClass("currentDetailsSource");
	}
	/*
		a.IRIs, a.dontUnmark, a.oneSelectedIri, a.dontClosePaths, a.markMapping
	*/
	var openSelectMark = function(a){
		if (!Array.isArray(a.IRIs)) a.IRIs=a.IRIs.split(";");
		if (a.IRIs.length==0||a.IRIs[0]==undefined) return;
		//before opening
		if (!a.dontUnmark) {
			$(".pathPart").removeClass("pathPart");
			$(".currentDetailsSource").removeClass("currentDetailsSource");
		}
		if (a.oneSelectedIri) markItemAsSelected(a.IRIs[0]);
		
		//opening
		var pathParts = [];
		QueryManager.getPathPartsOfMultipleElements(a.IRIs, function(iri){
			pathParts.push(iri);
		}).done(function(){
			if (!a.dontClosePaths) closeFalsePaths(pathParts);
			var checkIfAllOpened = function(){
				for (var i = pathParts.length-1; i >=0 ; i--){		
					var pathPartDiv = getItemDiv(pathParts[i]);
					if (pathPartDiv.length == 0 || pathPartDiv.hasClass("collapsed")) {
						return false;
					}
				}
				return true;
			}
			//recursively open paths until all are opened
			var expandNextItem = function() {
				if (checkIfAllOpened()) {
					afterOpening(a, pathParts);
					return;
				}
				//open every pathpart treeitem
				for (var i = pathParts.length-1; i >=0 ; i--)
				{
					//open all occurences of one treeitem
					var pathPartDivs = getItemDiv(pathParts[i]);
					for (var j = 0; j < pathPartDivs.length; j++)
					{
						var pathPartDiv = $(pathPartDivs[0]);
						if (pathPartDiv.hasClass("collapsed")){
							pathPartDiv.data("treeobject").expand().then(expandNextItem);
							return;
						}
					}
				}	
			};
			expandNextItem();
		});			
	}		
	var afterOpening = function(a, pathParts){
		if (a.oneSelectedIri) {
			getItem(a.IRIs[0]).expand();
			markItemAsSelected(a.IRIs[0]);
		}
		if (a.markMapping) {
			TreeElementsMarker.setFields(a.IRIs, pathParts);
			TreeElementsMarker.mark();
		}			
	}
	
	var TreeElementsMarker = (function()
	{
		var mappedElements = [];
		var mappedPathFields = [];
		var mappingDescriptions = [];
		return {
			mark: function(itemDiv)
			{
				if (!itemDiv)
				{
					$(".mappedInConfig, .mappedInConfigPathPart").removeClass("mappedInConfig").removeClass("mappedInConfigPathPart");
					$(".treeItem").each(function(){
						TreeManager.TreeElementsMarker.mark($(this));
					});
				}
				else
				{
					var conceptUrl = $(itemDiv).attr("rdf-iri");
					if (mappedElements != undefined && mappedElements.indexOf(conceptUrl) > -1){
						$(itemDiv).addClass("mappedInConfig");
						if (mappingDescriptions != undefined) $(itemDiv).prepend("<div style='font-size:12px;color:#333'>map: " + mappingDescriptions[mappedElements.indexOf(conceptUrl)] + "</div>");
					}
					else if (mappedPathFields != undefined && mappedPathFields.indexOf(conceptUrl) > -1){
						$(itemDiv).addClass("mappedInConfigPathPart");
					}	
				}
				return TreeElementsMarker;
			},
			setFields: function(me, mpf, md)
			{
				mappedElements = me;
				mappedPathFields = mpf;
				mappingDescriptions = md;
				return TreeElementsMarker;
			}
		}		
	}());
	
	var scrollToTreeItem = function(treeItemDiv)
	{
		$("#conceptTree").animate({
			scrollTop: $("#conceptTree").scrollTop() + treeItemDiv.offset().top - 150
		},200);
	}
	
	var unmarkTreeItems = function(excludeConceptUrl)
	{
		$("div.currentDetailsSource[rdf-iri!='"+excludeConceptUrl+"']").removeClass("currentDetailsSource");
	}
	
	return {
		init: init,
		openSelectMark: openSelectMark,
		collapseAll: collapseAll,
		TreeElementsMarker: TreeElementsMarker
	};
}());

$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});


$(document).on("tree:treeItemCreated", function(e, itemDiv){
	TreeManager.TreeElementsMarker.mark(itemDiv);
});