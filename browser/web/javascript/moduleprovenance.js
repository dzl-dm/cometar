$(document).on("modulemanager:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") loadProvenanceModule();
});
loadProvenanceModule = function(){
	ModuleManager.register([
		{
			tabName: "provenance (test)",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div style='position:relative;height:100%'>");	
				var provenanceDiv = $("<div id='provenance_div'>");
				resultDiv.append(provenanceDiv);
				var dateColumnDiv = $("<div class='provenance_date_column'>");
				var barColumnDiv = $("<div class='provenance_bar_column'>");
				provenanceDiv.append(dateColumnDiv);
				provenanceDiv.append(barColumnDiv);
				
				var fromDate = new Date("2018-01-01");
				var untilDate = new Date(Date.now());
				for (var date = untilDate; date >= fromDate; date.setMonth(date.getMonth() - 1))
				{					
					var dft = distanceFromTop(date);
					var dateCell = $("<div class='provenance_date_cell' style='top:"+dft+"px;'>"+date.toLocaleDateString("de-DE")+"</div>");
					dateColumnDiv.height(dft+620);
					dateColumnDiv.append(dateCell);
				}
				var changeshtmlheader = "<table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr>";
				QueryManager.getProvenanceOverview(function(r){
					var commit_id = r["commit"].value.replace("http://data.dzl.de/ont/dwh#commit_","");
					var commit_messages = QueryManager.getPreviousMessagesOfInvalidCommits(commit_id);
					commit_messages.push(r["message"].value);
					commit_message = commit_messages.join(" THEN ").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
					var author = r["author"].value.replace("http://data.dzl.de/ont/dwh#","").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
					var end = new Date(r["enddate"].value);
					var shortEndDate = end.toLocaleDateString("de-DE");
					var barId = shortEndDate.replace(/\./g,'');
					var barRowDiv;
					if (barColumnDiv.children("#"+barId).length == 0) {
						barRowDiv = $("<div class='provenance_bar_row' style='top:"+distanceFromTop(end)+"px;' id='"+barId+"'>");
						barColumnDiv.append(barRowDiv);
					}
					else {						
						barRowDiv = barColumnDiv.children("#"+barId+":first");
					}
					
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
							default:
								//console.log(r["predicate"].value);
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
						barCellDiv=barCommitCellDiv.children(".provenance_bar_cell."+changetype);
						barCellDiv.attr("tooltip",barCellDiv.attr("tooltip")+html);
						barCellDiv.show().css("width","+=5");
						
					},function(){				
						barCommitCellDiv.children(".provenance_bar_cell").each(function(){
							$(this).attr("tooltip",$(this).attr("tooltip")+"</table>");
						});
					});
				});
				return resultDiv;
			}
		}
	]);	
	
	var distanceFromTop = function(date)
	{
		var timespan = (Date.now()-date - date.getMilliseconds() - date.getSeconds()*1000 - date.getMinutes()*1000*60 - date.getHours()*1000*60*60);
		var timespan = Math.floor(timespan/1000/60/60/24);
		var topDistance = timespan*20+20;
		return topDistance;
	}
	
	var cellSize = function(i)
	{
		return Math.sqrt(i*10)*5;
	}
}