const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    post_name: String,
    is_active: Boolean,
    price_start: String,
    
});
const Post= mongoose.model('Post', PostSchema);

module.exports = Post;