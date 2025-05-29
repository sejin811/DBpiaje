const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://yangsejin811:23243298y@cluster0.s1abc.mongodb.net/commentsDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB Atlas 연결 완료");
}).catch(err => {
  console.error("MongoDB 연결 오류:", err);
});