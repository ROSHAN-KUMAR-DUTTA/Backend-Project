import 'dotenv/config'
import express from 'express'
import connectMongoDB from './db/index.js'


connectMongoDB()



















// import {DB_NAME} from './constants.js'

// const app=express()

// ;(async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on('error',(error)=>{
//             console.error("Something went wrong!!",error)
//             throw error
//         })
//         console.log("Connection with MongoDB is successfully established!!")
//         app.get('/',(req,res)=>{
//             res.send("Server Started!")
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port http://localhost:${process.env.PORT}`)
//         })

//     }catch(error){
//         console.error("MongoDb connection failed!!",error)
//         throw error
//     }
// })()