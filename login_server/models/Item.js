const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    _idPost: mongoose.Types.ObjectId,
    _idUserOpen: mongoose.Types.ObjectId,
    price_start: String,
    _idItem: mongoose.Types.ObjectId,
    is_active: String,
    time_start: Date,
    time_end: Date,
    duration: Number
});

const Item = mongoose.model('Item', ItemSchema);



module.exports = {Item};