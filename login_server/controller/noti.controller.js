
const { pusher } = require("../config/config")
const { Bid } = require("../models/Bid");
const { User } = require("../models/User");
const { BidHis } = require("../models/Bid-His")
const { Item } = require("../models/Item")
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const axios = require('axios');

/*** có người tham gia đấu giá (trường hợp chưa set thời gian) ***/
const notiUserJoinController = async (req, res) => {
  const { userId, price, itemId } = req.body;

  try {
    // Tạo một bản ghi mới trong collection Bid
    const newBid = await Bid.create({
      _idUser: new mongoose.Types.ObjectId(userId),
      price: price,
      _idItem: new mongoose.Types.ObjectId(itemId),
      is_success: 'confirming'
    });

    const bidHistory = await BidHis.findOneAndUpdate(
      { _idItem: newBid._idItem },
      {
        $push: {
          bids: {
            _idUser: newBid._idUser,
            price: newBid.price
          }
        }
      },
      { upsert: true, new: true }
    );

    const userOpenId = await Item.findOne({ _id: itemId });

    if (userOpenId) {
      const idUserOpen = userOpenId._idUserOpen;

      const channelName = idUserOpen.toString();
      const eventName = 'bid_placed';

      const message = {
        _idUser: userId,
        price: price
      };

      // Gửi thông báo đến kênh riêng tư của người nhận
      pusher.trigger(channelName, eventName, message);

      res.json({ success: true, bid: newBid, bidHis: bidHistory });
    } else {
      res.status(404).json({ error: 'Không tìm thấy item' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};



/*** Người đấu giá thông báo kết quả đến người chiến thắng ***/ 
const notiResultController = async (req, res) => {
  const { itemId, excludedUserId } = req.body; 
                //excludedUserId: id user đấu giá thắng
  try {
    // Lấy ra danh sách những user đấu giá thất bại
    const bidHistoryUsers = await BidHis.aggregate([
      {
        $match: { _idItem: new mongoose.Types.ObjectId(itemId) }
      },
      {
        $project: {
          bids: {
            $filter: {
              input: '$bids',
              as: 'bid',
              cond: { $ne: ['$$bid._idUser', new mongoose.Types.ObjectId(excludedUserId)] }
            }
          }
        }
      },
      {
        $unwind: '$bids'
      },
      {
        $group: {
          _id: '$bids._idUser'
        }
      }
    ]);

    const userIds = bidHistoryUsers.map(user => user._id);
    //////thông báo đấu giá thất bại
    for (const user of userIds) {
      const channelName = user._id.toString();
      const eventName = 'notification failed';
      const message = {
        message: 'Đấu giá của bạn đã bị từ chối'
      };
      try {
        await pusher.trigger(channelName, eventName, message);
        console.log(`Đã gửi thông báo thất bại đến người dùng ${user._id}`);
      } catch (error) {
        console.error(`Lỗi khi gửi thông báo thất bại đến người dùng ${user._id}:`, error);
      }
    }

    ////// thông báo đấu giá thành công
    const channelName = excludedUserId;
    const eventName = 'notification success';

    const message = {
      message: 'Chấp nhận giá đấu (đấu giá thành công)'
    };
    try {
      await pusher.trigger(channelName, eventName, message);
      console.log(`Đã gửi thông báo thành công đến người dùng ${excludedUserId}`);
    } catch (error) {
      console.error(`Lỗi khi gửi thông báo thành công đến người dùng ${excludedUserId}:`, error);
    }

    // cập nhật lại trạng thái của phiên đấu giá là finish
    await Item.updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { $set: { is_active: 'finish' } }
    );

    // cập nhật trạng thái thành công cho người chiến thắng
    await Bid.updateOne(
      { _idUser: new mongoose.Types.ObjectId(excludedUserId) },
      { $set: { is_success: 'success' } }
    );

    // cập nhật trạng thái thất bại cho người thua
    await Bid.updateMany(
      {
        _idUser: { $nin: [new mongoose.Types.ObjectId(excludedUserId)] },
        _idItem: new mongoose.Types.ObjectId(itemId)
      },
      { $set: { is_success: 'failed' } }
    );


    res.json({ success: true, userIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

/*** Thông báo có người tham gia đấu giá (trường hợp có set thời gian) ***/
const notiTimeUserJoinController = async (req, res) => {
  const { userId, price, itemId } = req.body;

  try {
    // Kiểm tra xem có thể thực hiện đấu giá hay không dựa trên thời gian
    const item = await Item.findOne({ _id: new mongoose.Types.ObjectId(itemId) });

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    const currentTime = new Date();
    const timeRemainingMilliseconds = new Date(item.time_end) - currentTime;
    if (currentTime > item.time_end || currentTime < item.time_start) {
      const channelName = userId.toString();
      const eventName = 'time auction';
      const message = {
        message: 'Phiên đấu giá đã kết thúc hoặc chưa bắt đầu'
      };
      try {
        await pusher.trigger(channelName, eventName, message);
        console.log(`Đã gửi thông báo thành công đến người tham gia đấu giá ${userId}`);
      } catch (error) {
        console.error(`Lỗi khi gửi thông báo thành công đến người tham gia đấu giá ${userId}:`, error);
      }

      return res.status(403).json({ error: 'Phiên đấu giá đã kết thúc hoặc chưa bắt đầu' });
    }

    //// Tiếp tục với việc thực hiện đấu giá khi còn hạn
    // Tạo một bản ghi mới trong collection Bid
    const newBid = await Bid.create({
      _idUser: new mongoose.Types.ObjectId(userId),
      price: price,
      _idItem: new mongoose.Types.ObjectId(itemId),
      is_success: 'confirming'
    });

    const bidHistory = await BidHis.findOneAndUpdate(
      { _idItem: newBid._idItem },
      {
        $push: {
          bids: {
            _idUser: newBid._idUser,
            price: newBid.price
          }
        }
      },
      { upsert: true, new: true }
    );

    const userOpenId = item._idUserOpen;

    if (userOpenId) {
      const channelName = userOpenId.toString();
      const eventName = 'bid_placed';

      const message = {
        _idUser: userId,
        price: price
      };

      // Gửi thông báo đến kênh riêng tư của người nhận
      try {
        await pusher.trigger(channelName, eventName, message);
        console.error(`Đã gửi thông báo có người tham gia đấu giá cho user ${userOpenId}`)
      } catch (error) {
        console.error(`Lỗi khi gửi thông báo có người tham gia đấu giá cho user ${userOpenId}`)
      }
      

      res.json({ success: true, bid: newBid, bidHis: bidHistory, timeRemainingMilliseconds });
    } else {
      res.status(404).json({ error: 'Không tìm thấy người mở phiên đấu giá' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

/*** đăng sản phẩm đấu giá ***/
const postItemAuctionController = async (req, res) => {
  try {
    const { userOpenId, price, time_start, time_end } = req.body;
    const ress = await Item.create({
       _idOpenUser: new mongoose.Types.ObjectId(userOpenId),
       price: price,
       time_start: time_start,
       time_end: time_end,
    });
   
   
    res.status(201).send({
       mess: "create success", data: ress
    })
 } catch (err) {
    res.status(500).send({
       mess: err.message
    })
 }
};

//*** Đếm ngược thời gian đến khi kết thúc phiên đấu giá ***//
const time = async (req, res) => {
  try {
    //const {itemId} = req.params;
    const {itemId} = req.body
    // Lấy thông tin về sản phẩm đấu giá dựa trên _id
    const item = await Item.findOne({ _id: new mongoose.Types.ObjectId(itemId)});
      if (!item) {
      return res.status(404).json({ error: 'Không có sản phẩm nào được tìm thấy' });
    }

    const currentTime = new Date();
    var endTime;
    if (currentTime < item.time_start){
      return res.status(200).json({result: 'Chưa bắt đầu'})
    }

    if (item.time_start && item.duration) {
      // Nếu có thời gian bắt đầu và khoảng thời gian diễn ra, tính toán thời gian kết thúc
      endTime = new Date(item.time_start.getTime() + item.duration * 3600000); // 1 giờ = 3600000 miligiây
    } else {
      return res.status(400).json({ error: 'Thiếu thông tin về thời gian bắt đầu hoặc khoảng thời gian diễn ra' });
    }

    const timeRemaining = endTime - currentTime;

    if (timeRemaining <= 0) {
      return res.json({ countdownText: 'Phiên đấu giá đã kết thúc.' });
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s left`;

    res.json({ countdownText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

//*** Set thời gian tự động đăng sản phẩm lên sàn đấu giá ***//
const postAuctionController = async (req, res) => {
  try {
    const { userOpenId, price, time_start, time_end } = req.body;

    // Lưu sản phẩm vào MongoDB
    const newItem = await Item.create({
      _idUserOpen: new mongoose.Types.ObjectId(userOpenId),
      price_start: price,
      time_start: time_start,
      time_end: time_end,
    });
    
    // Hẹn giờ đăng sản phẩm lên sàn đấu giá
    scheduleAuction(newItem);
    console.log(`Đã đăng sản phẩm có ID ${newItem._id} lên sàn đấu giá.`);
    res.status(201).send({
      mess: "create success", data: newItem
    });
  } catch (err) {
    res.status(500).send({
      mess: err.message
    });
  }
};

// Hàm hẹn giờ đăng sản phẩm lên sàn đấu giá
const scheduleAuction = (item) => {
  const { time_start } = item;
  console.log(time_start);
  const job = schedule.scheduleJob(time_start, async () => {
    try {
      // Kiểm tra thời gian bắt đầu và thực hiện các hành động
      const now = new Date();
      if (now < new Date(time_start)) {
        console.log(`Thời gian bắt đầu chưa đến cho sản phẩm có ID ${item._id}.`);
        return;
      }

      // Thực hiện đăng sản phẩm lên sàn đấu giá
      const auctionResult = await publishAuctionProduct(item);

      console.log(`Đã đăng sản phẩm có ID ${item._id} lên sàn đấu giá. Kết quả:`, auctionResult);
    } catch (error) {
      console.error('Error posting product to auction:', error.message);
    }
  });
};


const publishAuctionProduct = async (product) => {
  const channelName = 'auction_product';
  const eventName = 'product_published';

  const message = {
    product: {
      _id: product._id,
      price: product.price,
      time_start: product.time_start,
      time_end: product.time_end
    },
    message: 'Sản phẩm đấu giá đã được đăng tải!',
  };
  try {
    // Gửi thông báo đến kênh riêng tư của người nhận
    await pusher.trigger(channelName, eventName, message);

    // Trả về đối tượng chứa thông tin về quá trình đăng tải sản phẩm
    return {
      success: true,
      message: `Sản phẩm có ID ${product._id} đã được đăng tải thành công.`,
    };
  } catch (error) {
    // Xử lý lỗi khi gửi thông báo
    console.error(`Lỗi khi gửi thông báo đến kênh ${channelName}:`, error);
    return {
      success: false,
      message: `Đã xảy ra lỗi khi đăng tải sản phẩm có ID ${product._id}.`,
    };
  }
};

module.exports = { notiUserJoinController, notiResultController, notiTimeUserJoinController, 
  postItemAuctionController, time, postAuctionController,
scheduleAuction, publishAuctionProduct}