const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BidSchema = new Schema({
    _idUser: mongoose.Types.ObjectId,
    price: String,
    _idItem: mongoose.Types.ObjectId,
    is_success: String
});

const Bid = mongoose.model('Bid', BidSchema);



module.exports = {Bid};