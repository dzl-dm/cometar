$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "details",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>");
				
				var restInfoDiv = $("<div id='restInfoDiv'>").css("display","block");
				resultDiv.append(restInfoDiv);
				var aggregatedInfoDiv = $("<div id='aggregatedInfoDiv' class='infoDiv'>").css("display","block");
				resultDiv.append(aggregatedInfoDiv);

				var treePathDiv = $("<div class='treePathDiv infoDiv'>");	
				Helper.getPathsByConceptUrl(conceptUrl, function(path){putPath(treePathDiv, path)});			
				treePathDiv.prepend("<h3>Pfad / Path</h3>").css("display","block");
				restInfoDiv.append(treePathDiv);
				
				var infoDivLabel = $("<div class='aggregatedInfo'><h3>Bezeichnung / Label</h3></div>");
				aggregatedInfoDiv.append(infoDivLabel); 	
				QueryManager.getProperty(conceptUrl, "skos:prefLabel", function(i){
					infoDivLabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").addClass("filled"); 
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
					infoDivNotation.append(dt + (dt != ""?": ":"") + i.value + "<br/>").addClass("filled"); 
				});
				var infoDivDescription = $("<div class='infoDiv'><h3>Beschreibung / Description</h3></div>");	
				restInfoDiv.append(infoDivDescription); 
				QueryManager.getProperty(conceptUrl, "dc:description", function(i){
					infoDivDescription.append((i["xml:lang"] != undefined?i["xml:lang"].toUpperCase() + ": ":"") + i.value + "<br/>").show(); 
				});
				var infoDivUnit = $("<div class='aggregatedInfo'><h3>Einheit / Unit</h3></div>");	
				aggregatedInfoDiv.append(infoDivUnit); 
				QueryManager.getProperty(conceptUrl, ":unit", function(i){
					infoDivUnit.append(i.value + "<br/>").addClass("filled"); 
				});
				var infoDivAltlabel = $("<div class='aggregatedInfo'><h3>Alternative Bezeichnung / Label</h3></div>");	
				aggregatedInfoDiv.append(infoDivAltlabel); 
				QueryManager.getProperty(conceptUrl, "skos:altLabel", function(i){
					infoDivAltlabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").addClass("filled"); 
				});
				var infoDivStatus = $("<div class='aggregatedInfo'><h3>Status</h3></div>");
				aggregatedInfoDiv.append(infoDivStatus); 
				QueryManager.getProperty(conceptUrl, ":status", function(i){
					infoDivStatus.append(i.value + "<br/>").addClass("filled");  
				});
				var infoDivAuthor = $("<div class='aggregatedInfo'><h3>Author</h3></div>");
				aggregatedInfoDiv.append(infoDivAuthor); 
				QueryManager.getProperty(conceptUrl, "dc:creator", function(i){
					infoDivAuthor.append(i.value + "<br/>").addClass("filled"); 
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
					infoDivDomain.append(restriction + "<br/>").addClass("filled"); 
				});
				
				var infoDivEditNotes = $("<div class='infoDiv'><h3>Editorial Notes</h3></div>");
				restInfoDiv.append(infoDivEditNotes); 
				QueryManager.getProperty(conceptUrl, "skos:editorialNote", function(i){
					infoDivEditNotes.append(i.value + "<br/>").show(); 
				});
				
				var infoDivChanges = $("<div class='infoDiv'><h3>Änderungen / Change Log</h3></div>");	
				restInfoDiv.append(infoDivChanges); 
				var date="";
				var dateDiv;
				var changesDiv;
				QueryManager.getNotes(conceptUrl, function(i){						
					if (i["property"].value == "http://www.w3.org/2004/02/skos/core#topConceptOf"
						|| i["property"].value == "http://www.w3.org/2004/02/skos/core#inScheme"
						|| i["property"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf"
						|| i["property"].value == "http://www.w3.org/2004/02/skos/core#hasTopConcept"
						|| i["property"].value == "http://www.w3.org/2004/02/skos/core#editorialNote"
						|| i["property"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
					{
						return;
					}
					var lang="";
					if (i["minuslang"] != undefined && i["pluslang"] == undefined && i["minuslang"].value != "") lang = "(" + i["minuslang"].value + ") ";
					else if (i["pluslang"] != undefined && i["minuslang"] == undefined && i["pluslang"].value != "") lang = "(" + i["pluslang"].value + ") ";
					else if (i["minuslang"] != undefined && i["pluslang"] != undefined && i["minuslang"].value == i["pluslang"].value && i["minuslang"].value != "") lang = "(" + i["minuslang"].value + ") ";

					date = i["date"].value.substr(0,10);
					if ($(".dateDiv:contains("+date+")").length > 0)
					{
						changesDiv = $(".dateDiv:contains("+date+")").next();
					}
					else
					{
						dateDiv = $("<div style='display:inline-block;vertical-align:top;width:100px' class='dateDiv'>"+ date + "</div>");
						changesDiv = $("<div style='display:inline-block;margin-left:10px; width:calc(100% - 110px)'>");
						infoDivChanges.append(dateDiv).append(changesDiv).append("<br/><br/>").show();
					}
					if (i["note"].type == "bnode")
					{
						var changeValue = "";
						var changeReason = "";
						if (i["value"].type == "bnode") {
							if (i["plustargetlabel"] != undefined) changeValue += "<font color='green'>&oplus;"+i["plustargetlabel"].value+"</font><br/>" ;					
							else if (i["plus"] != undefined) changeValue += "<font color='green'>&oplus;"+Helper.getReadableString(i["plus"].value)+"</font><br/>" ;	
							if (i["minustargetlabel"] != undefined) changeValue += "<font color='red'>&ominus;"+i["minustargetlabel"].value+"</font><br/>" ;
							else if (i["minus"] != undefined) changeValue += "<font color='red'>&ominus;"+Helper.getReadableString(i["minus"].value)+"</font><br/>" ;						
							if (i["reason"] != undefined) changeReason = ": <i>&quot;" + i["reason"].value + "&quot;</i>";						
						}
						else {
							changeValue = i["value"].value;
						}
						var property = Helper.getReadableString(i["property"].value) + lang;
						if (changesDiv.text().indexOf(property + " by " + i["author"].value) == -1 && changeReason == "")
						{
							if (changesDiv.text().length > 0) changesDiv.append("<br/>");
							changesDiv.append(property + /*" " + i["action"].value +*/ " by " + i["author"].value + changeReason +"<br/>");
						}
						changesDiv.append(changeValue);
					}
					else changesDiv.append(i["note"].value);
				});
					
				var modifierDiv = $("<div class='treePathDiv infoDiv' id='modifierInfoDiv'><h3>Spezifizierung / Specification</h3></div>");
				restInfoDiv.append(modifierDiv);
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