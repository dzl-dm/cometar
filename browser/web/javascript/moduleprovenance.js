ProvenanceModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "provenance (test)",
			handlerFunction: getProvenanceDiv	
		});
	}
	
	var fromDate = new Date(Date.now());
	var resultDiv;
	
	var assignClickEvents = function(){
		Configuration.Provenance.Display.LoadMoreButton().click(function(){
			var amount = Configuration.Provenance.Display.LoadMoreAmount().val();
			loadMore(amount);
		});
		Configuration.Provenance.Display.LoadAllButton.click(function(){
			var result = Provenance.getTreeDescriptions("all",Provenance.atomicChanges);
			TreeManager.openSelectMark({
				IRIs: result.subjects,
				markMapping: true,
				descriptions: result.descriptions,
				openPaths: result.subjects.length < 100,
				growWidth: true
			});			
		});
		$.each(Provenance.commits,function(key,commit){
			assignCommitClickFunction(commit);
		});
		$.each(Provenance.days,function(key,day){
			assignDayClickFunction(day);
		});
	}
	var assignCommitClickFunction = function(commit){
		if (commit.visualRepresentation) {
			commit.visualRepresentation.click(function(){
				var result = Provenance.getTreeDescriptions("commit",commit.atomicChanges);
				TreeManager.openSelectMark({
					IRIs: result.subjects,
					markMapping: true,
					descriptions: result.descriptions,
					openPaths: true,
					growWidth: true
				});			
			});
		}
	}
	var assignDayClickFunction = function(day){
		day.visualRepresentation.DateDiv.click(function(){
			var result = Provenance.getTreeDescriptions("day",day.atomicChanges);
			TreeManager.openSelectMark({
				IRIs: result.subjects,
				markMapping: true,
				descriptions: result.descriptions,
				openPaths: true,
				growWidth: true
			});			
		});
	}
	var loadMore = function(amount){
		fromDate.setHours(fromDate.getHours()-(amount*7*24));
		Provenance.loadOverview({
			fromDate: fromDate,
			assignCommitClickFunction: assignCommitClickFunction,
			assignDayClickFunction: assignDayClickFunction
		}).then(function(){
			Configuration.Provenance.Display.ChangesColumn.html(Provenance.getDaylinesVisualization());
			Provenance.loadDetails();
		});
	}
	var getProvenanceDiv = function(conceptIri){
		if (!resultDiv) {
			resultDiv = Configuration.Provenance.Display.Module();
			loadMore(4);
		}
		assignClickEvents();
		Configuration.Provenance.Display.Provenance.makeItScrollable();
		return resultDiv;
	}
	
	/*var getProvenanceDiv2 = function(conceptIri){
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
					//return;					
				}
				var description = Configuration.display.provenance.tree.table.header[type];	
				for (var i = 0; i < atomicChanges.length; i++){
					var p = atomicChanges[i].getPredicate();
					var s = atomicChanges[i].getSubject();
					var ooid = atomicChanges[i].getOldobjectId();
					var no = atomicChanges[i].getNewobject();
					var date = atomicChanges[i].getDate();
					if ((p == "http://www.w3.org/2004/02/skos/core#broader" || p == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf")
						&& ooid != "" && no != ""){
							subjects.push(ooid);
							descriptions.push("<div class='treeDescriptionItemMoved'>"+date+": "+s + " moved to " + no + ".</div>");
					}
					if (p == "http://www.w3.org/2004/02/skos/core#broader"
						&& ooid != "" && no == ""){
							subjects.push(ooid);
							descriptions.push("<div class='treeDescriptionItemMoved'>"+date+": "+s + " has been removed.</div>");
							console.log(date+": "+s + " has been removed from " + ooid + ".")
					}
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
				subjects.push(key);
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
				//$(".provenance_bar_cell:not(."+highlightClass+")").toggleClass("hidden");				
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
	
	var AtomicChange = (function(subject,subjectid,predicate,lang,oldobject,oldobjectid,newobject,newobjectid,date){
		var subject = subject;
		var subjectid = subjectid;
		var predicate = predicate;
		var lang = lang;
		var oldobject = oldobject;
		var oldobjectid = oldobjectid;
		var newobject = newobject;
		var newobjectid = newobjectid;
		var date = date;
		
		var getSubject = function(){return subject }
		var getSubjectId = function(){return subjectid }
		var getPredicate = function(){return predicate }
		var getLang = function(){return lang }
		var getOldobject = function(){return oldobject }
		var getOldobjectId = function(){return oldobjectid }
		var getNewobject = function(){return newobject }
		var getNewobjectId = function(){return newobjectid }
		var getDate = function(){return date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'}) }
		
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
			getSubjectId: getSubjectId,
			getPredicate: getPredicate,
			getLang: getLang,
			getDate: getDate,
			getOldobject: getOldobject,
			getOldobjectId: getOldobjectId,
			getNewobject: getNewobject,
			getNewobjectId: getNewobjectId
		}
	});
	
	var Category = (function(type){
		var tooltip = $("<div><table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr></table><div>");
		var domObject = $("<div class='provenance_bar_cell "+type+"' style='display:none' tooltip=''>");
		
		var getDomObject = function(){
			return domObject;
		}
		
		var changesBySubject = {};
		
		var append = function(subject,subjectid,predicate,lang,oldobject,oldobjectid,newobject,newobjectid,date){
			if (!changesBySubject[subjectid]) changesBySubject[subjectid] = [];
			var ac = new AtomicChange(subject,subjectid,predicate,lang,oldobject,oldobjectid,newobject,newobjectid,date);
			changesBySubject[subjectid].push(ac);
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
				var oldobjectid = r["oldobject"]?r["oldobject"].value:"";
				var oldobject = r["ool"]?r["ool"].value:oldobjectid;
				var newobjectid = r["newobject"]?r["newobject"].value:"";
				var newobject = r["nol"]?r["nol"].value:newobjectid;
				var lang = r["oldobject"]&&r["oldobject"]["xml:lang"]?r["oldobject"]["xml:lang"]:r["newobject"]&&r["newobject"]["xml:lang"]?r["newobject"]["xml:lang"]:"";
				
				domObject.addClass("with_content");
				
				cat.append(subject,r["subject"].value,predicate,lang,oldobject,oldobjectid,newobject,newobjectid,date);			
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
	}());*/
	
	return {
		init: init
	}
}());
$(document).on("cometar:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") ProvenanceModule.init();
});

