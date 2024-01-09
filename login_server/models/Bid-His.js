const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const BidHisSchema = new Schema({
    _idItem: mongoose.Types.ObjectId,
    bids: [
        {
            _idUser: mongoose.Types.ObjectId,
            price: String,
            
        }
    ]
})

const BidHis = mongoose.model('BidHis', BidHisSchema)
module.exports  = {BidHis};