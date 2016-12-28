ModuleManager.register([
	{
		tabName: "discussion",
		handlerFunction: function(conceptUrl){
			var discussionPostsContainerDiv = $("<div id='discussionPostsContainerDiv'>");
			var addDiscussionPostDiv = createAddPostDiv();
			discussionPostsContainerDiv.append(addDiscussionPostDiv);
			var discussionPostDiv = createPostDiv("There might be an issue.");
			discussionPostsContainerDiv.append(discussionPostDiv);

			return discussionPostsContainerDiv;
		}
	}
]);

var createPostDiv = function(title)
{
	var discussionPostDiv = $("<div class='discussionPostDiv'>");
	var addDiscussionPostDiv = createAddPostDiv();
	var discussionPostTitleDiv = $("<div class='discussionPostTitleDiv'>");
	var discussionPostDateCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostAuthorCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostDateLastModDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostAuthorLastModDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostInfoDiv = $("<div class='discussionPostInfoDiv'>");
	discussionPostTitleDiv.html("<div>"+title+"</div>");
	discussionPostDateCreationDiv.html("creation: 2016-11-30");
	discussionPostAuthorCreationDiv.html("by author: creator");
	discussionPostDateLastModDiv.html("last edit: 2016-12-01");
	discussionPostAuthorLastModDiv.html("by author: solver");
	discussionPostInfoDiv.append(discussionPostDateCreationDiv);
	discussionPostInfoDiv.append(discussionPostAuthorCreationDiv);
	discussionPostInfoDiv.append(discussionPostDateLastModDiv);
	discussionPostInfoDiv.append(discussionPostAuthorLastModDiv);
	discussionPostDiv.append(discussionPostInfoDiv);
	discussionPostDiv.append(discussionPostTitleDiv);
	discussionPostDiv.append(addDiscussionPostDiv);
	
	/*discussionPostTitleDiv.click(function(){
		var collapsed = $(this).parent().hasClass("collapsed");
		$(this).parent().parent().children(".discussionPostDiv").addClass("collapsed");
		if (collapsed) $(this).parent().removeClass("collapsed");
	});*/
	
	var discussionSubPostDiv = createPostReplyDiv("Let's solve it this way ...!");
	discussionPostDiv.append(discussionSubPostDiv);
	
	return discussionPostDiv;
}

var createPostReplyDiv = function(title)
{
	var discussionPostDiv = $("<div class='discussionSubPostDiv'>");
	var discussionPostTitleDiv = $("<div class='discussionPostTitleDiv'>");
	var discussionPostDateCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostAuthorCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostInfoDiv = $("<div class='discussionPostInfoDiv'>");
	discussionPostTitleDiv.html("<div>"+title+"</div>");
	discussionPostAuthorCreationDiv.html("by author: solver");
	discussionPostDateCreationDiv.html("creation: 2016-12-01");
	discussionPostInfoDiv.append(discussionPostDateCreationDiv);
	discussionPostInfoDiv.append(discussionPostAuthorCreationDiv);
	discussionPostDiv.append(discussionPostInfoDiv);
	discussionPostDiv.append(discussionPostTitleDiv);
	
	return discussionPostDiv;	
}

var createAddPostDiv = function()
{
	var addDiscussionPostDiv = $("<div class='addDiscussionPostDiv collapsed'><div tooltip='add new post' class='addDiscussionPostButtonDiv'>+</div></div>");
	addDiscussionPostDiv.click(function(){
		if ($(this).hasClass("collapsed"))
		{
			$(this).removeClass("collapsed").addClass("expanded");
			$(this).bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){ 
				$(this).append("<form class='addDiscussionPostForm'> \
					<table> \
						<tr><td align='right'><span class='discussionAuthorSpan'>Name: </span></td><td><input type='text' class='discussionAuthorInput'/></td></tr> \
						<tr><td align='right'><span class='discussionAuthorSpan'>Title: </span></td><td><input type='text' class='discussionAuthorInput'/></td></tr> \
						<tr><td align='right'><span class='discussionPostSpan'>Message: </span></td><td><textarea class='discussionPostInput' rows='7'></textarea></td></tr> \
						<tr><td colspan='2'><input type='button' value='Cancel'/><input type='button' value='Send'/></td></tr> \
					</table> \
				</form>");
			});
			$(this).children(".addDiscussionPostButtonDiv").html("");
		}
		$(this).removeClass("collapsed");
	});
	return addDiscussionPostDiv;
}