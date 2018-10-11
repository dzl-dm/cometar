var ModuleManager = (function(){
	var tabs = [];
	
	var register = function(module)
	{
		var tab = getTab(module.tabName);
		if (!tab) 
		{
			tab = {
				tabName: module.tabName,
				clickFunctions: []
			}
			tabs.push(tab);
		}
		if (module.handlerFunction) tab.clickFunctions.push(module.handlerFunction);
	}
	
	var getTab = function(tabName)
	{
		for (var i = 0; i < tabs.length; i++)
		{
			if (tabs[i]["tabName"] == tabName)
				return tabs[i];
		}
		return undefined;
	}
	
	var getTabDiv = function(tabName)
	{
		return $("div.modulesMenuItem[tabId='tab-"+tabName+"']");
	}
	
	//test-function
	var showTabs = function()
	{
		$.each(tabs, function(i, tab)
		{
			console.log("Name: "+tab.tabName+"; functions: "+tab.clickFunctions);
		});
	}
	
	var render = function()
	{
		//$("#modules").css("maxHeight", conf.container.height()+"px");
		var menu = $("#modulesMenu");
		var contents = $("#modulesContents");
		menu.html("");
		/*var totalWidth = menu.innerWidth();*/
		var tabCount = tabs.length;
		var borderWidth = 2;
		/*var tabWidth = (totalWidth - borderWidth*(tabCount-1)) / tabCount;*/
		for (var i = 0; i < tabs.length; i++)
		{
			var tabDiv = renderTab(tabs[i], tabCount, borderWidth, i == tabs.length-1);
			bindClickEvents(tabDiv);
			var contentDiv = renderContent(tabs[i]);
			menu.append(tabDiv);
			contents.append(contentDiv);
		}
		//$(".moduleContentDiv").css("maxHeight", (conf.container.height()- $("#modulesMenu").height() - 22)+"px");
	}
	
	var renderTab = function(tab, tabCount, borderWidth, last)
	{
		var tabDiv = $("<div>");
		tabDiv.html(tab.tabName)
			.addClass("modulesMenuItem")
			.attr("tabId", "tab-"+tab.tabName)
			.data("tab", tab);
			//.css("width", 100/tabCount+"%");
		//if (!last) tabDiv.css("borderRightWidth", borderWidth+"px");
		return tabDiv;
	}
	
	//every function a module has registered for the corresponding tab will be called
	//with the concept rdf url as parameter
	var bindClickEvents = function(tabDiv)
	{
		tabDiv.click(function(){
			var clickedTab = $(this).data("tab");
			var contentDiv = $("div[contentId='content-"+clickedTab.tabName+"']");
			contentDiv.html("");
			$.each(clickedTab.clickFunctions, function(j, f)
			{
				var content = f(Helper.getCurrentConceptUrl());
				contentDiv.append(content);
			});
			$(".activeModuleContentDiv").removeClass("activeModuleContentDiv");
			contentDiv.addClass("activeModuleContentDiv");
			$("#modulesMenu .activeMenuItemDiv").removeClass("activeMenuItemDiv");
			$(this).addClass("activeMenuItemDiv");
		});
	}
	
	var renderContent = function(tab)
	{
		var contentDiv = $("<div>");
		contentDiv.addClass("moduleContentDiv")
			.attr("contentId", "content-"+tab.tabName);
		return contentDiv;
	}
	
	var showTab = function(tabName)
	{
		getTabDiv(tabName).click();
	}
	
	var hideMenu = function()
	{
		$(".modulesMenuItem, #modulesMenu").css("height","0px");
	}
	
	var init = function(){	
		console.log("ModuleManager.init");
		//register([{ tabName: "details" }]);
		/*$(document).on("tree:treeItemClicked", function(){
			ModuleManager.showTab.call(ModuleManager, "details");
		});*/
	};
	
	return {
		init: init,
		register: register,
		render: render,
		showTab: showTab,
		refreshTab: showTab,
		hideMenu: hideMenu
	}
}());