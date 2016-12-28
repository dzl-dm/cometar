var TreeManager = (function(){	
	var properties = { };
	
	var load = function()
	{
		createTopTreeItems(properties.treeContainer);
		return this;
	}
	
	var init = function(c)
	{
		properties.treeContainer = c;
		return this;
	}
	
	var createTopTreeItems = function(container)
	{
		var queryString = QueryManager.queries.getTopConcepts;
		QueryManager.query(queryString, function(queryResultItem){
			putTreeItem(queryResultItem, container);
		});
	}
	
	var fillWithSubConcepts = function(treeItemDiv)
	{
		var queryString = QueryManager.queries.getSubConcepts.replace(/PARENTCONCEPT/g, treeItemDiv.attr("data-concepturl"));
		QueryManager.query(queryString, function(queryResultItem){
			putTreeItem(queryResultItem, treeItemDiv);
		});
	}
	
	//checks weather there already exists a corresponding div (same data-concepturl)
	var putTreeItem = function(queryResultItem, treeItemDiv)
	{
		var conceptURL = queryResultItem["concept"].value;
		if (!treeItemDiv.children("div[data-concepturl='"+conceptURL+"']").length) 
		{
			createTreeItem(queryResultItem, treeItemDiv);
		}
	}
	
	//creates a new tree Item, is expandable by subscribeCreateTreeItem
		// createTreeItem({
			// concept: { value: "test" },
			// label: { value: "test" }
		// }, $("#conceptTree").append($("<div>")));
	var createTreeItem = function(queryResultItem, treeItemDiv)
	{
		var ti = new treeItem().load(queryResultItem);
		treeItemDiv.append(ti.getItemDiv());
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
	
	return {
		load: load,
		init: init,
		createTopTreeItems: createTopTreeItems,
		fillWithSubConcepts: fillWithSubConcepts,
		subscribeCreateTreeItem: subscribeCreateTreeItem
	};
}());

var treeItem = function(){
	var treeItemDiv;
	
	var createRoot = function(container)
	{
		treeItemDiv = container;
		return this;
	}
	
	var load = function(queryResultItem)
	{
		var conceptURL = queryResultItem["concept"].value;
		treeItemDiv = $("<div>");
		treeItemDiv.attr("data-concepturl", conceptURL)
			.data("treeobject", this)
			.addClass("treeItem")
			.click(function(e){
				e.stopPropagation();
				if (treeItemDiv.hasClass("expandable")) expandOrCollapse();
			});
		if (queryResultItem["subconcept"] != undefined)
		{
			treeItemDiv.addClass("expandable").addClass("collapsed");
		}
		var labelSpan = $("<span>");
		labelSpan.append(queryResultItem["label"].value);
		treeItemDiv.append(labelSpan);
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
	
	return {
		load:load,
		getItemDiv: getItemDiv
	};
}