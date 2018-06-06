$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "details",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>");

				var treePathDiv = $("<div class='treePathDiv'>");	
				Helper.getPathsByConceptUrl(conceptUrl, function(path){putPath(treePathDiv, path)});			
				resultDiv.append("<h3>Pfad / Path</h3>");
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
				
				var modifierHeading = $("<h3>Spezifizierung / Specification</h3>");
				var modifierDiv = $("<div class='treePathDiv' id='modifierInfoDiv'>");				
				var queryString = QueryManager.queries.getAllModifiers.replace(/PARENTCONCEPT/g, conceptUrl);
				QueryManager.query(queryString, 
					function(resultItem){
						if (resultDiv.children("#modifierInfoDiv").length == 0)
						{
							resultDiv.append(modifierHeading);	
							resultDiv.append(modifierDiv);							
						}
						Helper.getPathsByConceptUrl(resultItem["subconcept"].value, function(path){putPath(modifierDiv, path)});
					},
					function(){
					}
				);
				
				return resultDiv;
			}
		}
	]);	

	var itemsToShow = [ "label", "notation", "description", "unit", "altlabel", "status", "creator", "domain" ];
	var itemsToShowHeadings = [ "Bezeichnung / Label", "Notation / Code", "Beschreibung / Description", "Einheit / Unit", "Alternative Bezeichnung / Label", "Status", "Author", "Value Domain" ]

	var putInfo = function(resultDiv, resultItem)
	{
		for (var i in itemsToShow)
		{
			var itemToShow = itemsToShow[i];
			var itemsToShowHeading = itemsToShowHeadings[i];
			if (resultItem[itemToShow]) 
			{
				if (resultDiv.html().indexOf("<h3>"+itemsToShowHeading+"</h3>") == -1)
					resultDiv.children("#info"+itemToShow).before("<h3>"+itemsToShowHeading+"</h3>");	
				if (itemToShow == "label") 
					appendInfo(resultDiv.children("#info"+itemToShow), resultItem["lang"].value.toUpperCase() + ": " + resultItem["label"].value);
				else if (itemToShow == "altlabel") 
					appendInfo(resultDiv.children("#info"+itemToShow), resultItem["altlang"].value.toUpperCase() + ": " + resultItem["altlabel"].value);
				else if (itemToShow == "domain") 
				{
					var restriction = "";
					switch(resultItem["domain"].value.split("#")[1]) {
						case "integerRestriction":
							restriction = "Integer";
							break;
						case "stringRestriction":
							restriction = "Integer";
							break;
						case "floatRestriction":
							restriction = "Integer";
							break;
						case "partialDateRestriction":
							restriction = "Integer";
							break;
						case "dateRestriction":
							restriction = "Integer";
							break;
						default:
							break;
					} 
					appendInfo(resultDiv.children("#info"+itemToShow), restriction);
				}
				else 
					appendInfo(resultDiv.children("#info"+itemToShow), resultItem[itemToShow].value);
			}
		}
	}

	var appendInfo = function(div, value)
	{
		//first evaluating special characters
		var value = $("<div>").html(value).text();
		if (div.text().indexOf(value) == -1)
		{
			if (div.html() == "") div.html(value);
			else div.html(div.html() + "<br/>" + value);		
		}
	}

	var putPath = function(div, path)
	{
		var headPathDiv = $("<div class='headPathDiv'>");
		headPathDiv.html(path[1].join(" / "));
		headPathDiv.data("path", path[0]);
		headPathDiv.click(function(){
			$(".treeMenuItem[target='conceptTree']").click();
			TreeManager.openPath($.merge([],$(this).data("path")), true);
		});
		//"insertion sorting"
		var pathCount = div.children(".headPathDiv").length;
		for (var i = 0; i < pathCount; i++)
		{
			existingHPD = div.children(".headPathDiv")[i];
			if (headPathDiv.html() < $(existingHPD).html())
			{
				$(existingHPD).before(headPathDiv);
				return;
			}
		}
		div.append(headPathDiv);
	}
});