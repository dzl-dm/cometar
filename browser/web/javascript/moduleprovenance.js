ProvenanceModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "provenance (test)",
			handlerFunction: getProvenanceDiv	
		});
	}
	
	var getProvenanceDiv = function(conceptUrl){
		var resultDiv = $("<div style='position:relative;height:100%;display:flex;flex-direction:row'>");	
		var provenanceDiv = $("<div id='provenance_div'>");
		var dateColumnDiv = $("<div id='provenance_date_column'>");
		resultDiv.append(dateColumnDiv);
		resultDiv.append(provenanceDiv);
		var changesColumnDiv = $("<div id='provenance_changes_column'>");
		provenanceDiv.append(changesColumnDiv);
		provenanceDiv.scroll(function(){
			var st = $(this).scrollTop();
			$(dateColumnDiv).children().css("marginTop",(st*(-1)+3)+"px");
		});
	
		var createDayLines = function(fromDate, untilDate){
			for (var date = new Date(untilDate); date >= fromDate; date.setHours(date.getHours() - 24)){
				var dayId = date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\./g,'');
				var dayLine = $("<div class='dayLine' id='dayLine_"+dayId+"'>");
				changesColumnDiv.append(dayLine);
			}		
		}

		var changeshtmlheader = "<table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr>";
		var createProvenanceBars = function(fromDate, untilDate){
			QueryManager.getProvenanceOverview(fromDate, untilDate, function(r){
				var commit_id = r["commit"].value.replace("http://data.dzl.de/ont/dwh#commit_","");
				var commit_messages = QueryManager.getPreviousMessagesOfInvalidCommits(commit_id);
				commit_messages.push(r["message"].value);
				commit_message = commit_messages.join(" THEN ").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
				var author = r["author"].value.replace("http://data.dzl.de/ont/dwh#","").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
				var end = new Date(r["enddate"].value);
				var shortEndDate = end.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
				
				//the day
				var barId = shortEndDate.replace(/\./g,'');
				var barRowDiv;
				var dayLine = changesColumnDiv.children("#dayLine_"+barId);
				var dateDiv;
				if (dayLine.children("#bar_"+barId).length == 0) {
					barRowDiv = $("<div class='provenance_bar_row' id='bar_"+barId+"'></div>");
					dateDiv = $("<div class='provenance_bar_row_date' id='date_"+barId+"'>"+shortEndDate+"</div>");
					if (barId.substr(2,2)%2 == 0) dateDiv.addClass("odd");
					dayLine.append(barRowDiv);
					dateColumnDiv.append(dateDiv);
				}
				else {						
					barRowDiv = dayLine.children("#bar_"+barId+"");
					dateDiv = dateColumnDiv.children("#date_"+barId+"");
				}
				
				//the commit
				var barCommitCellDiv = $("<div class='provenance_bar_commit_cell' id='"+commit_id+"'>");
				var tooltip = commit_id+": "+shortEndDate+" ("+commit_message+")<br>"+changeshtmlheader;
				barCommitCellDiv.append($("<div class='provenance_bar_cell literal' style='display:none' tooltip='"+tooltip+"'>"));
				barCommitCellDiv.append($("<div class='provenance_bar_cell structure' style='display:none' tooltip='"+tooltip+"'>"));
				barCommitCellDiv.append($("<div class='provenance_bar_cell progress' style='display:none' tooltip='"+tooltip+"'>"));
				barCommitCellDiv.append($("<div class='provenance_bar_cell semantic' style='display:none' tooltip='"+tooltip+"'>"));
				barRowDiv.append(barCommitCellDiv);
				
				QueryManager.getProvenanceDetails(commit_id, function(r){
					if (r["predicate"] == undefined) return ;
					var changetype = "notype";
					switch (r["predicate"].value)
					{
						case "http://www.w3.org/2004/02/skos/core#prefLabel":
						case "http://www.w3.org/2004/02/skos/core#altLabel":
						case "http://purl.org/dc/elements/1.1/description":
							changetype = "literal";
							break;
						case "http://www.w3.org/2004/02/skos/core#narrower":
						case "http://www.w3.org/2004/02/skos/core#broader":
						case "http://www.w3.org/2004/02/skos/core#hasTopConcept":
						case "http://www.w3.org/2004/02/skos/core#topConceptOf":
						case "http://www.w3.org/2004/02/skos/core#member":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#about":
						case "http://data.dzl.de/ont/dwh#topLevelNode":
						case "http://www.w3.org/ns/prov#wasDerivedFrom":
							changetype = "structure";
							break;
						case "http://data.dzl.de/ont/dwh#unit":
						case "http://www.w3.org/2004/02/skos/core#notation":
							changetype = "semantic";
							break;
						case "http://www.w3.org/2004/02/skos/core#editorialNote":
						case "http://data.dzl.de/ont/dwh#status":
						case "http://sekmi.de/histream/dwh#restriction":
							changetype = "progress";
							break;
						case "http://purl.org/dc/elements/1.1/creator":
						case "http://www.w3.org/2004/02/skos/core#description":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#isPartOf":
						case "http://www.w3.org/2004/02/skos/core#inScheme":
						case "http://www.w3.org/1999/02/22-rdf-syntax-ns#broader":
						case "http://www.w3.org/2004/02/skos/core#prefLAbel":
						case "http://purl.org/dc/elements/1.1/descriptions":
						case "http://www.w3.org/2002/07/owl#onProperty":
						case "http://www.w3.org/2002/07/owl#allValuesFrom":
							return;
						default:
							console.log("Predicate "+r["predicate"].value+" not configured!");
							return;
							break;
					}
					
					var subject = r["sl"]?r["sl"].value:r["subject"]?r["subject"].value:"";
					var predicate = r["predicate"]?r["predicate"].value:"";
					var oldobject = r["ool"]?r["ool"].value:r["oldobject"]?r["oldobject"].value:"";
					var newobject = r["nol"]?r["nol"].value:r["newobject"]?r["newobject"].value:"";
					var lang = r["oldobject"]&&r["oldobject"]["xml:lang"]?r["oldobject"]["xml:lang"]:r["newobject"]&&r["newobject"]["xml:lang"]?r["newobject"]["xml:lang"]:"";
					var html = "<tr><td>"+subject+"</td><td>"+predicate+" " +lang+"</td><td>"+oldobject+"</td><td>"+newobject+"</td></tr>";						
					html = html.replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");//.replace(new RegExp("“", "g"),"&#34;").replace(new RegExp("”", "g"),"&#34;");
					html = Helper.getReadableString(html);

					barCommitCellDiv.css("display","flex");
					dayLine.addClass("with_content");
					dateDiv.css("display","block");
					
					var barCellDiv=barCommitCellDiv.children(".provenance_bar_cell."+changetype);
					barCellDiv.attr("tooltip",barCellDiv.attr("tooltip")+html);
					barCellDiv.attr("subjects",(barCellDiv.attr("subjects")?barCellDiv.attr("subjects")+";":"")+r["subject"].value);
					barCellDiv.css("display","block").css("width","+=5");
					dateDiv.css("top",dayLine.position().top);
					
				},function(){				
					barCommitCellDiv.children(".provenance_bar_cell").each(function(index, e){
						$(this).attr("tooltip",$(this).attr("tooltip")+"</table>");
						if ($(this).css("display") == "none") $(this).remove();
					});
				});
			},function(){
				provenanceDiv.find(".provenance_bar_cell").click(function(){
					var subjects=$(this).attr("subjects");
					TreeManager.openSelectMark({
						IRIs: subjects,
						markMapping: true
					});
				});	
			});
		}
		
		var untilDate = new Date(Date.now());
		var fromDate = new Date(untilDate);
		fromDate.setMonth(fromDate.getMonth()-1);
		createDayLines(fromDate, untilDate);
		createProvenanceBars(fromDate, untilDate);
		
		var loadMoreDiv=$("<div id='provenance_loadMoreDiv'>load more</div>");
		loadMoreDiv.click(function(){
			fromDate.setMonth(fromDate.getMonth()-3);
			untilDate.setMonth(untilDate.getMonth()-3);
			createDayLines(fromDate, untilDate);
			createProvenanceBars(fromDate, untilDate);			
		});
		dateColumnDiv.append(loadMoreDiv);
		
		var legendDiv=$("<div id='provenance_legendDiv' class='provenance_bar_commit_cell'><div class='provenance_bar_cell literal'>literal</div><div class='provenance_bar_cell structure'>structure</div><div class='provenance_bar_cell progress'>progress</div><div class='provenance_bar_cell semantic'>semantic</div></div>")
		resultDiv.append(legendDiv);
		legendDiv.children().each(function(){
			var highlightClass;
			if ($(this).hasClass("literal"))highlightClass="literal";
			if ($(this).hasClass("structure"))highlightClass="structure";
			if ($(this).hasClass("progress"))highlightClass="progress";
			if ($(this).hasClass("semantic"))highlightClass="semantic";
			$(this).hover(function(){
				$(".provenance_bar_cell."+highlightClass).addClass("highlight");
				$(".provenance_bar_cell:not(."+highlightClass+")").addClass("nonhighlight");
			},function(){
				$(".provenance_bar_cell."+highlightClass).removeClass("highlight");
				$(".provenance_bar_cell:not(."+highlightClass+")").removeClass("nonhighlight");
			});
			$(this).click(function(){
				$(".provenance_bar_cell:not(."+highlightClass+")").toggleClass("hidden");				
			});
		});
		
		return resultDiv;
	}
	
	return {
		init: init
	}
}());
$(document).on("cometar:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") ProvenanceModule.init();
});