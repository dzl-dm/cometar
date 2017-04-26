$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "discussion",
			handlerFunction: function(conceptUri){
				var discussionThreadsContainerDiv = $("<div id='discussionThreadsContainerDiv'>");
				discussionThreadsContainerDiv.append(
					createAddPostDiv(discussionBackendRootUrl+encodeURIComponent(conceptUri)+"/thread",true)
				);
				
				var threads = getDiscussionInfo(discussionBackendRootUrl+encodeURIComponent(conceptUri)+"/thread");
				if ($(threads).is("div")) return threads;
				jQuery.each(threads, function(){
					var thread = this;
					var posts = getDiscussionInfo(discussionBackendRootUrl+"thread/"+thread["id"]+"/post");	
					if ($(posts).is("div")) return posts;
					var discussionPostsContainerDiv = $("<div class='discussionPostsContainerDiv'></div>");
					jQuery.each(posts, function(){
						var post = this;
						var postDiv = createPostDiv(post["id"], post["username"], post["date_create"], post["message"]);
						if (discussionPostsContainerDiv.children().length == 0) {
							postDiv.addClass("firstPost");
						}
						discussionPostsContainerDiv.append(postDiv);
						postDiv.find(".editPostButton").click(function(){
							editPostButtonClicked($(this), post["id"])
						});						
					});
					discussionPostsContainerDiv.append(
						createAddPostDiv(discussionBackendRootUrl+"thread/"+thread["id"]+"/post",false)
					);
					discussionThreadsContainerDiv.append(discussionPostsContainerDiv);
				});

				return discussionThreadsContainerDiv;
			}
		}
	]);

	var discussionBackendRootUrl = "http://localhost:8080/REST-interface-0.1-SNAPSHOT/discussion/";

	var getDiscussionInfo = function(url)
	{
		var result;
		$.ajax({
			url: url,
			dataType: "json",
			async: false,
			beforeSend: function(xhr, settings) { 
				xhr.setRequestHeader('Authorization','Bearer ' + Helper.getAuthenticationToken()); 
			},
			success: function(data) {
				result = data;
			},
			error: function(a,b,c){
				result = $("<div class='errorDiv'>An error occured: \""+c+"\"</div>");
			}
		});	
		return result;
	}

	var createPostDiv = function(id, user, date, message)
	{
		var editDivText = "";
		if (Helper.getAuthenticationUsername() == user){
			editDivText = "<input type='button' class='editPostButton' value='edit'/>";
		}
		var discussionPostDiv = $("\
			<div class='discussionPostDiv'>\
				<div class='discussionPostTitleDiv'>\
					<div id='discussionPost_"+id+"'>"+message+"</div>\
				</div>\
				<div class='discussionPostInfoDiv'>\
					<div class='discussionPostDateDiv'>"+date+"</div>\
					<div class='discussionPostDateDiv'>"+user+"</div>\
					"+editDivText+"\
					<!--<span class='deletePostDiv'>delete</span>\
					<div class='discussionPostDateDiv'>last edit: "+date+"</div>\
					<div class='discussionPostDateDiv'>by author: "+user+"</div>-->\
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

	var createAddPostDiv = function(conceptUri, isNewThread)
	{
		var addDiscussionPostDiv;
		if (Helper.authenticated())
		{
			addDiscussionPostDiv = $("<div class='addDiscussionPostDiv collapsed'>");
			var addDiscussionPostButtonDiv = $("<div class='addDiscussionPostButtonDiv'></div>");
			addDiscussionPostDiv.append(addDiscussionPostButtonDiv);
			if (isNewThread) {
				addDiscussionPostButtonDiv.text("new topic");
			} else {
				addDiscussionPostButtonDiv.text("reply");
			}
			addDiscussionPostDiv.append(createDiscussionPostForm(
				function(msg){
					var response = sendPost(conceptUri, msg);
					if (response) return response;
				},
				function(){
					addDiscussionPostDiv.removeClass("expanded").addClass("collapsed");
					addDiscussionPostDiv.children(".addDiscussionPostButtonDiv").show();
				}
			));
			addDiscussionPostButtonDiv.click(function(){
				if (addDiscussionPostDiv.hasClass("collapsed"))
				{
					hideAllForms();
					addDiscussionPostDiv.children(".addDiscussionPostButtonDiv").hide();
					addDiscussionPostDiv.removeClass("collapsed").addClass("expanded");
					addDiscussionPostDiv.bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){ 
						
					});
				}
			});
		}
		return addDiscussionPostDiv;
	}

	var sendPost = function(conceptUri, msg)
	{
		var myData = { message: msg };
		$.ajax({
			url: conceptUri,
			type: 'post',
			dataType: 'text',
			data: JSON.stringify(myData),
			contentType: 'application/json',
			beforeSend: function(xhr, settings) { 
				xhr.setRequestHeader('Authorization','Bearer ' + Helper.getAuthenticationToken()); 
			},
			async: false,
			success: function() {
				//console.log("success");
				location.reload();
			},
			error: function(data, errorm, c) {
				console.log(errorm);
				console.log(data);
			},
			complete: function(e, xhr, settings){
				if(e.status === 403){
					return $("<div>Session abgelaufen. Bitte erneut einloggen.</div>");
				}
				if(e.status === 401){
					return $("<div>Nicht authorisiert. Bitte einloggen.</div>");
				}
			}
		});
	};
	
	var editPostButtonClicked = function(sender, id)
	{
		hideAllForms();
		if ($("#discussionPost_"+id).children("form").length == 0)
		{
			var post = $("#discussionPost_"+id).text();
			$("#discussionPost_"+id).html(createDiscussionPostForm(
				function(msg){
					sendPost(discussionBackendRootUrl+"post/"+id, msg);
				},
				function(){
					$("#discussionPost_"+id).html(post);
					sender.show();
				},
				post
			));
		}
		sender.hide();
	}
	
	var hideAllForms = function()
	{
		$(".discussionPostForm").find(".discussionPostCancelButton").each(function(){$(this).click()});		
	}
	
	var createDiscussionPostForm = function(sendFunction, cancelFunction, content)
	{
		var postForm = $("<form class='discussionPostForm'> \
				<span class='discussionPostSpan'>Message: </span>\
				<textarea class='discussionPostInput' name='message' rows='7'></textarea>\
				<input type='button' class='discussionPostCancelButton' value='Cancel'/><input type='button' class='discussionPostSubmitButton' value='Send'/> \
		</form>");
		postForm.find(".discussionPostInput").val(content);
		postForm.find(".discussionPostSubmitButton").click(function(){
			sendFunction(postForm.find(".discussionPostInput").val())
		});
		postForm.find(".discussionPostCancelButton").click(function(){
			cancelFunction();
		});
		return postForm;
	}
});