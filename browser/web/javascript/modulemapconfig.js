$(document).on("modulemanager:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") loadMapConfigModule();
});
var loadMapConfigModule = function()
{
	ModuleManager.register([
		{
			tabName: "mapping / configuration",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>").css("flex-direction","column");
				
				var ta = $("<textarea style='width:100%; height:300px' id='configTA'></textarea>");
				var btn = $("<input type='button' onclick='loadConfig()' value='load configuration'/>");
				var fileSelect = $("<input type='file' id='configFileInput' />").change(function(evt){
					/*$.ajax({
						url : "file:///C:/Users/stmar7/Projekte/cometar/browser/web/css/dzl.css", //$(this).val(),
						dataType: "text",
						success : function (data) {
							ta.val(data);
						}
					});*/
					var dateien = evt.target.files;
					for (var i = 0, f; f = dateien[i]; i++) {
						if (!f.type.match('text/plain') && !f.type.match('text/xml')) {
							continue;
						}
						var reader = new FileReader();
						reader.onload = (function(theFile) {
							return function(e) {
								ta.val(e.target.result);
							};
						})(f);
						reader.readAsText(f, "UTF-8");
					}
				});
				var newDataSourceDownloadLink = $("<div style='width:100%;padding:10px'><a href='data:text/plain;charset=UTF-8' style='display:none' download='datasource.xml' id='newDataSourceDownloadLink'>Your configuration file is not up to date. Click here to download an updated version.</a></div><br/>");
				var divNotationFeedback = $("<div id='divNotationFeedback'>");
				
				resultDiv.append(fileSelect);
				resultDiv.append(ta);
				resultDiv.append(btn);
				resultDiv.append(newDataSourceDownloadLink);
				resultDiv.append(divNotationFeedback);

				return resultDiv;
			}
		}
	]);	
}

$(document).on("tree:treeItemCreated", function(e, itemDiv){
	markMappedFields(itemDiv);
});