var Provenance = (function(){
	var commits = {};
	var days = {};
	var atomicChanges = {};
	
	var selectObject = {
		fromDate: new Date("2016-01-1"),
		untilDate: new Date(Date.now()),
		commits: [],
		days: []
	}
	var setSelection = function(s){
		$.extend(selectObject, s)
	}
	
	return {
		commits: commits,
		days: days,
		atomicChanges: atomicChanges,
		setSelection: setSelection,
		loadOverview: function(options){
			if (options.untilDate) setSelection({untilDate: options.untilDate});
			if (options.fromDate) setSelection({fromDate: options.fromDate});
			return QueryManager.getProvenanceOverview(selectObject.fromDate, selectObject.untilDate, function(r){
				//collect information from commit
				var commit_id = r["commit"].value.replace("http://data.dzl.de/ont/dwh#commit_","");
				/*var commit_messages = QueryManager.getPreviousMessagesOfInvalidCommits(commit_id);
				commit_messages.push(r["message"].value);*/
				commit_message = r["message"].value;/*commit_messages.join(" THEN ").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");*/
				var author = r["author"].value.replace("http://data.dzl.de/ont/dwh#","").replace(new RegExp("'", "g"),"&#39;").replace(new RegExp("\"", "g"),"&#34;");
				var end = new Date(r["enddate"].value);
				var shortDate = end.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});				
				//create day
				if (!days[shortDate]) {
					days[shortDate]={ 
						commits: {},
						dateString: shortDate
					};
					days[shortDate].dateString = shortDate;
					days[shortDate].visualRepresentation=Configuration.Provenance.Display.Day(days[shortDate]);
					options.assignDayClickFunction(days[shortDate]);
				}
				//create commit
				if (commits[commit_id])return;
				commits[commit_id]={
					id: commit_id,
					message: commit_message,
					author: author,
					date: end,
					day: days[shortDate],
					loadingStatus: $.Deferred()
				};
				days[shortDate].commits[commit_id] = commits[commit_id];

				commits[commit_id].loadingStatus.then(function(){
					commits[commit_id].visualRepresentation = Configuration.Provenance.Display.Commit(commits[commit_id]);
					options.assignCommitClickFunction(commits[commit_id]);
				});
			});
		},
		loadDetails: function(callback){
			$.each(commits, function(id, commit){
				commit.loadingStatus.promise();
				QueryManager.getProvenanceDetails(id, function(r){
					//collect information from commit
					if (r["predicate"] == undefined) return ;
					var category = Configuration.Provenance.CategoryMappings[r["predicate"].value];
					if (category == {}) return;					
					var subjectid = r["subject"]?r["subject"].value:"";
					var predicateid = r["predicate"].value;
					var shortDate = commit.date.toUTCString();
					var lang = r["oldobject"]&&r["oldobject"]["xml:lang"]?r["oldobject"]["xml:lang"]:r["newobject"]&&r["newobject"]["xml:lang"]?r["newobject"]["xml:lang"]:"";
					//create atomic change
					var atomicChange = {
						subjectid: subjectid,
						subject: r["sl"]?r["sl"].value:r["subject"]?r["subject"].value:"",
						predicateid: predicateid,
						predicate: Configuration.Display.iriToHumanReadable[predicateid],
						oldobjectid: r["oldobject"]?r["oldobject"].value:"",
						oldobject: function(){
							var result = r["ool"]?r["ool"].value:r["oldobject"]?r["oldobject"].value:"";
							return Configuration.Display.iriToHumanReadable[result] || result;
						}(),
						newobjectid: r["newobject"]?r["newobject"].value:"",
						newobject: function(){
							var result = r["nol"]?r["nol"].value:r["newobject"]?r["newobject"].value:"";
							return Configuration.Display.iriToHumanReadable[result] || result;
						}(),
						lang: lang,
						category: category,
						commit: commit
					};					
					var acid = shortDate+subjectid+predicateid+lang;
					//merge old and new values in one atomic change
					if (atomicChanges[acid]){
						if (atomicChanges[acid].newobject == "") atomicChanges[acid].newobject = atomicChange.newobject;
						if (atomicChanges[acid].newobjectid == "") atomicChanges[acid].newobjectid = atomicChange.newobjectid;
						if (atomicChanges[acid].oldobject == "") atomicChanges[acid].oldobject = atomicChange.oldobject;
						if (atomicChanges[acid].oldobjectid == "") atomicChanges[acid].oldobjectid = atomicChange.oldobjectid;					
					}						
					else atomicChanges[acid] = atomicChange;
					if (!commit.atomicChanges)commit.atomicChanges={};
					commit.atomicChanges[acid] = atomicChanges[acid];	
					if (!commit.day.atomicChanges)commit.day.atomicChanges={};
					commit.day.atomicChanges[acid] = atomicChanges[acid];	
					atomicChanges[acid].visualRepresentation = Configuration.Provenance.Display.AtomicChange(atomicChanges[acid]);
				},callback).then(commit.loadingStatus.resolve);
			});
		},
		getDaylinesVisualization: function(){
			var vis = $("<div>");
			for (var date = new Date(selectObject.untilDate); date >= selectObject.fromDate; date.setHours(date.getHours() - 24)){
				var shortDate = date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
				var day = days[shortDate];
				var dayLine = Configuration.Provenance.Display.Day(day||{dateString:shortDate}).DayLineDiv;
				vis.append(dayLine);
			}		
			return vis.children();
		},
		getTreeDescriptions: function(interval, acs){
			var subjects = [];
			var descriptions = [];
			$.each(acs,function(key, atomicChange){
				var vis = Configuration.Provenance.Display.TreeDescription(interval,atomicChange,acs);
				if (Object.keys(vis).length > 0){
					var index = subjects.indexOf(vis.changeSubject);
					if (index==-1)index = subjects.length;
					subjects[index] = vis.changeSubject;
					if (descriptions[index] == undefined){
						descriptions[index] = $("<div>");
					}
					if (descriptions[index].find("tr").length > 0 && vis.domObject.find("tr").length > 0){
						descriptions[index].find("table").append(vis.domObject.children("tr"));
					}
					else descriptions[index].append(vis.domObject);
				}
			});
			return {
				subjects: subjects,
				descriptions: descriptions
			}
		}
	}
}());

