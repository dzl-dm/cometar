ProvenanceModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "provenance (test)",
			handlerFunction: getProvenanceDiv	
		});
	}
	
	var getProvenanceDiv = function(conceptIri){
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

		var createProvenanceBars = function(fromDate, untilDate){
			QueryManager.getProvenanceOverview(fromDate, untilDate, function(r){
				var commit_id = r["commit"].value.replace("http://data.dzl.de/ont/dwh#commit_","");
				var commit_messages = QueryManager.getPreviousMessagesOfInvalidCommits(commit_id);
				commit_messages.push(r["message"].value);
				commit_message = commit_messages.join(" THEN ").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
				var author = r["author"].value.replace("http://data.dzl.de/ont/dwh#","").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
				var end = new Date(r["enddate"].value);
				
				var c = Commits.put(commit_id, author, commit_message, end);
				var shortEndDate = c.shortDate();
				var day = Days.get(shortEndDate);
				day.putCommit(c);
				c.loadDetails().then(function(){
					day.renderDomObjects();
					c.getDomObject().click(function(){
						var changes=getChangesByCommit(c);
						showAtomicChangesInTree(changes, "commit");						
					});
					day.getDateDomObject().unbind( "click" ).click(function(){
						var changes=getChangesByDay(day);
						showAtomicChangesInTree(changes, "day");							
					});
				});			
			});
		}
		
		var getChangesByDay = function(day){
			var commits = day.getCommits();
			var changes = {};
			for (var i = 0; i < commits.length; i++)
			{
				var changes2=getChangesByCommit(commits[i]);
				mergeChangesBySubject(changes,changes2);
			}
			return changes;			
		}
		
		var getChangesByCommit = function(commit){
			var changesBySubject={};
			var cats = commit.getCategories();
			$.each(cats,function(key, category){
				mergeChangesBySubject(changesBySubject, category.getChangesBySubject());
			});
			return changesBySubject;				
		}
		
		var getChangesByWhatIsLoaded = function(){
			var changes={};
			var d = Days.getAll();
			$.each(d,function(key, day){
				mergeChangesBySubject(changes, getChangesByDay(day));
			});
			return changes;			
		}
		
		var mergeChangesBySubject = function(changesBySubject, changesBySubjectAdditions){
			$.each(changesBySubjectAdditions, function(key, atomicChanges){
				changesBySubject[key] = $.merge(changesBySubject[key]?changesBySubject[key]:[], atomicChanges);	
				minimizeChangesForSubject(changesBySubject[key]);
				if (changesBySubject[key].length == 0) delete changesBySubject[key];
			});			
		}
		
		var minimizeChangesForSubject = function (changes){
			var i = 0;
			while (i < changes.length) {
				if (changes[i].getPredicate() == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
					|| changes[i].getPredicate() == "http://www.w3.org/ns/prov#wasDerivedFrom") {
					changes.splice(i, 1);
					i--;
				}
				i++;
			}
			i=0;
			while (i < changes.length-1){
				for (var j = i+1; j < changes.length; j++){
					if (changes[i].getPredicate() == changes[j].getPredicate()
						&& (changes[i].getOldobject() == changes[j].getNewobject()
							|| changes[i].getNewobject() == changes[j].getOldobject())
					){
						//console.log("Removed "+changes[i].getPredicate()+" from " +changes[j].getNewobject()+ " to "+changes[i].getOldobject());
						changes.splice(j, 1);	
						changes.splice(i, 1);	
						i--;
						break;
					}
				}		
				i++;
			}
		}
		
		var showAtomicChangesInTree = function(changesBySubject, type){
			var subjects = [];
			var descriptions = [];
			$.each(changesBySubject, function(key, atomicChanges){
				var isBlankNode = key.substring(0,1)=="b";
				var isDeprecated = QueryManager.getProperty(key, "skos:prefLabel", "lang(?result)='en'").length == 0;
				if (isBlankNode){
					console.log(key+" is blank node.");
					return;
				}
				if (isDeprecated){
					console.log(key+" is deprecated.");
					return;					
				}
				subjects.push(key);
				var description;
				switch (type)
				{
					case "commit":
						description = $("<div><table class='treeDescriptionTable'><tr><th>Property</th><th>Old Value</th><th>New Value</th></tr></table></div>")					
						break;
					case "day":							
						description = $("<div><table class='treeDescriptionTable'><tr><th>Time</th><th>Property</th><th>Old Value</th><th>New Value</th></tr></table></div>")							
						break;
					case "all":							
						description = $("<div><table class='treeDescriptionTable'><tr><th>Date</th><th>Property</th><th>Old Value</th><th>New Value</th></tr></table></div>")							
						break;
				}				
				for (var i = 0; i < atomicChanges.length; i++){
					switch (type)
					{
						case "commit":
							description.children("table").append(atomicChanges[i].getConceptTreeDescriptionRowForCommit());						
							break;
						case "day":							
							description.children("table").append(atomicChanges[i].getConceptTreeDescriptionRowForDay());								
							break;
						case "all":							
							description.children("table").append(atomicChanges[i].getConceptTreeDescriptionRowForWholeTime());								
							break;
					}
				}
				descriptions.push(description.html());
			});
			TreeManager.openSelectMark({
				IRIs: subjects,
				markMapping: true,
				descriptions: descriptions
			});			
		}
		
		var untilDate = new Date(Date.now());
		var fromDate = new Date(untilDate);
		fromDate.setMonth(fromDate.getMonth()-1);
		createDayLines(fromDate, untilDate);
		createProvenanceBars(fromDate, untilDate);
		
		var loadMoreButtonDiv=$("<div id='provenance_loadMoreButtonDiv' class='provenance_button'>load</div>");
		loadMoreButtonDiv.click(function(){
			untilDate = new Date(fromDate);
			fromDate.setHours(fromDate.getHours()-$("#provenance_loadMoreAmountInput").val()*7*24);
			createDayLines(fromDate, untilDate);
			createProvenanceBars(fromDate, untilDate);			
		});
		var loadMoreDiv = $("<div id='provenance_loadMoreDiv'>");
		loadMoreDiv.append(loadMoreButtonDiv);
		loadMoreDiv.append("<input type='text' value='2' id='provenance_loadMoreAmountInput'/> more weeks");
		resultDiv.append(loadMoreDiv);
		
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
		
		var loadAllInTreeDiv=$("<div id='provenance_loadAllInTreeDiv' class='provenance_button'>show all changes in tree</div>");
		resultDiv.append(loadAllInTreeDiv);
		loadAllInTreeDiv.click(function(){
			var changes=getChangesByWhatIsLoaded();
			showAtomicChangesInTree(changes, "all");							
		});
		
		return resultDiv;
	}
	
	var AtomicChange = (function(subject,predicate,lang,oldobject,newobject,date){
		var subject = subject;
		var predicate = predicate;
		var lang = lang;
		var oldobject = oldobject;
		var newobject = newobject;
		var date = date;
		
		var getSubject = function(){return subject }
		var getPredicate = function(){return predicate }
		var getLang = function(){return lang }
		var getOldobject = function(){return oldobject }
		var getNewobject = function(){return newobject }
		
		var getTooltipRow = function(){
			var tooltipRow = "<tr><td>"+subject+"</td><td>"+predicate+" " +lang+"</td><td>"+oldobject+"</td><td>"+newobject+"</td></tr>";
			tooltipRow = tooltipRow.replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");//.replace(new RegExp("“", "g"),"&#34;").replace(new RegExp("”", "g"),"&#34;");
			tooltipRow = Helper.getReadableString(tooltipRow);	
			return tooltipRow;
		}
		
		var getConceptTreeDescriptionRowForCommit = function(){
			var tooltipRow = "<tr><td>"+predicate+" " +lang+"</td><td>"+oldobject+"</td><td>"+newobject+"</td></tr>";
			tooltipRow = tooltipRow.replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");//.replace(new RegExp("“", "g"),"&#34;").replace(new RegExp("”", "g"),"&#34;");
			tooltipRow = Helper.getReadableString(tooltipRow);	
			return tooltipRow;			
		}
		
		var getConceptTreeDescriptionRowForDay = function(){
			var tooltipRow = "<tr><td>"+date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit', second: '2-digit'})+"</td><td>"+predicate+" " +lang+"</td><td>"+oldobject+"</td><td>"+newobject+"</td></tr>";
			tooltipRow = tooltipRow.replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");//.replace(new RegExp("“", "g"),"&#34;").replace(new RegExp("”", "g"),"&#34;");
			tooltipRow = Helper.getReadableString(tooltipRow);	
			return tooltipRow;			
		}
		
		var getConceptTreeDescriptionRowForWholeTime = function(){
			var tooltipRow = "<tr><td>"+date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'})+"</td><td>"+predicate+" " +lang+"</td><td>"+oldobject+"</td><td>"+newobject+"</td></tr>";
			tooltipRow = tooltipRow.replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");//.replace(new RegExp("“", "g"),"&#34;").replace(new RegExp("”", "g"),"&#34;");
			tooltipRow = Helper.getReadableString(tooltipRow);	
			return tooltipRow;			
		}
		
		return {
			getTooltipRow: getTooltipRow,
			getConceptTreeDescriptionRowForDay: getConceptTreeDescriptionRowForDay,
			getConceptTreeDescriptionRowForCommit: getConceptTreeDescriptionRowForCommit,
			getConceptTreeDescriptionRowForWholeTime: getConceptTreeDescriptionRowForWholeTime,
			getSubject: getSubject,
			getPredicate: getPredicate,
			getLang: getLang,
			getOldobject: getOldobject,
			getNewobject: getNewobject
		}
	});
	
	var Category = (function(type){
		var tooltip = $("<div><table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr></table><div>");
		var domObject = $("<div class='provenance_bar_cell "+type+"' style='display:none' tooltip=''>");
		
		var getDomObject = function(){
			return domObject;
		}
		
		var changesBySubject = {};
		
		var append = function(subject_id,subject,predicate,lang,oldobject,newobject,date){
			if (!changesBySubject[subject_id]) changesBySubject[subject_id] = [];
			var ac = new AtomicChange(subject,predicate,lang,oldobject,newobject,date);
			changesBySubject[subject_id].push(ac);
			tooltip.children("table").append(ac.getTooltipRow());
			domObject.attr("tooltip",tooltip.html());
			domObject.css("display","block").css("width","+=5");
			domObject.data("changesBySubject",changesBySubject);
		}
		
		var getChangesBySubject = function(){
			return changesBySubject;
		}
		
		return {
			getDomObject: getDomObject,
			append: append,
			getChangesBySubject: getChangesBySubject
		}
	});
	
	var Categories = (function(){		
		var getNewCategories = function()
		{
			return {
				literal: new Category("literal"),
				structure: new Category("structure"),
				progress: new Category("progress"),
				semantic: new Category("semantic")			
			};
		}
		
		var getCategoryByPredicate = function(c, predicate){
			var cat = undefined;
			switch (predicate)
			{
				case "http://www.w3.org/2004/02/skos/core#prefLabel":
				case "http://www.w3.org/2004/02/skos/core#altLabel":
				case "http://purl.org/dc/elements/1.1/description":
					cat = c.literal;
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
					cat = c.structure;
					break;
				case "http://data.dzl.de/ont/dwh#unit":
				case "http://www.w3.org/2004/02/skos/core#notation":
					cat = c.semantic;
					break;
				case "http://www.w3.org/2004/02/skos/core#editorialNote":
				case "http://data.dzl.de/ont/dwh#status":
				case "http://sekmi.de/histream/dwh#restriction":
					cat = c.progress;
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
					console.log("Predicate "+predicate+" not configured!");
					return;
					break;
			}
			return cat;
		}
		
		return {
			getNewCategories: getNewCategories,
			getCategoryByPredicate: getCategoryByPredicate
		}
	}());
	
	var Commit = (function(commit_id, author, message, enddate){
		var commit_id = commit_id;
		var author = author;
		var message = message;
		var date = enddate;
		
		var domObject = $("<div class='provenance_bar_commit_cell' id='"+commit_id+"'>");
		
		var cats = Categories.getNewCategories();
		$.each(cats,function(key, cat){
			domObject.append(cat.getDomObject());
		});
		
		var loadDetails = function (){
			return QueryManager.getProvenanceDetails(commit_id, function(r){
				if (r["predicate"] == undefined) return ;
				var cat = Categories.getCategoryByPredicate(cats,r["predicate"].value);
				if (cat == undefined) return;
				var subject = r["sl"]?r["sl"].value:r["subject"]?r["subject"].value:"";
				var predicate = r["predicate"]?r["predicate"].value:"";
				var oldobject = r["ool"]?r["ool"].value:r["oldobject"]?r["oldobject"].value:"";
				var newobject = r["nol"]?r["nol"].value:r["newobject"]?r["newobject"].value:"";
				var lang = r["oldobject"]&&r["oldobject"]["xml:lang"]?r["oldobject"]["xml:lang"]:r["newobject"]&&r["newobject"]["xml:lang"]?r["newobject"]["xml:lang"]:"";
				
				domObject.addClass("with_content");
				
				cat.append(r["subject"].value,subject,predicate,lang,oldobject,newobject,date);			
			});
		}
		
		var getCategories = function(){
			return cats;
		}
		
		var getDomObject = function(){
			return domObject;
		}
		
		var shortDate = function(){
			return date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
		}
		
		return {
			getDomObject: getDomObject,
			shortDate: shortDate,
			commit_id: commit_id,
			getCategories: getCategories,
			loadDetails: loadDetails
		}
	});
	
	var Commits = (function(){
		var c = [];
		
		var put = function(commit_id, author, message, enddate){
			if (!c[commit_id])
				c[commit_id] = new Commit(commit_id, author, message, enddate);
			return get(commit_id);
		}
		var get = function(commit_id){
			return c[commit_id];
		}
		
		return {
			get: get,
			put: put
		}
	})();
	
	var Day = (function(id, shortDateString){
		var id = id;
		var commits = [];
		
		var barDomObject;		
		var dateDomObject;
		
		var getId = function(){
			return id;
		}
		
		var getBarDomObject = function(){
			return barDomObject;
		}
		
		var getDateDomObject = function(){
			return dateDomObject;
		}
		
		var getDayLineDomObject = function(){
			return $("#dayLine_"+id);
		}

		var putCommit = function(commit){		

			if ($.inArray(commit, commits)==-1) {
				commits.push(commit);
			}
		}
		
		var renderDomObjects = function(){	
			var dayLine = getDayLineDomObject();
			if ($("#date_"+id).length==0){
				dateDomObject = $("<div class='provenance_bar_row_date' id='date_"+id+"'>"+shortDateString+"</div>");
				if (id.substr(2,2)%2 == 0) dateDomObject.addClass("odd");	
				$("#provenance_date_column").append(dateDomObject);
			}
			
			if ($("#bar_"+id).length == 0){
				barDomObject = $("<div class='provenance_bar_row' id='bar_"+id+"'></div>");
				dayLine.append(barDomObject);
			}	
			
			for (var i = 0; i < commits.length; i++){
				var commit = commits[i];
				var domo = commit.getDomObject();
				if (barDomObject.children("#"+commit.commit_id).length == 0){
					barDomObject.append(domo);
				}
				if (domo.hasClass("with_content")){
					dayLine.addClass("with_content");
					dateDomObject.css("display","block").css("top",dayLine.position().top);
				}
			}		
		}
		
		var getCommits = function(){
			return commits;
		}
		
		return {
			getBarDomObject: getBarDomObject,
			getDateDomObject: getDateDomObject,
			getDayLineDomObject: getDayLineDomObject,
			renderDomObjects: renderDomObjects,
			putCommit: putCommit,
			getCommits: getCommits,
			getId: getId
		}
	});
	
	var Days = (function(){
		var d = {};
		
		var put = function(shortDateString){
			var id = shortDateString.replace(/\./g,'');
			if (!d[id])
				d[id] = new Day(id, shortDateString);
		}
		var get = function(shortDateString){
			var id = shortDateString.replace(/\./g,'');
			if (!d[id]) put(shortDateString);
			return d[id];
		}
		var getAll = function(){
			return d;
		}
		
		return {
			get: get,
			put: put,
			getAll: getAll
		}		
	}());
	
	return {
		init: init
	}
}());
$(document).on("cometar:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") ProvenanceModule.init();
});