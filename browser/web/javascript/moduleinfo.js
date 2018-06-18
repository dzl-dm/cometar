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

				var infoDivLabel = $("<div class='infoDiv'><h3>Bezeichnung / Label</h3></div>");
				resultDiv.append(infoDivLabel); 	
				QueryManager.getProperty(conceptUrl, "skos:prefLabel", function(i){
					infoDivLabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").show(); 
				});
				
				var infoDivNotation = $("<div class='infoDiv'><h3>Notation / Code</h3></div>");	
				resultDiv.append(infoDivNotation); 
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
					infoDivDescription.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").show(); 
				});
				var infoDivUnit = $("<div class='infoDiv'><h3>Einheit / Unit</h3></div>");	
				resultDiv.append(infoDivUnit); 
				QueryManager.getProperty(conceptUrl, ":unit", function(i){
					infoDivUnit.append(i.value + "<br/>").show(); 
				});
				var infoDivAltlabel = $("<div class='infoDiv'><h3>Alternative Bezeichnung / Label</h3></div>");	
				resultDiv.append(infoDivAltlabel); 
				QueryManager.getProperty(conceptUrl, "skos:altLabel", function(i){
					infoDivAltlabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").show(); 
				});
				var infoDivStatus = $("<div class='infoDiv'><h3>Status</h3></div>");
				resultDiv.append(infoDivStatus); 
				QueryManager.getProperty(conceptUrl, ":status", function(i){
					infoDivStatus.append(i.value + "<br/>").show(); 
				});
				var infoDivAuthor = $("<div class='infoDiv'><h3>Author</h3></div>");
				resultDiv.append(infoDivAuthor); 
				QueryManager.getProperty(conceptUrl, "dc:creator", function(i){
					infoDivAuthor.append(i.value + "<br/>"); 
				});
				var infoDivDomain = $("<div class='infoDiv'><h3>Wertebereich / Domain</h3></div>");
				resultDiv.append(infoDivDomain); 	
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
				QueryManager.getNotes(conceptUrl, function(i){
					var changeValue = "";
					var changeReason = "";
					if (i["value"].type == "bnode") {
						if (i["minus"] != undefined) changeValue += "<font color='red'>&ominus;"+i["minus"].value+"</font> " ;						
						if (i["plus"] != undefined) changeValue += "<font color='green'>&oplus;"+i["plus"].value+"</font> " ;						
						if (i["reason"] != undefined) changeReason = ": <i>&quot;" + i["reason"].value + "&quot;</i>";						
					}
					else {
						changeValue = i["value"].value;
					}
					infoDivChanges.append("<div style='display:inline-block;vertical-align:top'>"+i["date"].value + ":</div><div style='display:inline-block;margin-left:10px'>" + Helper.getReadableString(i["property"].value) + " " + i["action"].value + " by " + i["author"].value + changeReason + "<br/>" + " " + changeValue + "</div><br/>").show(); 
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