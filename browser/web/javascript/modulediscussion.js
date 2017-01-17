ModuleManager.register([
	{
		tabName: "discussion",
		handlerFunction: function(conceptUri){
			var discussionPostsContainerDiv = $("<div id='discussionPostsContainerDiv'>");
			discussionPostsContainerDiv.append(
				createAddPostDiv(discussionBackendRootUrl+encodeURIComponent(conceptUri)+"/thread",true)
			);
			
			var threads = getDiscussionInfo(discussionBackendRootUrl+encodeURIComponent(conceptUri)+"/thread");
			jQuery.each(threads, function(){
				var thread = this;
				var posts = getDiscussionInfo(discussionBackendRootUrl+"thread/"+thread["id"]+"/post");	
				var firstPostDiv;
				jQuery.each(posts, function(){
					var post = this;
					if (firstPostDiv == undefined) {
						firstPostDiv = createPostDiv(post["username"], post["date_create"], post["message"]);
						firstPostDiv.append(
							createAddPostDiv(discussionBackendRootUrl+"thread/"+thread["id"]+"/post",false)
						);
						discussionPostsContainerDiv.append(firstPostDiv);
					}
					else {
						replyPostDiv = createPostDiv(post["username"], post["date_create"], post["message"]);
						firstPostDiv.append(replyPostDiv);
					}
				});
			});

			return discussionPostsContainerDiv;
		}
	}
]);

var discussionBackendRootUrl = "http://localhost:8080/discussion-REST-interface-0.1-SNAPSHOT/discussion/";

var getDiscussionInfo = function(url)
{
	var result;
	$.ajax({
		url: url,
		dataType: "json",
		async: false,
		success: function(data) {
			result = data;
		}
	});	
	return result;
}

var createPostDiv = function(user, date, message)
{
	var discussionPostDiv = $("\
		<div class='discussionPostDiv'>\
			<div class='discussionPostInfoDiv'>\
				<div class='discussionPostDateDiv'>creation: "+date+"</div>\
				<div class='discussionPostDateDiv'>by author: "+user+"</div>\
				<div class='discussionPostDateDiv'>last edit: "+date+"</div>\
				<div class='discussionPostDateDiv'>by author: "+user+"</div>\
			</div>\
			<div class='discussionPostTitleDiv'>\
				<div>"+message+"</div>\
			</div>\
		</div>\
	");
	
	
	/*discussionPostTitleDiv.click(function(){
		var collapsed = $(this).parent().hasClass("collapsed");
		$(this).parent().parent().children(".discussionPostDiv").addClass("collapsed");
		if (collapsed) $(this).parent().removeClass("collapsed");
	});
	
	var discussionSubPostDiv = createPostReplyDiv("Let's solve it this way ...!");
	discussionPostDiv.append(discussionSubPostDiv);*/
	
	return discussionPostDiv;
}

var createPostReplyDiv = function(user, date, message)
{
	var discussionPostDiv = $("<div class='discussionSubPostDiv'>");
	var discussionPostTitleDiv = $("<div class='discussionPostTitleDiv'>");
	var discussionPostDateCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostAuthorCreationDiv = $("<div class='discussionPostDateDiv'>");
	var discussionPostInfoDiv = $("<div class='discussionPostInfoDiv'>");
	discussionPostTitleDiv.html("<div>"+message+"</div>");
	discussionPostAuthorCreationDiv.html("by author: "+user);
	discussionPostDateCreationDiv.html("creation: "+date);
	discussionPostInfoDiv.append(discussionPostDateCreationDiv);
	discussionPostInfoDiv.append(discussionPostAuthorCreationDiv);
	discussionPostDiv.append(discussionPostInfoDiv);
	discussionPostDiv.append(discussionPostTitleDiv);
	
	return discussionPostDiv;	
}

var createAddPostDiv = function(conceptUri, newThread)
{
	var addDiscussionPostDiv = $("<div class='addDiscussionPostDiv collapsed'>");
	if (newThread) 
		addDiscussionPostDiv.append("<div class='addDiscussionPostButtonDiv'>new topic</div>");
	else
		addDiscussionPostDiv.append("<div class='addDiscussionPostButtonDiv'>reply</div>");
	addDiscussionPostDiv.click(function(){
		if ($(this).hasClass("collapsed"))
		{
			$(this).removeClass("collapsed").addClass("expanded");
			$(this).bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){ 
				$(this).append("<form class='addDiscussionPostForm'> \
					<table> \
						<tr><td align='right'><span class='discussionPostSpan'>Message: </span></td><td><textarea class='discussionPostInput' name='message' rows='7'></textarea></td></tr> \
						<tr><td colspan='2'><input type='button' value='Cancel'/><input type='button' class='discussionPostSubmitButton' value='Send'/></td></tr> \
					</table> \
				</form>");
				addDiscussionPostDiv.find("input.discussionPostSubmitButton").click(function(){
					sendPost(conceptUri, addDiscussionPostDiv.find("textarea.discussionPostInput").val());
				});
			});
			$(this).children(".addDiscussionPostButtonDiv").html("");
		}
		$(this).removeClass("collapsed");
	});
	return addDiscussionPostDiv;
}

var sendPost = function(conceptUri, message2)
{
	var result;
	$.ajax({
		url: conceptUri,
		type: "post",
		dataType: "json",
		contentType: 'application/json',
        data: '{ message: "asdf" }',
		async: false,
		success: function(data) {
			console.log("success");
			console.log(data);
		},
		error: function(data, errorm) {
			console.log(errorm);
			console.log(data);
		}
	});	
	return result;
}("http://localhost:8080/discussion-REST-interface-0.1-SNAPSHOT/discussion/http%3A%2F%2Floinc.org%2Fowl%2363932-8/thread","bla");