ModuleManager.register([
	{
		tabName: "details",
		handlerFunction: function(conceptUrl){
			var resultDiv = $("<div>");

			var treePathDiv = $("<div class='treePathDiv'>");			
			Helper.getPathsByConceptUrl(conceptUrl, function(paths){putPaths(treePathDiv, paths)});			
			resultDiv.append("<h3>path</h3>");
			resultDiv.append(treePathDiv);
			
			for (var i in itemsToShow)
			{
				var itemToShow = itemsToShow[i];
				var itemDiv = $("<div id='info"+itemToShow+"'>");
				resultDiv.append(itemDiv);
			}			
			var queryString = QueryManager.queries.getConceptInfos.replace(/CONCEPT/g, conceptUrl);
			QueryManager.query(queryString, function(resultItem){
				putInfo(resultDiv, resultItem);
			});
			
			var listOfModifiers = [];
			var queryString = QueryManager.queries.getAllModifiers.replace(/PARENTCONCEPT/g, conceptUrl);
			QueryManager.query(queryString, function(resultItem){
				if (listOfModifiers.indexOf(resultItem["concept"].value) == -1) 
					listOfModifiers.push(resultItem["concept"].value);
				if (resultItem["subconcept"] != undefined && listOfModifiers.indexOf(resultItem["subconcept"].value) == -1) 
					listOfModifiers.push(resultItem["subconcept"].value);
			});
			if (listOfModifiers.length > 0)
			{	
				resultDiv.append("<h3>modifier</h3>");			
				var modifier = $("<div class='treePathDiv'>");
				for (var i = 0; i < listOfModifiers.length; i++)
					Helper.getPathsByConceptUrl(listOfModifiers[i], function(paths){putPaths(modifier, paths)});
				resultDiv.append(modifier);
			}
			
			return resultDiv;
		}
	}
]);

var itemsToShow = [ "label", "notation", "description", "unit" ];

var putInfo = function(resultDiv, resultItem)
{
	for (var i in itemsToShow)
	{
		var itemToShow = itemsToShow[i];
		if (resultItem[itemToShow]) 
		{
			if (resultDiv.html().indexOf("<h3>"+itemToShow+"</h3>") == -1)
				resultDiv.children("#info"+itemToShow).before("<h3>"+itemToShow+"</h3>");	
			if (itemToShow == "label") 
				appendInfo(resultDiv.children("#info"+itemToShow), resultItem["lang"].value.toUpperCase() + ": " + resultItem["label"].value);
			else appendInfo(resultDiv.children("#info"+itemToShow), resultItem[itemToShow].value);
		}
	}
}

var appendInfo = function(div, value)
{
	if (div.html().indexOf(value) == -1)
	{
		if (div.html() == "") div.html(value);
		else div.html(div.html() + "<br/>" + value);		
	}
}

var putPaths = function(treePathDiv, paths)
{
	for (var i = 0; i < paths.length; i++)
	{
		var headPathDiv = $("<div class='headPathDiv'>");
		headPathDiv.html(paths[i][1].join(" / "));
		headPathDiv.data("path", paths[i][0]);
		headPathDiv.click(function(){
			TreeManager.openPaths([$(this).data("path")]);
		});
		treePathDiv.append(headPathDiv);
	};	
}