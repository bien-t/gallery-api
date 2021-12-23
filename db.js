import mongoose from "mongoose";

const db = {
    connect: (url) => {
        mongoose.connect(url)
        mongoose.connection.on('error', () => {
            throw new Error(`unable to connect to database ${url}`)
        })
    }
}

export default db