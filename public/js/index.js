$(document).ready(function () {

    // Setting a reference to the article-container div where all the dynamic content will go
    // Adding event listeners to any dynamically generated "save article"
    // and "scrape new article" buttons
    var articleContainer = $(".article");
    $(document).on("click", ".btn.save-article", handleArticleSave);
    $(document).on("click", ".scrape-new", handleArticleScrape);
    $(document).on("click", ".btn.delete", handleArticleDelete);
    $(document).on("click", ".btn.comments", handleArticleComments);
    $(document).on("click", ".btn.save-comment", handleCommentSave);
    $(document).on("click", ".btn.comment-delete", handleCommentDelete);

    // Once the page is ready, run the initPage function to kick things off
    initPage();

    function initPage() {
        // Empty the article container, run an AJAX request for any unsaved headlines
        articleContainer.empty();
        $.get("/api/articles?saved=false").then(function (data) {
            // If we have headlines, render them to the page
            if (data && data.length) {
                renderArticles(data);
            }
            else {
                // Otherwise render a message explaing we have no articles
                renderEmpty();
            }
        });
    }

    function renderArticles(articles) {
        // This function handles appending HTML containing our article data to the page
        // We are passed an array of JSON containing all available articles in our database
        var articlePanels = [];
        // We pass each article JSON object to the createPanel function which returns a bootstrap
        // panel with our article data inside
        for (var i = 0; i < articles.length; i++) {
            articlePanels.push(createPanel(articles[i]));
        }
        // Once we have all of the HTML for the articles stored in our articlePanels array,
        // append them to the articlePanels container
        articleContainer.append(articlePanels);
    }

    function createPanel(article) {
        // This functiont takes in a single JSON object for an article/headline
        // It constructs a jQuery element containing all of the formatted HTML for the
        // article panel
        var panel = $(
            [
                "<div class='panel panel-default'>",
                "<div class='panel-heading'>",
                "<img class='articleImg' src='" + article.imageURL + "'>",
                "<h3>",
                "<a class='article-link' target='_blank' href='" + article.url + "'>",
                article.title,
                "</a>",
                "</h3>",
                "</div>",
                "<div class='panel-body'>",
                article.summ,
                "</div>",
                "</div>",
                "</div>"
            ].join("")
        );
        // We attach the article's id to the jQuery element
        // We will use this when trying to figure out which article the user wants to save
        panel.data("_id", article._id);
        // We return the constructed panel jQuery element
        return panel;
    }

    function renderEmpty() {
        // This function renders some HTML to the page explaining we don't have any articles to view
        // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
        var emptyAlert = $(
            [
                "<div class='alert alert-warning text-center'>",
                "<h4>Looks like we don't have any new articles.</h4>",
                "</div>",
                "<div class='panel panel-default'>",
                "<div class='panel-heading text-center'>",
                "<h3>What Would You Like To Do?</h3>",
                "</div>",
                "<div class='panel-body text-center'>",
                "<h4><a class='scrape-new'>Try Scraping New Articles</a></h4>",
                "<h4><a href='/saved'>Go to Saved Articles</a></h4>",
                "</div>",
                "</div>"
            ].join("")
        );
        // Appending this data to the page
        articleContainer.append(emptyAlert);
    }

    function renderCommentsList(data) {
        // This function handles rendering comment list items to our notes modal
        // Setting up an array of notes to render after finished
        // Also setting up a currentNote variable to temporarily store each note
        var commentsToRender = [];
        var currComment;
        if (!data.comments.length) {
            // If we have no notes, just display a message explaing this
            currComment = ["<li class='list-group-item'>", "No comments for this article yet.", "</li>"].join("");
            commentsToRender.push(currComment);
        }
        else {
            // If we do have notes, go through each one
            for (var i = 0; i < data.comments.length; i++) {
                // Constructs an li element to contain our noteText and a delete button
                currComment = $(
                    [
                        "<li class='list-group-item comment'>",
                        data.comments[i].body,
                        "<button class='btn btn-danger comment-delete'>x</button>",
                        "</li>"
                    ].join("")
                );
                // Store the note id on the delete button for easy access when trying to delete
                currComment.children("button").data("_id", data.comments[i]._id);
                // Adding our currentNote to the notesToRender array
                commentsToRender.push(currComment);
            }
        }
        // Now append the notesToRender to the note-container inside the note modal
        $(".comment-container").append(commentsToRender);
    }

    function handleArticleComments() {
        // This function handles opending the notes modal and displaying our notes
        // We grab the id of the article to get notes for from the panel element the delete button sits inside
        var currentArticle = $(this).parents(".panel").data();
        // Grab any notes with this headline/article id
        $.get("/api/commments/" + currentArticle._id).then(function (data) {
            // Constructing our initial HTML to add to the notes modal
            var modalText = [
                "<div class='container-fluid text-center'>",
                "<h4>Comments For Article: ",
                currentArticle._id,
                "</h4>",
                "<hr />",
                "<ul class='list-group comment-container'>",
                "</ul>",
                "<textarea placeholder='New Comment' rows='4' cols='60'></textarea>",
                "<button class='btn btn-success save'>Save Comment</button>",
                "</div>"
            ].join("");
            // Adding the formatted HTML to the note modal
            bootbox.dialog({
                message: modalText,
                closeButton: true
            });
            var commentData = {
                _id: currentArticle._id,
                comments: data || []
            };
            // Adding some information about the article and article notes to the save button for easy access
            // When trying to add a new note
            $(".btn.save").data("article", commentData);
            // renderNotesList will populate the actual note HTML inside of the modal we just created/opened
            renderCommentsList(commentData);
        });
    }

    function handleCommentSave() {
        // This function handles what happens when a user tries to save a new note for an article
        // Setting a variable to hold some formatted data about our note,
        // grabbing the note typed into the input box
        var commentData;
        var newComment = $(".bootbox-body textarea").val().trim();
        // If we actually have data typed into the note input field, format it
        // and post it to the "/api/notes" route and send the formatted noteData as well
        if (newComment) {
            commentData = {
                _id: $(this).data("article")._id,
                body: newComment
            };
            $.post("/api/comments", commentData).then(function () {
                // When complete, close the modal
                bootbox.hideAll();
            });
        }
    }

    function handleCommentDelete() {
        // This function handles the deletion of notes
        // First we grab the id of the note we want to delete
        // We stored this data on the delete button when we created it
        var commenToDelete = $(this).data("_id");
        // Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
        $.ajax({
            url: "/api/notes/" + commenToDelete,
            method: "DELETE"
        }).then(function () {
            // When done, hide the modal
            bootbox.hideAll();
        });
    }

    function handleArticleSave() {
        // This function is triggered when the user wants to save an article
        // When we rendered the article initially, we attatched a javascript object containing the headline id
        // to the element using the .data method. Here we retrieve that.
        var articleToSave = $(this).parents(".panel").data();
        articleToSave.saved = true;
        // Using a patch method to be semantic since this is an update to an existing record in our collection
        $.ajax({
            method: "PUT",
            url: "/api/articles",
            data: articleToSave
        }).then(function (data) {
            // If successful, mongoose will send back an object containing a key of "ok" with the value of 1
            // (which casts to 'true')
            if (data.ok) {
                // Run the initPage function again. This will reload the entire list of articles
                initPage();
            }
        });
    }

    function handleArticleDelete() {
        // This function handles deleting articles/headlines
        // We grab the id of the article to delete from the panel element the delete button sits inside
        var articleToDelete = $(this).parents(".panel").data();
        // Using a delete method here just to be semantic since we are deleting an article/headline
        $.ajax({
            method: "DELETE",
            url: "/api/headlines/" + articleToDelete._id
        }).then(function (data) {
            // If this works out, run initPage again which will rerender our list of saved articles
            if (data.ok) {
                initPage();
            }
        });
    }

    function handleArticleScrape() {
        // This function handles the user clicking any "scrape new article" buttons
        $.get("/api/scrape").then(function (data) {
            // If we are able to succesfully scrape the NYTIMES and compare the articles to those
            // already in our collection, re render the articles on the page
            // and let the user know how many unique articles we were able to save
            initPage();
            bootbox.alert("<h3 class='text-center m-top-80'>" + data.message + "<h3>");
        });
    }
});

