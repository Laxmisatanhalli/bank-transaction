const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [ true, 'account must belong to a user' ],
    index: true
  },
  status: {
    type: String,
    enum: { 
      values:[ 'ACTIVE','FROZEN', 'CLOSED' ],
      message: 'status must be ACTIVE, FROZEN or CLOSED',
     },
      default: 'ACTIVE'
   
  },
    currency: {
      type: String,
      required: [ true, 'account must have a currency' ],
      default: 'INR'

    }


},{
  timestamps: true
})

accountSchema.index({ user: 1 ,  status: 1 });
const accountModel = mongoose.model('Account', accountSchema);


module.exports = accountModel;