// See near the bottom of this file for your TODO assignments.
// Good luck!

// Dependencies
var express = require("express");
var mongojs = require("mongojs");
var cheerio = require("cheerio");
var request = require("request");
var axios = require("axios");
var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

var db = require("./models");

var PORT = process.env.PORT || 8080

var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


//I'm assuming this is just a connection to my localfile in order to connect to the database?
mongoose.connect('mongodb://localhost/myscrape');




app.get("/api/scrape", function (req, res) {
    axios.get("https://www.npr.org/sections/alltechconsidered/195149875/innovation").then(function (response) {

        var $ = cheerio.load(response.data);




        $("article.item").each(function (i, element) {
            var data = {};

            data.imageUrl = $(this).find("img").attr("src");

            data.title = $(this).find("h2.title").text();

            data.summ = $(this).find("p.teaser").text();
            data.url = $(this).find("a").attr("href");



            db.Article.create(data).then(function (dbArticle) {
                console.log("Scrape Complete");
            }).catch(function (err) {
                return res.json(err);
            });
        });
        res.send("Scrape Complete");
    });
});

app.get("/api/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("comment")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Comment.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { Comment: dbComment._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});



// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});


