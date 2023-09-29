require('dotenv').config(); 

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String, 
  },
  resetToken: {
    type:String,
  },
  resetTokenExpiration:{
    type:Date,
  } ,
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  category: String,
  attributes: [String],
  file_name: String, 
});


const UserModel = mongoose.model('User', userSchema);
const ProductModel = mongoose.model('Product', productSchema);


module.exports = {
  UserModel,
  ProductModel,
};
