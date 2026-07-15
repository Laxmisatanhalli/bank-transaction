const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name is required"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        regex: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minlength: [6, "password must be at least 6 characters long"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }

    }, { 
      timestamps: true 
    });

    userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return ;
    }
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return;
});

userSchema.methods.comparePassword = async function(Password) {
    return await bcrypt.compare(Password, this.password);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;