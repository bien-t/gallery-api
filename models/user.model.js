import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: true,
        unique: 'Email is taken',
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
        maxlength: 64,
    },
    images: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Image'
    }],
    galleries: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Gallery'
    }]
})


export default mongoose.model('User', UserSchema)