ProvenanceModule = (function(){
	var init = function(){
		ModuleManager.register({
			tabName: "provenance (test)",
			handlerFunction: getProvenanceDiv	
		});
	}
	
	var fromDate = new Date(Date.now());
	var resultDiv;
	
	var loadAllInTreeFunction = function(){
		var result = Provenance.getTreeDescriptions("all",Provenance.atomicChanges);
		TreeManager.openSelectMark({
			IRIs: result.subjects,
			markMapping: true,
			descriptions: result.descriptions,
			openPaths: result.subjects.length < 100,
			growWidth: true
		});	
	}
	
	var assignClickEvents = function(){
		Configuration.Provenance.Display.LoadMoreButton().click(function(){
			var amount = Configuration.Provenance.Display.LoadMoreAmount().val();
			loadMore(amount);
		});
		Configuration.Provenance.Display.LoadAllButton.click(loadAllInTreeFunction);
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
	
	return {
		init: init,
		loadAllInTreeFunction: loadAllInTreeFunction
	}
}());
$(document).on("cometar:readyForModuleRegister", function(){
	if (Helper.getQueryParameter("mode")=="advanced") ProvenanceModule.init();
	var commitids = Helper.getQueryParameter("provcommits");	
	if (commitids){	
		CB.loadQueries().then(function(){
			Provenance.loadByCommitsIds(commitids)
				.then(function(){
					Provenance.loadDetails().then(function(){
						ProvenanceModule.loadAllInTreeFunction();
					});
				});
		});
	}
	var provsince = Helper.getQueryParameter("provsince") && new Date(Helper.getQueryParameter("provsince"));	
	var provuntil = Helper.getQueryParameter("provuntil") && new Date(Helper.getQueryParameter("provuntil"));	
	if (provsince){	
		CB.loadQueries().then(function(){
			Provenance.loadOverview({
				fromDate: provsince,
				untilDate: provuntil || new Date(Date.now())
			}).then(function(){
					Provenance.loadDetails().then(function(){
						ProvenanceModule.loadAllInTreeFunction();
					});
				});
		});
	}
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
	var loadCommitMetaDataFromSPARQL = function(r,options){
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
			if (options && options.assignDayClickFunction)
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
			if (options && options.assignCommitClickFunction)
				options.assignCommitClickFunction(commits[commit_id]);
		});
	}
	
	return {
		commits: commits,
		days: days,
		atomicChanges: atomicChanges,
		setSelection: setSelection,
		loadByCommitsIds: function(commitids){
			return QueryManager.getProvenanceOverviewByCommitId(commitids, loadCommitMetaDataFromSPARQL);			
		},
		loadOverview: function(options){
			if (options.untilDate) setSelection({untilDate: options.untilDate});
			if (options.fromDate) setSelection({fromDate: options.fromDate});
			return QueryManager.getProvenanceOverview(selectObject.fromDate, selectObject.untilDate, function(r){
				loadCommitMetaDataFromSPARQL(r, options);
			});
		},
		loadDetails: function(callback){
			var dfd = $.Deferred();
			var processes = [];
			$.each(commits, function(id, commit){
				commit.loadingStatus.promise();
				processes.push(commit.loadingStatus);
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
			$.when.apply($,processes).then(dfd.resolve);
			return dfd;
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
				cdo.data("tooltip", Configuration.Provenance.Display.Tooltip(commit.id));
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
		Tooltip: function(commitid){
			return $("<div>"+commitid+"<br><table><tr><th>Concept</th><th>Attribute</th><th>Old Value</th><th>New Value</th></tr></table><div>");
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