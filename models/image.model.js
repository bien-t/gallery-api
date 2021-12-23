import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
    name:{
        type:String,
        maxlength:64
    },
    size: Number,
    type: String,
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'User'
    },
    galleryId:{
        type: mongoose.Schema.ObjectId,
        ref:'Gallery'
    },
    path:String,
    mime:String,
    miniaturePath:String
},{
    timestamps:true
})

export default mongoose.model('Image',ImageSchema)