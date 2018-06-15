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

				var infos = QueryManager.getProperties(conceptUrl, "skos:prefLabel");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Bezeichnung / Label</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, "skos:notation");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Notation / Code</h3></div>");	
					for (var i of infos) {
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
						infoDiv.append(dt + (dt != ""?": ":"") + i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, "dc:description");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Beschreibung / Description</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, ":unit");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Einheit / Unit</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, "skos:altLabel");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Alternative Bezeichnung / Label</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, ":status");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Status</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, "dc:creator");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Author</h3></div>");	
					for (var i of infos) {
						infoDiv.append(i.value + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getProperties(conceptUrl, "dwh:restriction");
				if (infos.length > 0){
					var infoDiv = $("<div><h3>Wertebereich / Domain</h3></div>");	
					for (var i of infos) {
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
						infoDiv.append(restriction + "<br/>"); 
						resultDiv.append(infoDiv); 
					}
				}
				var infos = QueryManager.getNote(conceptUrl);
				if (infos != undefined){
					var infoDiv = $("<div><h3>Änderungen / Change Log</h3></div>");	
					var changeValue = "";
					var changeReason = "";
					if (infos["value"].type == "bnode") {
						if (infos["minus"] != undefined) changeValue += "<font color='red'>&ominus;"+infos["minus"].value+"</font> " ;						
						if (infos["plus"] != undefined) changeValue += "<font color='green'>&oplus;"+infos["plus"].value+"</font> " ;						
						if (infos["reason"] != undefined) changeReason = ": <i>&quot;" + infos["reason"].value + "&quot;</i>";						
					}
					else {
						changeValue = infos["value"].value;
					}
					infoDiv.append("<div style='display:inline-block;vertical-align:top'>"+infos["date"].value + ":</div><div style='display:inline-block;margin-left:10px'>" + Helper.getReadableString(infos["property"].value) + " " + infos["action"].value + " by " + infos["author"].value + changeReason + "<br/>" + " " + changeValue + "</div><br/>"); 
					resultDiv.append(infoDiv); 
				}		
					
				var modifiers = QueryManager.getModifiers(conceptUrl);
				if (modifiers.length > 0)
				{
					resultDiv.append("<h3>Spezifizierung / Specification</h3>");
					var modifierDiv = $("<div class='treePathDiv' id='modifierInfoDiv'>");
					resultDiv.append(modifierDiv);
					for (var m of modifiers)
					{
						Helper.getPathsByConceptUrl(m, function(path){putPath(modifierDiv, path)});
					}
				}	
				
				/*var queryString = QueryManager.queries.getAllModifiers.replace(/PARENTCONCEPT/g, conceptUrl);
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
				);*/
				
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