var Configuration = Configuration || {};
Configuration.Provenance = {
	Categories: {
		literal: "literal",
		structure: "structure",
		semantic: "semantic",
		progress: "progress"
	}
}
$.extend(Configuration.Provenance,{
	CategoryMappings: {
		"http://www.w3.org/2004/02/skos/core#prefLabel": Configuration.Provenance.Categories.literal,
		"http://www.w3.org/2004/02/skos/core#altLabel": Configuration.Provenance.Categories.literal,
		"http://purl.org/dc/elements/1.1/description": Configuration.Provenance.Categories.literal,
		
		"http://www.w3.org/2004/02/skos/core#narrower": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/2004/02/skos/core#broader": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/2004/02/skos/core#hasTopConcept": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/2004/02/skos/core#topConceptOf": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/2004/02/skos/core#member": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#type": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#about": Configuration.Provenance.Categories.structure,
		"http://data.dzl.de/ont/dwh#topLevelNode": Configuration.Provenance.Categories.structure,
		"http://www.w3.org/ns/prov#wasDerivedFrom": Configuration.Provenance.Categories.structure,
		
		"http://data.dzl.de/ont/dwh#unit": Configuration.Provenance.Categories.semantic,
		"http://www.w3.org/2004/02/skos/core#notation": Configuration.Provenance.Categories.semantic,
		
		"http://www.w3.org/2004/02/skos/core#editorialNote": Configuration.Provenance.Categories.progress,
		"http://data.dzl.de/ont/dwh#status": Configuration.Provenance.Categories.progress,
		"http://sekmi.de/histream/dwh#restriction": Configuration.Provenance.Categories.progress,
		
		"http://purl.org/dc/elements/1.1/creator": undefined,
		"http://www.w3.org/2004/02/skos/core#description": undefined,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#isPartOf": undefined,
		"http://www.w3.org/2004/02/skos/core#inScheme": undefined,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#broader": undefined,
		"http://www.w3.org/2004/02/skos/core#prefLAbel": undefined,
		"http://purl.org/dc/elements/1.1/descriptions": undefined,
		"http://www.w3.org/2002/07/owl#onProperty": undefined,
		"http://www.w3.org/2002/07/owl#allValuesFrom": undefined
	},
	ChangeSelection: {
		Removal: "This option applies to changes that should not appear in the result.",
		Keep: "This option applies to changes that should appear in the result.",
		Minimization: function(changeObject, compareObject){
			if (changeObject.predicateid == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
				|| changeObject.predicateid == "http://www.w3.org/ns/prov#wasDerivedFrom")
				return Configuration.Provenance.ChangeSelection.Removal;
			return Configuration.Provenance.ChangeSelection.Keep;
		}
	},
	Display: {
		TreeDescriptionTable:"<table class='treeDescriptionTable'><thead><tr><th>Property</th><th>Old Value</th><th>New Value</th></tr></thead></table>",
		TreeDescriptionTimeTable:"<table class='treeDescriptionTable'><thead><tr><th>Time</th><th>Property</th><th>Old Value</th><th>New Value</th></tr></thead></table>",
		TreeDescriptionDateTable:"<table class='treeDescriptionTable'><thead><tr><th>Date</th><th>Property</th><th>Old Value</th><th>New Value</th></tr></thead></table>",
		TreeDescription: function(interval, changeObject, changeObjects){
			if (changeObject.predicateid == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
				|| changeObject.predicateid == "http://www.w3.org/ns/prov#wasDerivedFrom")
				return {};
			var check = true;
			$.each(changeObjects,function(key,changeObject2){
				if (changeObject2 == changeObject) return true;
				if (changeObject.subjectid == changeObject2.subjectid
					&& changeObject.predicateid == changeObject2.predicateid
					&& (changeObject.oldobjectid == changeObject2.newobjectid
						|| changeObject.newobjectid == changeObject2.oldobjectid)
				){
					check = false;
					return false;
				}
			});
			if (!check) return {};
			if ((changeObject.predicateid == "http://www.w3.org/2004/02/skos/core#broader" || changeObject.predicateid == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf")
				&& changeObject.oldobjectid != "" && changeObject.newobjectid != ""){
					return {
						changeSubject: changeObject.oldobjectid,
						domObject: $("<div class='treeDescriptionItemMoved'>"+changeObject.commit.date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'})+": "+changeObject.subject + " moved to " + changeObject.newobject + ".</div>")
					}
			}
			if ((changeObject.predicateid == "http://www.w3.org/2004/02/skos/core#broader" || changeObject.predicateid == "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf")
				&& changeObject.oldobjectid != "" && changeObject.newobjectid == ""){
					console.log(changeObject.oldobjectid);
					return {
						changeSubject: changeObject.oldobjectid,
						domObject: $("<div class='treeDescriptionItemMoved'>"+changeObject.commit.date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'})+": "+changeObject.subject + " has been removed.</div>")
					}
			}
			switch (interval){
				case "commit":
					return {
						changeSubject: changeObject.subjectid,
						domObject: $(Configuration.Provenance.Display.TreeDescriptionTable).append(changeObject.visualRepresentation.TreeDescriptionRow)
					}
					break;
				case "day":
					return {
						changeSubject: changeObject.subjectid,
						domObject: $(Configuration.Provenance.Display.TreeDescriptionTimeTable).append(changeObject.visualRepresentation.TreeDescriptionTimeRow)
					}
					break;
				case "all":
				default:
					return {
						changeSubject: changeObject.subjectid,
						domObject: $(Configuration.Provenance.Display.TreeDescriptionDateTable).append(changeObject.visualRepresentation.TreeDescriptionDateRow)
					}
					break;
			}			
		},
		Commit: function(commit){
			var domObject = $("<div class='provenance_bar_commit_cell' id='"+commit.id+"'>");
			//create sub categories
			Configuration.Provenance.Display.Categories(function(categoryDomObject){
				domObject.append(categoryDomObject);
				cdo.data("tooltip", Configuration.Provenance.Display.Tooltip());
			});
			//fill categories with changes
			$.each(commit.atomicChanges,function(key,atomicChange){
				if (!atomicChange.category){ console.log("No category for predicate "+atomicChange.predicate+"!"); return true; }
				this.commit.day.visualRepresentation.DayLineDiv.addClass("with_content");
				this.commit.day.visualRepresentation.BarDiv.append(domObject);
				Configuration.Provenance.Display.DateColumn.append(this.commit.day.visualRepresentation.DateDiv);
				domObject
					.addClass("with_content")
					.children("."+atomicChange.category)
					.css("display","block")
					.css("width","+=5")
					.data("tooltip")
					.children("table")
					.append(atomicChange.visualRepresentation.TooltipRow);
			});
			//assign tooltip
			domObject.children(".provenance_bar_cell").each(function(){
				$(this).attr("tooltip", $(this).data("tooltip").html());
			});
			return domObject;
		},
		Categories: function(callback){
			$.each(Configuration.Provenance.Categories, function(key,value){
				cdo = $("<div class='provenance_bar_cell "+key+"' category='"+key+"'>");
				callback(cdo);
			});
		},
		Day: function(day) {
			if (day.visualRepresentation) return day.visualRepresentation;
			var dateDiv = $("<div class='provenance_bar_row_date' id='date_"+day.dateString+"'>"+day.dateString+"</div>");
			var barDiv = $("<div class='provenance_bar_row' id='bar_"+day.dateString+"'></div>");			
			var daylineDiv = $("<div class='dayLine' id='dayLine_"+day.dateString+"'>").append(barDiv);
			
			var observer = new MutationObserver(function(mutations) {
				$.each(Provenance.days,function(key, day){
					day.visualRepresentation.DateDiv.css("top",day.visualRepresentation.DayLineDiv.position().top);
				});
			});			
			observer.observe(daylineDiv[0], { 
				attributes: true, 
				attributeFilter: ['class'] 
			});
			
			return {
				DateDiv: dateDiv,
				BarDiv: barDiv,
				DayLineDiv: daylineDiv
			}
		},
		AtomicChange: function(ac){ 
			return {
				TooltipRow: $("<tr><td>"+ac.subject+"</td><td>"+ac.predicate+" " +ac.lang+"</td><td>"+ac.oldobject+"</td><td>"+ac.newobject+"</td></tr>"),
				TreeDescriptionRow: $("<tr><td>"+ac.predicate+" " +ac.lang+"</td><td>"+ac.oldobject+"</td><td>"+ac.newobject+"</td></tr>"),
				TreeDescriptionTimeRow: $("<tr><td>"+ac.commit.date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit', second: '2-digit'})+"</td><td>"+ac.predicate+" " +ac.lang+"</td><td>"+ac.oldobject+"</td><td>"+ac.newobject+"</td></tr>"),
				TreeDescriptionDateRow:$("<tr><td>"+ac.commit.date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'})+"</td><td>"+ac.predicate+" " +ac.lang+"</td><td>"+ac.oldobject+"</td><td>"+ac.newobject+"</td></tr>")	
			}
		},
		Tooltip: function(){
			return $("<div><table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr></table><div>");
		},
		Legend: function(){
			var domObject = $("<div id='provenance_legendDiv' class='provenance_bar_commit_cell'>");
			Configuration.Provenance.Display.Categories(function(categoryDomObject){
				domObject.append(categoryDomObject);
				var category = categoryDomObject.attr("category");
				categoryDomObject.text(category);
				categoryDomObject.hover(function(){
					$(".provenance_bar_cell."+category).addClass("highlight");
					$(".provenance_bar_cell:not(."+category+")").addClass("nonhighlight");
				},function(){
					$(".provenance_bar_cell."+category).removeClass("highlight");
					$(".provenance_bar_cell:not(."+category+")").removeClass("nonhighlight");
				});
				categoryDomObject.click(function(){
					if (domObject.children(".hidden").length > 0 && !$(this).hasClass("hidden")) {
						$(".provenance_bar_cell.hidden").removeClass("hidden");						
					} else {
						$(".provenance_bar_cell."+category).removeClass("hidden");
						$(".provenance_bar_cell:not(."+category+")").addClass("hidden");		
					}
				});
			});		
			return domObject;
		},
		LoadMoreDiv: $("<div id='provenance_loadMoreDiv'><div id='provenance_loadMoreButtonDiv' class='provenance_button'>load</div> <input type='text' value='2' id='provenance_loadMoreAmountInput'/> more weeks</div>"),
		LoadMoreButton: function(){
			return Configuration.Provenance.Display.LoadMoreDiv.children("#provenance_loadMoreButtonDiv");
		},
		LoadMoreAmount: function(){
			return Configuration.Provenance.Display.LoadMoreDiv.children("#provenance_loadMoreAmountInput");
		},
		LoadAllButton: $("<div id='provenance_loadAllInTreeDiv' class='provenance_button'>show all changes in tree</div>"),
		DateColumn: $("<div id='provenance_date_column'>"),
		ChangesColumn: $("<div id='provenance_changes_column'>"),
		Provenance: function() {
			var domObject;
			var getDomObject = function(){
				domObject = $("<div id='provenance_div'>");
				domObject.append(Configuration.Provenance.Display.ChangesColumn);
				return domObject;
			}
			return {
				getDomObject: getDomObject,
				makeItScrollable: function(){	
					var domo = domObject || getDomObject();
					domo.scroll(function(){
						var st = $(this).scrollTop();
						Configuration.Provenance.Display.DateColumn.children().css("marginTop",(st*(-1)+3)+"px");
					});	
					return domo;
				}
			}
		}(),
		Module: function(){
			var domObject = $("<div style='position:relative;height:100%;display:flex;flex-direction:row'>");
			domObject.append(Configuration.Provenance.Display.DateColumn);
			domObject.append(Configuration.Provenance.Display.Provenance.makeItScrollable());
			domObject.append(Configuration.Provenance.Display.Legend);
			domObject.append(Configuration.Provenance.Display.LoadMoreDiv);
			domObject.append(Configuration.Provenance.Display.LoadAllButton);
			return domObject;
		}
	}
});