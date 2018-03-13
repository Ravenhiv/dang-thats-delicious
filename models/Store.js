const mongoose = require('mongoose')
const slug = require('slugs')
mongoose.Promise = global.Promise

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name.'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates.'
    }],
    address: {
      type: String,
      required: 'You must supply an address.'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author.'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }  
})

// define our indexex
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({
  location: '2dsphere'
})

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next() // skip it
    return // stop this function from running
  }
  this.slug = slug(this.name)
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx })
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`
  }
  next()
  // TODO make more resiliant so slugs are unique
})

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    // show stores with a single tag, each of they have
    { $unwind: '$tags' },
    // group this stores by id with new propert count, which increments on every grouping action
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    // sort them
    { $sort: { count: -1 } }
  ])
}

// find reviews where the stores _id property === reviews store propery
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store' // which field on the review?
})

module.exports = mongoose.model('Store', storeSchema)
