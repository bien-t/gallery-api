import mongoose from 'mongoose'


const PasswordSchema = new mongoose.Schema({
    hashedPassword:{
        type:String,
        required:'Password is required'
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required: true
    },
})




export default mongoose.model('Password',PasswordSchema)