$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "mapconfig",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>");
				
				var ta = $("<textarea style='width:100%; height:300px' id='configTA'></textarea>");
				var btn = $("<button onclick='loadConfig()'>load configuration</button>");
				resultDiv.append(ta);
				resultDiv.append(btn);
				
				return resultDiv;
			}
		}
	]);	
});

$(document).on("tree:treeItemCreated", function(e, itemDiv){
	markMappedFields(itemDiv);
});

var loadConfig = function(){
	var xml = $("#configTA").val(),
		xmlDoc = $.parseXML( xml ),
		$xml = $( xmlDoc ),
		// auskommentierte Felder werden nicht gefunden
		$mdatConcepts = $xml.find( "mdat > concept" ),
		$virtualMapConcepts = $xml.find( "virtual > value > map" ),
		$virtualMapCaseConcepts = $xml.find( "virtual > value > map > case" );
	
	addMappedFields($mdatConcepts, "id");
	addMappedFields($virtualMapConcepts, "set-concept");
	addMappedFields($virtualMapCaseConcepts, "set-concept");
	
	$(".treeItem").each(function(){
		markMappedFields($(this));
	});
}

var addMappedFields = function(tags, attrName)
{
	$(tags).each(function(){
		var notation = $(this).attr(attrName);
		if (notation == undefined) {
			return;
		}
		var queryString = QueryManager.queries.getConceptUrlByNotation.replace(/NOTATION/g, notation);
		QueryManager.query(
			queryString, 
			function(resultItem){
				if (resultItem["concept"]) {
					var concept = resultItem["concept"].value;
					console.log(concept);
					mappedFields.push(concept);
					
					var queryString = QueryManager.queries.getParentConcepts.replace(/CONCEPT/g, concept);
					QueryManager.query(
						queryString, 
						function(resultItem){
							if (resultItem["parentconcept"]) {
								var parentConcept = resultItem["parentconcept"].value;
								if (mappedPathFields.indexOf(parentConcept) == -1) {
									mappedPathFields.push(parentConcept);
								}
							}
						}
					);
				}
			}
		);
	});
}

var markMappedFields = function(itemDiv)
{
	var conceptUrl = $(itemDiv).attr("data-concepturl");
	if (mappedFields.indexOf(conceptUrl) > -1){
		$(itemDiv).addClass("mappedInConfig");
	}
	else if (mappedPathFields.indexOf(conceptUrl) > -1){
		$(itemDiv).addClass("mappedInConfigPathPart");
	}
}

var mappedFields = [];
var mappedPathFields = [];

