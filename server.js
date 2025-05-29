const mongoose = require('mongoose');

const uri = "mongodb+srv://yangsejin811:23243298y@cluster0.s1abc.mongodb.net/commentsDB?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 오류:', err));