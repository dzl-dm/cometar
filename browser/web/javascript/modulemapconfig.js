var MapConfigModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "mapping / configuration",
			handlerFunction: getMapConfigDiv	
		});
	}
	
	var getMapConfigDiv = function(conceptIri){
		var resultDiv = $("<div>").css("flex-direction","column");
		
		var ta = $("<textarea style='width:100%; height:300px' id='configTA'></textarea>");
		var btn = $("<input type='button' id='loadConfigBtn' onclick='MapConfigModule.loadConfig()' value='load configuration'/>");
		var fileSelect = $("<input type='file' id='configFileInput' />").change(function(evt){

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
	
	var readConfig = function()
	{
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
		
		var taValue = $("#configTA").val();
		var validXml = false;
		try {
			var xmlDoc = $.parseXML( taValue );
			validXml = true;
			var $xml = $( xmlDoc );
			
			var getValueTagIdPairs = function(valueTag)
			{
				negations = [];
				var map = $($(valueTag).children("map")[0]);
				var cases = $(map.children("case, otherwise"));
				var hasOtherwise = $(map.children("otherwise")).length > 0;
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
				if (!hasOtherwise && negations.length > 0)
				{
					addIdPair(dzlId, sourceId+"!=\""+negations.join()+"\"");
				}
			}
				
			$($xml.find( "mdat > concept" )).each(function(){
				var c = $(this);
				var file = c.parent().parent().children("source").children("url").text();
				file = file.substr(0,file.length-4);
				dzlId = c.attr("id");
				sourceId = file + "." + $(c.children("value")[0]).attr("column");	
				keepBasePair = false;
				if (c.children("value")[0] != undefined) getValueTagIdPairs(c.children("value")[0]);	
				if (c.attr("constant-value") != undefined) { 
					sourceId = "constant-value";
					keepBasePair = true;
				}
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
		} catch (err) {
			var ids = taValue.split(",");
			for (var i = 0; i < ids.length; i++)
			{
				var id = ids[i];
				addIdPair(id,"-");
			}
			return;
		} finally {
			return {
				configString: taValue,
				isXml: validXml,
				dzlIds: dzlIds,
				mappingDescriptions: sourceIds
			}
		}	
	}

	var loadConfig = function(){
		//reset
		$("#divNotationFeedback").html("");
		$("#newDataSourceDownloadLink").css("display","none").attr("href","");	

		var config = readConfig();
		var categorization = categorizeMappedOrDeprecated(config.dzlIds, config.mappingDescriptions);
		createUpdatedConfigurationFile(config.configString, categorization.deprecatedNotations, config.isXml);
		mappedPathFields = QueryManager.getPathPartsOfMultipleElements(categorization.mappedElements);
		TreeManager.TreeElementsMarker.setFields(categorization.mappedElements, mappedPathFields, config.mappingDescriptions).mark();
	}
	
	var createUpdatedConfigurationFile = function(configString, deprecatedNotations, validXml)
	{
		for (var i = 0; i < deprecatedNotations.length; i++)
		{
			var notation = deprecatedNotations[i];
			var newNotation = QueryManager.getNewNotationByDeprecatedNotation(notation);
			/*if (newNotation == notation) 
			{
				$("#divNotationFeedback").append("<br/>&quot;"+notation+"&quot; has multiple new notations.");	
				continue;
			}*/
			var deprecatedConceptIri = window.location.protocol + "//" + (window.location.hostname?window.location.hostname:"") + window.location.pathname + "#";
			var deprecatedConcept = QueryManager.getElementByRemovedNotation(notation);
			if (deprecatedConcept) 
			{
				deprecatedConceptIri += Helper.getCometarWebUrlByConceptIri(deprecatedConcept);
				$("#divNotationFeedback").append("<br/><a href='"+deprecatedConceptIri+"'>"+notation+"</a> is not a valid code (anymore). ");
			}
			else
			{
				$("#divNotationFeedback").append("<br/>Unknown notation: "+notation+". ");
			}
			if (newNotation != undefined && newNotation != "") 
			{
				var regex = new RegExp("\""+notation+"\"", "g");
				if (validXml) configString = configString.replace(regex, "\"" + newNotation + "\"");
				else configString = configString.replace((i==0?"":",") + notation + (i==deprecatedNotations.length?"":","), (i==0?"":",") + newNotation + (i==deprecatedNotations.length?"":","));
				$("#newDataSourceDownloadLink").css("display", "block");
				var newConceptIri = window.location.protocol + "//" + (window.location.hostname?window.location.hostname:"") + window.location.pathname + "#";
				newConceptIri += Helper.getCometarWebUrlByConceptIri(QueryManager.getByProperty("skos:notation", newNotation));
				$("#divNotationFeedback").append("<br/>&quot;"+notation+"&quot; was replaced with <a href='" + newConceptIri + "'>"+newNotation+"</a>.");
			}
			else
			{
				$("#divNotationFeedback").append("<br/>&quot;"+notation+"&quot; is deprecated.");			
			}
		}	
		if (deprecatedNotations.length > 0 && checkForCharacterset(configString))
		{
			$("#newDataSourceDownloadLink").attr("href", "data:text/plain;charset=UTF-8,"+encodeURIComponent(configString));
		}	
	}
	
	var checkForCharacterset = function(s){
		//such characters may make sense in the column-field which will not appear in the client-software-produced xml
		var regex = new RegExp("column=\"[^\"]+\"", "g");
		s = s.replace(regex, "");		
		var regex = new RegExp("[^\x80-\xFF]", "g");
		s = s.replace(regex, "");		
		if (s=="") return true;
		$("#divNotationFeedback").append("<br/><span style='color:red;font-weight:bold'>!!</span> Configuration file contains invalid character(s): &quot;"+s+"&quot;.");
		return false;
	};

	var categorizeMappedOrDeprecated = function(dzlIds, mappingDescriptions)
	{			
		var deprecatedNotations = [];
		var mappedElements = [];
		for (var i = 0; i < dzlIds.length; i++)
		{
			var dzlId = dzlIds[i];
			var e = QueryManager.getByProperty("skos:notation", dzlId);
			if (e != undefined) 
			{
				mappedElements.push(e);
			}
			else{
				deprecatedNotations.push(dzlId);
				mappingDescriptions.splice(mappedElements.length, 1);	
			}
		}
		return {
			mappedElements: mappedElements,
			mappingDescriptions: mappingDescriptions,
			deprecatedNotations: deprecatedNotations
		}
	}
	
	return {
		init: init,
		loadConfig: loadConfig
	}
}());

$(document).on("cometar:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") MapConfigModule.init();
});