import mongoose from 'mongoose'

const GallerySchema = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 64,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    images: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Image'
    }],
    path: String,
    idPath: String,
    parentGalleryId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Gallery'
    },
    childGalleries: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Gallery'
    }]
})

function autoPopulate(next) {
    this.populate('childGalleries');
    next();
}

GallerySchema
    .pre('find', autoPopulate);
export default mongoose.model('Gallery', GallerySchema)