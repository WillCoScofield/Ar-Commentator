var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({

    title: {
        type: String,
        required: false

    },
    summ: {
        type: String,
        required: false

    },
    imageURL: {
        type: String,
        required: false

    },
    url: {
        type: String,
        required: false
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    saved: {
        type: Boolean,
        default: false
    }
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;