var loadConfig = function(){
	var xml = $("#configTA").val(),
		xmlDoc = $.parseXML( xml ),
		$xml = $( xmlDoc );
	
	var dzlIds = [];
	var sourceIds = [];
	//changing
	var dzlId;
	var sourceId;
	var negations = [];
	var keepBasePair;

	var addIdPair = function(dzlId, sourceId)
	{
		if (!dzlId || dzlId.length==0 || !sourceId || sourceId.length==0) return;
		var i = dzlIds.indexOf(dzlId);
		if (i == -1)
		{
			dzlIds.push(dzlId);
			sourceIds.push(sourceId);
		}
		else if (sourceIds[i].indexOf(sourceId) == -1)
		{
			sourceIds[i] += " || " + sourceId;
		}
	};
	
	var getValueTagIdPairs = function(valueTag)
	{
		negations = [];
		var map = $($(valueTag).children("map")[0]);
		var cases = $(map.children("case, otherwise"));
		if (cases.length == 0) keepBasePair = true;
		cases.each(function(){
			var caseSetId = $(this).attr("set-concept");
			if (!caseSetId || caseSetId.length==0) caseSetId = dzlId;
			var caseValue = $(this).attr("value");
			var caseDropFact = $(this).attr("action") == "drop-fact";
			if (caseDropFact)
			{
				negations.push(caseValue);
			}
			else
			{
				if ($(this)[0].tagName == "otherwise")
				{
					addIdPair(caseSetId, sourceId+"!=\""+negations.join()+"\"");
				}
				else
				{
					addIdPair(caseSetId, sourceId+"==\""+caseValue+"\"");				
				}
				if (caseSetId == dzlId) keepBasePair = true;
			}
		});
	}
		
	$($xml.find( "mdat > concept" )).each(function(){
		var c = $(this);
		var file = c.parent().parent().children("source").children("url").text();
		file = file.substr(0,file.length-4);
		dzlId = c.attr("id");
		sourceId = file + "." + $(c.children("value")[0]).attr("column");		
		keepBasePair = false;
		getValueTagIdPairs(c.children("value")[0]);		
		if (keepBasePair) addIdPair(dzlId, sourceId);
		
		$($(c.children("modifier"))).each(function(){
			var m = $(this);
			dzlId = m.attr("id");
			sourceId = $(m.children("value")[0]).attr("column");
			addIdPair(dzlId, sourceId);
		});
	});
	
	$($xml.find( "virtual > value" )).each(function(){
		var map = $($(this).children("map")[0]);
		var file = $(this).parent().parent().children("source").children("url").text();
		file = file.substr(0,file.length-4);
		var mapSetId = map.attr("set-concept");
		if (mapSetId) dzlId = mapSetId;
		sourceId = file + "." + $(this).attr("column");
		keepBasePair = false;
		getValueTagIdPairs(this);
		if (keepBasePair) addIdPair(dzlId, sourceId);
	});
	
	mappedSourceFields = sourceIds;
	for (var i = 0; i < dzlIds.length; i++)
	{
		//console.log(dzlIds[i]+" : "+sourceIds[i]);
		addMappedFields(dzlIds[i]);
	}	
	
	for (var i = 0; i < deprecatedNotations.length; i++)
	{
		var notation = deprecatedNotations[i];
		var newNotation = QueryManager.getNewNotation(notation);
		var deprecatedConceptUrl = window.location.protocol + "//" + window.location.pathname + "#";
		deprecatedConceptUrl += Helper.getCometarWebUrlByConceptUrl(QueryManager.getDeprecatedConceptByNotation(notation));
		$("#divNotationFeedback").append("<br/><a href='"+deprecatedConceptUrl+"'>"+notation+"</a> is not a valid code (anymore). ");
		if (newNotation != undefined && newNotation != "") 
		{
			xml = xml.replace("\"" + notation + "\"", "\"" + newNotation + "\"");
			$("#newDataSourceDownloadLink").css("display", "block");
			var newConceptUrl = window.location.protocol + "//" + window.location.pathname + "#";
			newConceptUrl += Helper.getCometarWebUrlByConceptUrl(QueryManager.getByProperty("skos:notation", newNotation));
			$("#divNotationFeedback").append("<br/>&quot;"+notation+"&quot; was replaced with <a href='" + newConceptUrl + "'>"+newNotation+"</a>.");
		}
		else
		{
			$("#divNotationFeedback").append("<br/>&quot;"+notation+"&quot; is deprecated.");			
		}
	}
	if (deprecatedNotations.length > 0)
	{
		$("#newDataSourceDownloadLink").attr("href", "data:text/plain;charset=UTF-8,"+encodeURIComponent(xml));
	}
	
	$(".treeItem").each(function(){
		markMappedFields($(this));
	});
}

var addMappedFields = function(dzlId)
{
	var concept = QueryManager.getByProperty("skos:notation", dzlId);
	if (concept != undefined) 
	{
		mappedFields.push(concept);
	}
	else{
		deprecatedNotations.push(dzlId);
		mappedSourceFields.splice(mappedFields.length, 1);	
	}
	QueryManager.getAncestors(concept, function(a){
		if (mappedPathFields.indexOf(a) == -1) {
			mappedPathFields.push(a);
		}
	});
}

var markMappedFields = function(itemDiv)
{
	var conceptUrl = $(itemDiv).attr("data-concepturl");
	var index = mappedFields.indexOf(conceptUrl);
	if (index > -1){
		$(itemDiv).addClass("mappedInConfig");
		$(itemDiv).prepend("<div style='font-size:12px;color:#333'>map: " + mappedSourceFields[index] + "</div>");
	}
	else if (mappedPathFields.indexOf(conceptUrl) > -1){
		$(itemDiv).addClass("mappedInConfigPathPart");
	}
}

var mappedFields = [];
var mappedPathFields = [];
var mappedSourceFields = [];
var deprecatedNotations = [];
