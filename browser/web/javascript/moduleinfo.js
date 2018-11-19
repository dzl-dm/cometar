var InfoModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "details",
			handlerFunction: getInfoDiv	
		});
	}
	
	var getInfoDiv = function(conceptIri){
		var resultDiv = $("<div>");	
		var restInfoDiv = $("<div id='restInfoDiv'>").css("display","block");
		resultDiv.append(restInfoDiv);
		if (!conceptIri) 
		{			
			var allChangeCommitsInfoDiv = $("<div class='infoDiv infoDivChanges'><h3>Recent Changes</h3></div>");	
			restInfoDiv.append(allChangeCommitsInfoDiv);
			QueryManager.getStartPageOverview(function(i){
				var ident = (i["author"]?Helper.getReadableString(i["author"].value).toUpperCase():"") + " on " + i["timestamp"].value;
				if ($(".dateDiv:contains("+ident+")").length > 0)
				{
					$(".dateDiv:contains("+ident+")").data("conceptIris",$(".dateDiv:contains("+ident+")").data("conceptIris")+","+i["element"].value); 
					changesDiv = $(".dateDiv:contains("+ident+")").next();
				}
				else
				{
					dateDiv = $("<div style='display:inline-block;vertical-align:top;width:150px' class='dateDiv'><a href='#'>"+ ident + "</a></div>");
					dateDiv.data("conceptIris",i["element"].value);
					dateDiv.click(function(e){
						e.stopPropagation();	
						Helper.clearFieldsToMark(["fieldToMark","fieldToMarkPath"]);
						var conceptIris = $(this).data("conceptIris").split(",");
						for (var j=0; j < conceptIris.length; j++)
						{
							var u = conceptIris[j];
							Helper.addFieldToMark(u,"fieldToMark");
						}
						for (var j=0; j < conceptIris.length; j++)
						{
							var u = conceptIris[j];
							QueryManager.getAncestors(u, function(a){
								Helper.addFieldToMark(a,"fieldToMarkPath");
							});
						}
						Helper.markFields();
					});
					changesDiv = $("<div class='changesDiv'>");
					Helper.customHide(changesDiv,100);
					allChangeCommitsInfoDiv.append(dateDiv).append(changesDiv).show();
				}
				changesDiv.append(i["label"].value + ": " + (i["predicate"]?Helper.getReadableString(i["predicate"].value):"") + "<br/>"); 
			});
			return resultDiv;
		}
		else
		{
			var aggregatedInfoDiv = $("<div id='aggregatedInfoDiv' class='infoDiv'>").css("display","block");
			resultDiv.append(aggregatedInfoDiv);

			var treePathDiv = $("<div class='treePathDiv infoDiv'>");	
			Helper.getPathsByConceptIri(conceptIri, function(path){putPath(treePathDiv, path)});			
			treePathDiv.prepend("<h3>Path</h3>").css("display","block");
			restInfoDiv.append(treePathDiv);
			
			var infoDivLabel = $("<div class='aggregatedInfo'><h3>Label</h3></div>");
			aggregatedInfoDiv.append(infoDivLabel); 	
			QueryManager.getProperty(conceptIri, "skos:prefLabel", function(i){
				infoDivLabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").addClass("filled"); 
			});
			
			var infoDivNotation = $("<div class='aggregatedInfo'><h3>Code</h3></div>");	
			aggregatedInfoDiv.append(infoDivNotation); 
			QueryManager.getProperty(conceptIri, "skos:notation", function(i){
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
			var infoDivDescription = $("<div class='infoDiv'><h3>Description</h3></div>");	
			restInfoDiv.append(infoDivDescription); 
			QueryManager.getProperty(conceptIri, "dc:description", function(i){
				infoDivDescription.append((i["xml:lang"] != undefined?i["xml:lang"].toUpperCase() + ": ":"") + i.value + "<br/>").css("display","block");
			});
			var infoDivUnit = $("<div class='aggregatedInfo'><h3>Unit</h3></div>");	
			aggregatedInfoDiv.append(infoDivUnit); 
			QueryManager.getProperty(conceptIri, ":unit", function(i){
				infoDivUnit.append(i.value + "<br/>").addClass("filled"); 
			});
			var infoDivAltlabel = $("<div class='aggregatedInfo'><h3>Alternative Label</h3></div>");	
			aggregatedInfoDiv.append(infoDivAltlabel); 
			QueryManager.getProperty(conceptIri, "skos:altLabel", function(i){
				infoDivAltlabel.append(i["xml:lang"].toUpperCase() + ": " + i.value + "<br/>").addClass("filled"); 
			});
			var infoDivStatus = $("<div class='aggregatedInfo'><h3>Status</h3></div>");
			aggregatedInfoDiv.append(infoDivStatus); 
			QueryManager.getProperty(conceptIri, ":status", function(i){
				infoDivStatus.append(i.value + "<br/>").addClass("filled");  
			});
			var infoDivAuthor = $("<div class='aggregatedInfo'><h3>Author</h3></div>");
			aggregatedInfoDiv.append(infoDivAuthor); 
			QueryManager.getProperty(conceptIri, "dc:creator", function(i){
				infoDivAuthor.append(i.value + "<br/>").addClass("filled"); 
			});
			var infoDivCoverage = $("<div class='aggregatedInfo'><h3>Coverage</h3></div>");
			aggregatedInfoDiv.append(infoDivCoverage); 
			QueryManager.getSiteCoverageByConceptUrl(conceptIri, function(i){
				var name = Helper.getReadableString(i) + "<br>";
				if (infoDivCoverage.html().indexOf(name)==-1) infoDivCoverage.append(name).addClass("filled"); 
				
			});
			var infoDivDomain = $("<div class='aggregatedInfo'><h3>Domain</h3></div>");
			aggregatedInfoDiv.append(infoDivDomain); 	
			QueryManager.getProperty(conceptIri, "dwh:restriction", function(i){
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
			if (Helper.getQueryParameter("mode")=="advanced")
			{
				var infoDivSubconcepts = $("<div class='aggregatedInfo'><h3>#Subordinated concepts / modifiers</h3></div>");
				aggregatedInfoDiv.append(infoDivSubconcepts); 
				QueryManager.getTotalNumberOfSubConcepts(conceptIri, function(i){
					infoDivSubconcepts.append(i["concepts"].value + " / " + i["modifiers"].value + "<br/>").addClass("filled"); 
				});
				
				var exportButtonDiv=$("<div class='button' id='exportButtonDiv'>Export</div>");
				var exportLink = $("<a id='exportLink' href='data:text/plain;charset=UTF-8' download='export.csv' style='display:none'></a>");
				aggregatedInfoDiv.append(exportLink);
				aggregatedInfoDiv.append(exportButtonDiv);
				exportButtonDiv.click(function(e){
					getExport(conceptIri).then(function(exportText){
						exportText = "Bezeichnung;Code;Einheit;ist Spezifikation;Status draft\n" + exportText;
						exportLink.attr("href", "data:text/plain;charset=UTF-8,"+encodeURIComponent(exportText));
						exportLink[0].click();
					});
				});
			}
			
			var infoDivEditNotes = $("<div class='infoDiv'><h3>Editorial Notes</h3></div>");
			restInfoDiv.append(infoDivEditNotes); 
			QueryManager.getProperty(conceptIri, "skos:editorialNote", function(i){
				infoDivEditNotes.append(i.value + "<br/>").css("display","block");
			});
			
			var infoDivChanges = $("<div class='infoDiv infoDivChanges'><h3>Change Log</h3></div>");	
			restInfoDiv.append(infoDivChanges); 
			var date="";
			var dateDiv;
			var changesDiv;
			var oldValue="";
			var segment;
			QueryManager.getNotes(conceptIri, function(i){	
				if (i["predicate"].value == "http://www.w3.org/2004/02/skos/core#topConceptOf"
					|| i["predicate"].value == "http://www.w3.org/2004/02/skos/core#inScheme"
					|| i["predicate"].value == "http://www.w3.org/2004/02/skos/core#broader"
					|| i["predicate"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf"
					|| i["predicate"].value == "http://www.w3.org/2004/02/skos/core#hasTopConcept"
					|| i["predicate"].value == "http://www.w3.org/2004/02/skos/core#editorialNote"
					|| i["predicate"].value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
				{
					return;
				}
				var lang="";
				if (i["object"]["xml:lang"])lang="(" + i["object"]["xml:lang"] + ") ";

				date = i["enddate"].value.substr(0,10);
				var dateId = date.replace(/-/g,"");
				if ($("#"+dateId).length > 0)
				{
					changesDiv = $("#"+dateId).next();
				}
				else
				{
					dateDiv = $("<div style='display:inline-block;vertical-align:top;width:100px' class='dateDiv' id='"+dateId+"'>"+ date + "</div>");
					changesDiv = $("<div class='changesDiv'></div>");
					infoDivChanges.append(dateDiv).append(changesDiv).show();
				}			
				
				var segmentHeading = Helper.getReadableString(i["predicate"].value) + lang;
				var segmentData = date + Helper.getReadableString(i["predicate"].value) + lang;
				segment = $(".changesSegment[data='"+segmentData+"']");
				if (segment.length == 0) 
				{
					segment = $("<div class='changesSegment' data='"+segmentData+"'>");
					segment.append("<div class='segmentHeading'>"+segmentHeading+"</div>");
					changesDiv.append(segment);
				}
				var changeDiv = $("<div>").append(Helper.getReadableString(i["object"].value));
				if (i["action"].value == "http://purl.org/vocab/changeset/schema#addition") changeDiv.addClass("plusChange");	
				else changeDiv.addClass("minusChange");	
				if (i["object"]["type"]=="literal") changeDiv.addClass("literal");
				segment.append(changeDiv);
			}, function(){		
				$(".minusChange").each(function(){
					var oldValueDiv = $(this);
					oldValueDiv.siblings(".plusChange").each(function()
					{
						var newValueDiv = $(this);
						if (oldValueDiv.hasClass("minorChange") || newValueDiv.hasClass("minorChange")) return;
						if (($(this).hasClass("literal") && Helper.levenstheinDistance(oldValueDiv.text(),newValueDiv.text()) < 2)
							|| oldValueDiv.text() == newValueDiv.text())
						{
							oldValueDiv.addClass("minorChange");
							newValueDiv.addClass("minorChange");
						}
					});
				});
				//Helper.customHide(infoDivChanges,$(".infoDivChanges").children(".changesDiv:first").get(0).scrollHeight+20);
				Helper.customHide(infoDivChanges,40);
			});
				
			var modifierDiv = $("<div class='treePathDiv infoDiv' id='modifierInfoDiv'><h3>Specifications</h3></div>");
			restInfoDiv.append(modifierDiv);
			QueryManager.getModifiers(conceptIri, function(m){
				modifierDiv.css("display","block");
				Helper.getPathsByConceptIri(m, function(path){putPath(modifierDiv, path)});
			});
		}
		return resultDiv;
	}
	
	var getExport = function(iri, c){
		var dfd = $.Deferred();
		var newLine = "";
		var counter = (c!=undefined)?c:0;
		for (var i = 0; i < counter; i++) newLine += "    ";
		//newLine += Helper.getPrefixedIri(iri);
		QueryManager.getExportParams(iri, function(r){
			newLine+=/*";"+*/r["enlabel"].value;
			newLine+=";"+((r["codes"])?r["codes"].value:"");
			newLine+=";"+((r["units"])?r["units"].value:"");
			newLine+=";"+((r["ismod"].value > 0)?"x":"");
			newLine+=";"+((r["isdraft"].value > 0)?"x":"");
		}).then(function(){
			newLine += "\n";
			var processes = [];
			QueryManager.getSubElements(iri, function(e){
				processes.push(getExport(e,counter+1));
			}, function(){
				$.when.apply($,processes).then(function(){
					for (var i = 0; i < arguments.length && arguments[i] != undefined; i++){
						newLine += arguments[i]; 
					}
					
					dfd.resolve(newLine);
				});
			});
		});
		return dfd.promise();
	}

	var putPath = function(div, path)
	{
		var headPathDiv = $("<div class='headPathDiv'>");
		headPathDiv.html(path[1].join(" / "));
		headPathDiv.data("path", path[0]);
		/*headPathDiv.click(function(){
			$(".treeMenuItem[target='conceptTree']").click();
			TreeManager.openPath($.merge([],$(this).data("path")), true);
		});*/
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
	
	return {
		init: init
	}
}());
$(document).on("cometar:readyForModuleRegister", InfoModule.init);