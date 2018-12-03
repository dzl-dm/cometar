var CB = (function(){	
	var init = function(container){
		container
			.addClass("cometarContainer")
			.html(html);
		loadTooltipFunctionality(container);
		$(window).bind( 'hashchange', function(e) {
			var conceptIri = Helper.getCurrentConceptIri();
			TreeManager.openSelectMark({
				IRIs: [conceptIri],
				closeFalsePathsBeforeOpening: true,
				oneSelectedIri: true,
				keepDescriptions: true,
				openPaths: true
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
	
	var showCurrentConceptInTree = function(){
		if (location.hash != "")
		{
			var conceptIri = Helper.getCurrentConceptIri();
			TreeManager.openSelectMark({
				IRIs: [conceptIri],
				closeFalsePathsBeforeOpening: true,
				oneSelectedIri: true,
				keepDescriptions: true,
				openPaths: true
			});
		}
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
		showCurrentConceptInTree: showCurrentConceptInTree
	}
}());

$.fn.ontologieManager = function() {
	CB.init($(this));
	CB.loadModules();
	CB.loadQueries()
		.then(function(){
			CB.loadTree()
			.then(function(){		
				CB.showCurrentConceptInTree();
			});
			ModuleManager.showTab("details");
		})
		.then(function(){
			testfunction()
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
		var loadingStatus = $.Deferred();
		var init = function(elementiri, parentDiv) {
			iri = elementiri;
			treeItemDiv = $("<div>")
				.attr("rdf-iri", iri)
				.addClass("treeItem")
				.data("treeobject", this)
				.click(function(e){
					e.stopPropagation();
					Helper.setCurrentConceptIri(iri);
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
			
			treeItemDiv.show(100);
			
			$.when(
				QueryManager.getProperty(elementiri, "skos:prefLabel", "lang(?result) = 'en'", function(r){
					setTitle(r.value);
				}),
				QueryManager.getMultiProperties(elementiri, [ "skos:narrower", "rdf:hasPart", "skos:member" ], function(r){
					setHasChildren();
				}),
				QueryManager.getProperty(elementiri, "rdf:partOf", function(r){
					setIsModifier();
				}),
				QueryManager.getProperty(elementiri, "rdf:type", function(r){
					if (r.value == "http://www.w3.org/2004/02/skos/core#Collection") setIsCollection();
				}),
				QueryManager.getProperty(elementiri, ":status", function(r){
					setStatus(r.value);
				})
			).then(loadingStatus.resolve);
			loadingStatus.promise();
			
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
				treeItemDiv.children("div.treeItem").hide(100,function(){this.remove()});
				//treeItemDiv.children("div.treeItem").remove();
			}
		}
		
		var setTitle = function(label)
		{
			treeItemDiv.children(".treeItemTitleDiv").prepend($("<div class='treeItemTitle'>"+label+"</div>"));				
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
			var div = $("<div class='treeItemStatusDiv "+stat+"'>"+stat+"</div>");
			if (treeItemDiv.children(".treeItemTitleDiv").children(".treeItemTitle").length > 0)
				treeItemDiv.children(".treeItemTitleDiv").children(".treeItemTitle").after(div);
			else treeItemDiv.children(".treeItemTitleDiv").prepend(div);
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
			loadingStatus: loadingStatus
			// setHasChildren: setHasChildren,
			// setIsModifier: setIsModifier,
			// setStatus: setStatus,
			// setIsCollection: setIsCollection
		};
	};
	var adjustFixedTitles = function(){
		$(".treeItemTitle.fixed")
			.removeClass("fixed")
			//.css("marginTop","2px")
			.css("marginBottom","0px");
		/* the path of selected element 
		var ti = $(".treeItem.currentDetailsSource"); */
		/* the path of toppest element */
		//$("#testdiv1").remove();
		//$("#testdiv2").remove();
		//$("body").append("<div id='testdiv1' style='position:fixed; height:1px; width:300px; background-color: red !important;'></div>");
		//$("body").append("<div id='testdiv2' style='position:fixed; height:1px; width:300px; background-color: red !important;'></div>");
		var getsubtoppest = function(parentTreeItem, reservedspace){
			var ti;
			//$("#testdiv1").css("top",$("#conceptTree").offset().top+reservedspace+"px");
			//$("#testdiv2").css("top",parentTreeItem.offset().top + parentTreeItem.outerHeight()+"px");
			while (!ti || ti.next(".treeItem").length>0){
				ti = ti?ti.next(".treeItem"):parentTreeItem.children(".treeItem").first();
				if (ti
					&& (parentTreeItem.offset().top + parentTreeItem.outerHeight() > $("#conceptTree").offset().top+reservedspace)
					&& (ti.next(".treeItem").length == 0 
						|| ti.next(".treeItem").offset().top-$("#conceptTree").offset().top >= reservedspace))
				{
					if (ti.children(".treeItem").length == 0) return ti;
					else {
						titemp = getsubtoppest(ti,reservedspace+ti.children(".treeItemTitleDiv").children(".treeItemTitle").outerHeight()+15);
						return titemp || ti;
					}
				}
			}
		}
		var ti = getsubtoppest($("#conceptTree"),-2);
		ti = ti.parent(".treeItem");
		if (ti.length == 0) return;
		var pathtitledivs = [];	
		while (ti[0]) {
			pathtitledivs.push(ti.children(".treeItemTitleDiv"));
			ti = ti.parent(".treeItem");
		}
		var lasttop = $("#conceptTree").offset().top+1;
		for (var i = pathtitledivs.length-1; i >= 0; i--){
			//$("#testdiv1").css("top",lasttop+"px");
			var titop = pathtitledivs[i].parent().offset().top;
			var diff = lasttop-titop;
			if (diff > 0) {
				pathtitledivs[i]
					.children(".treeItemTitle")
					.addClass("fixed")
					//.css("width",$("#conceptTree").width()-pathtitledivs[i].offset().left-15)
					.css("width",pathtitledivs[i].parent().width()-pathtitledivs[i].prev().width()+2)
					.css("top",lasttop+"px");
					//.css("marginTop",(diff-9)+"px");
				lasttop+=pathtitledivs[i].children(".treeItemTitle").outerHeight();
			//$("#testdiv2").css("top",lasttop+pathtitledivs[i].children(".treeItemTitle").outerHeight()+"px");
			}
		}
	}
	var init = function()
	{
		var adjustFixedTitlesTimeout;
		var observer = new MutationObserver(function(mutations) {
			adjustFixedTitles();
		});			
		observer.observe($("#conceptTree")[0], { 
			childList: true,
			subtree: true
		});
		$("#conceptTree").scroll(function(){
			adjustFixedTitles();
			//clearTimeout(adjustFixedTitlesTimeout);
			//adjustFixedTitlesTimeout = setTimeout(adjustFixedTitles,20);
		});
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
		return ti.loadingStatus;		
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
		var conceptIri = queryResultItem["concept"].value;
		var textDiv = $("#searchResultDiv div[rdf-iri='"+conceptIri+"']");
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
		if (queryResultItem["oldnotation"] && queryResultItem["oldnotation"].value.toUpperCase().indexOf(pattern.toUpperCase()) > -1) 
		{
			var appendString = queryResultItem["oldnotation"].value;
			appendSearchMatchInfo(textDiv, "Old Notation", appendString);			
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
		var doAppend = true;
		div.children(".treeItemInfoDiv").each(function(){
			$(this).children(".treeItemInfoTextDiv").each(function(){
				if ($(this).text() == appendString) doAppend = false;
			});
		});
		if (doAppend)
			div.append("<div class='treeItemInfoDiv'><div class='treeItemInfoTypeDiv'>"+type+": </div><div class='treeItemInfoTextDiv'>"+appendString+"</div></div>");
	}
	
	var markSearchMatches = function(pattern)
	{
		// $("#searchResultDiv .treeItemTitleDiv:contains('"+pattern+"'), #searchResultDiv .treeItemInfoDiv:contains('"+pattern+"')").each(function(){
			// var re = new RegExp("("+pattern+")","gi");
			// var infoTypeDiv = $(this).children(".treeItemInfoTypeDiv").remove()[0];
			// var newHtml = "";
			// if (infoTypeDiv != undefined) newHtml += infoTypeDiv.outerHTML;
			// newHtml += $(this).html().replace(re,"<span class='searchHighlight'>$1</span>");
			// $(this).html(newHtml);
		// });
		$("#searchResultDiv .treeItem").each(function(){
			$(this).data("treeobject").loadingStatus.then(function(){
				$("#searchResultDiv .treeItemTitleDiv:contains('"+pattern+"'), #searchResultDiv .treeItemInfoTextDiv:contains('"+pattern+"')").each(function(){
					var re = new RegExp("("+pattern+")","gi");
					$(this).html($(this).text().replace(re,"<span class='searchHighlight'>$1</span>"));
				});
			});
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
		a.IRIs, a.dontUnmark, a.oneSelectedIri, a.dontClosePaths, a.markMapping, a.descriptions, a.keepDescriptions, a.openPaths, a.growWidth
	*/
	var openSelectMark = function(a){
		if (!Array.isArray(a.IRIs)) a.IRIs=a.IRIs.split(";");
		if (a.IRIs.length==0||a.IRIs[0]==undefined) return;
		//before opening
		if (!a.dontUnmark) {
			$(".pathPart").removeClass("pathPart");
			$(".currentDetailsSource").removeClass("currentDetailsSource");
		}
		if (!a.keepDescriptions){
			$(".treeDescriptionDiv").remove();			
		}
		if (a.oneSelectedIri) markItemAsSelected(a.IRIs[0]);
		if (a.growWidth) $("#conceptTreeContainer").animate({
			width: "50%"
		}, 500);
		
		//opening
		var pathParts = [];
		QueryManager.getPathPartsOfMultipleElements(a.IRIs, function(iri){
			pathParts.push(iri);
		}).done(function(){
			if (!a.dontClosePaths) closeFalsePaths(pathParts);
			if (a.openPaths){
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
					expandNextItem();
				};
				expandNextItem();
			}
			else {
				afterOpening(a,pathParts);
			}
		});			
	}		
	var afterOpening = function(a, pathParts){
		if (a.oneSelectedIri) {
			getItem(a.IRIs[0]).expand();
			markItemAsSelected(a.IRIs[0]);
		}
		if (a.markMapping) {
			TreeElementsMarker.setFields(a.IRIs, pathParts, a.descriptions);
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
					var conceptIri = $(itemDiv).attr("rdf-iri");
					var elementMappingIndexes = [];
					for (var i = 0; i < mappedElements.length; i++){
						if (mappedElements[i]==conceptIri){
							$(itemDiv).addClass("mappedInConfig");
							if (mappingDescriptions != undefined) $(itemDiv).children(".treeItemTitleDiv").append($("<div class='treeDescriptionDiv'>").append(mappingDescriptions[i]));					
						}
					}
					if (mappedPathFields != undefined && mappedPathFields.indexOf(conceptIri) > -1){
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
	
	var unmarkTreeItems = function(excludeConceptIri)
	{
		$("div.currentDetailsSource[rdf-iri!='"+excludeConceptIri+"']").removeClass("currentDetailsSource");
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