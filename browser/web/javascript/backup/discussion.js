TreeManager.discussion = function(container)
{
	DiscussionManager.init(container);
	return this;
}

var DiscussionManager = (function(){
	var container;
	
	var init = function(c)
	{
		container = c;
		c.html(
			"<div id='infoDiv'> \
				<h3>Discussion</h3> \
				<div id='discussionConceptCode'/> \
				<div>Ich finde alle Codes sollten mit dem Begriff 'Einhorn' anfangen.</div> \
			</div>"
		);
		TreeManager.subscribeCreateTreeItem(onTreeItemCreate);
	}
	
	var onTreeItemCreate = function(treeItemDiv)
	{
		var discussionDiv = $("<div>");
		discussionDiv.html("Disc")
			.addClass("detailsButton")
			.addClass("discussionButton")
			.click(function(e){
				e.stopPropagation();
				loadDiscussion(treeItemDiv);
				$("div.currentDetailsSource").removeClass("currentDetailsSource");
				$(this).parent().addClass("currentDetailsSource");
			});
		treeItemDiv.append(discussionDiv);		
	}
	
	var loadDiscussion = function(treeItemDiv)
	{
		$("#discussionConceptCode").html(treeItemDiv.attr("data-concepturl"));
	}
	
	return {
		init:init
	}
}());