const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'product name must be provided'],
  },
  price: {
    type: Number,
    required: [true, 'product price must be provided'],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  manufacturer: {
    type: String,
    required: [true, 'manufacturer must be provided']},

  shipping_status: {
    type: String,
    enum: ['ordered', 'shipped', 'completed'],
    default: 'ordered'},
  
  user_name: {
    type: String,
    required: [true, 'user_name must be created must be provided']},

  createdBy_ID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user']
    }},

    { timestamps: true })

const Product = mongoose.model('Product', productSchema)
module.exports = {Product}

// module.exports = mongoose.model('Product', productSchema)

