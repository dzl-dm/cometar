$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "details",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>");

				var aggregatedInfoDiv = $("<div id='aggregatedInfoDiv' class='infoDiv'>").css("display","block");
				resultDiv.append(aggregatedInfoDiv);

				var treePathDiv = $("<div class='treePathDiv infoDiv'>");	
				Helper.getPathsByConceptUrl(conceptUrl, function(path){putPath(treePathDiv, path)});			
				treePathDiv.prepend("<h3>Pfad / Path</h3>").css("display","block");
				resultDiv.append(treePathDiv);
				
				var infoDivLabel = $("<div class='aggregatedInfo'><h3>Bezeichnung / Label</h3></div>");
				aggregatedInfoDiv.append(infoDivLabel); 	
				QueryManager.getProperty(conceptUrl, "skos:prefLabel", function(i){
					infoDivLabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").show(); 
				});
				
				var infoDivNotation = $("<div class='aggregatedInfo'><h3>Notation / Code</h3></div>");	
				aggregatedInfoDiv.append(infoDivNotation); 
				QueryManager.getProperty(conceptUrl, "skos:notation", function(i){
					var dt = ""
					switch(i["datatype"]) {
						case "http://sekmi.de/histream/dwh#loinc":
							dt = "LOINC";
							break;
						case "http://sekmi.de/histream/dwh#snomed":
							dt = "SNOMED";
							break;
						default:
							break;
					} 
					infoDivNotation.append(dt + (dt != ""?": ":"") + i.value + "<br/>").show(); 
				});
				var infoDivDescription = $("<div class='infoDiv'><h3>Beschreibung / Description</h3></div>");	
				resultDiv.append(infoDivDescription); 
				QueryManager.getProperty(conceptUrl, "dc:description", function(i){
					infoDivDescription.append((i["xml:lang"] != undefined?i["xml:lang"].toUpperCase() + ": ":"") + i.value + "<br/>").show(); 
				});
				var infoDivUnit = $("<div class='aggregatedInfo'><h3>Einheit / Unit</h3></div>");	
				aggregatedInfoDiv.append(infoDivUnit); 
				QueryManager.getProperty(conceptUrl, ":unit", function(i){
					infoDivUnit.append(i.value + "<br/>").show(); 
				});
				var infoDivAltlabel = $("<div class='aggregatedInfo'><h3>Alternative Bezeichnung / Label</h3></div>");	
				aggregatedInfoDiv.append(infoDivAltlabel); 
				QueryManager.getProperty(conceptUrl, "skos:altLabel", function(i){
					infoDivAltlabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").show(); 
				});
				var infoDivStatus = $("<div class='aggregatedInfo'><h3>Status</h3></div>");
				aggregatedInfoDiv.append(infoDivStatus); 
				QueryManager.getProperty(conceptUrl, ":status", function(i){
					infoDivStatus.append(i.value + "<br/>").show(); 
				});
				var infoDivAuthor = $("<div class='aggregatedInfo'><h3>Author</h3></div>");
				aggregatedInfoDiv.append(infoDivAuthor); 
				QueryManager.getProperty(conceptUrl, "dc:creator", function(i){
					infoDivAuthor.append(i.value + "<br/>"); 
				});
				var infoDivDomain = $("<div class='aggregatedInfo'><h3>Wertebereich / Domain</h3></div>");
				aggregatedInfoDiv.append(infoDivDomain); 	
				QueryManager.getProperty(conceptUrl, "dwh:restriction", function(i){
					var restriction = "";
					switch(i.value.split("#")[1]) {
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
					infoDivDomain.append(restriction + "<br/>").show(); 
				});
				
				var infoDivChanges = $("<div class='infoDiv'><h3>Änderungen / Change Log</h3></div>");	
				resultDiv.append(infoDivChanges); 
				var date="";
				var dateDiv;
				var changesDiv;
				QueryManager.getNotes(conceptUrl, function(i){	
					var lang="";
					if (i["minuslang"] != undefined && i["pluslang"] == undefined && i["minuslang"].value != "") lang = "(" + i["minuslang"].value + ") ";
					else if (i["pluslang"] != undefined && i["minuslang"] == undefined && i["pluslang"].value != "") lang = "(" + i["pluslang"].value + ") ";
					else if (i["minuslang"] != undefined && i["pluslang"] != undefined && i["minuslang"].value == i["pluslang"].value && i["minuslang"].value != "") lang = "(" + i["minuslang"].value + ") ";
					if (i["date"].value.substr(0,10) != date) 
					{
						if (dateDiv != undefined && changesDiv.html()!="")
						{
							infoDivChanges.append(dateDiv).append(changesDiv).append("<br/>");
						}
						date = i["date"].value.substr(0,10);
						dateDiv = $("<div style='display:inline-block;vertical-align:top;width:100px'>"+ date + ":</div>");
						changesDiv = $("<div style='display:inline-block;margin-left:10px; width:calc(100% - 110px)'>");
					}
					if (i["note"].type == "bnode")
					{
						if (i["property"].value == "http://www.w3.org/2004/02/skos/core#topConceptOf"
							|| i["property"].value == "http://www.w3.org/2004/02/skos/core#inScheme"
							|| i["property"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf"
							|| i["property"].value == "http://www.w3.org/2004/02/skos/core#hasTopConcept"
							|| i["property"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
						{
							return;
						}
						var changeValue = "";
						var changeReason = "";
						if (i["value"].type == "bnode") {
							if (i["minus"] != undefined) changeValue += "<font color='red'>&ominus;"+Helper.getReadableString(i["minus"].value)+"</font> " ;						
							if (i["plus"] != undefined) changeValue += "<font color='green'>&oplus;"+Helper.getReadableString(i["plus"].value)+"</font> " ;						
							if (i["reason"] != undefined) changeReason = ": <i>&quot;" + i["reason"].value + "&quot;</i>";						
						}
						else {
							changeValue = i["value"].value;
						}
						changesDiv.append(Helper.getReadableString(i["property"].value) + lang + " " + i["action"].value + " by " + i["author"].value + changeReason + "<br/>" + " " + changeValue);
					}
					else changesDiv.append(i["note"].value);
					changesDiv.append("<br/>"); 
				}, function(){	
					infoDivChanges.append(dateDiv).append(changesDiv).append("<br/>").show();
				});
					
				var modifierDiv = $("<div class='treePathDiv infoDiv' id='modifierInfoDiv'><h3>Spezifizierung / Specification</h3></div>");
				resultDiv.append(modifierDiv);
				QueryManager.getModifiers(conceptUrl, function(m){
					modifierDiv.show();
					Helper.getPathsByConceptUrl(m, function(path){putPath(modifierDiv, path)});
				});
				
				return resultDiv;
			}
		}
	]);	

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