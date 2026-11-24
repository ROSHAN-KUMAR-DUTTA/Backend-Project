import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'
const connectMongoDB= async ()=>{
    try {
        const mongoDBInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Connection successfull with MongoDB with the host ${mongoDBInstance.connection.host}`)
    } catch (error) {
        console.error("Connection with MongoDB failed!!",error)
        process.exit(1)
    }
}
export default connectMongoDB