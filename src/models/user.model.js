import mongoose, {Schema,model} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
const userSchema=Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String,    //cloudinary url
        required:true,
    },
    coverImage:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:[true,'This field must be not empty']
    },
    refreshToken:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:'Video',
        },
    ]
},{
    timestamps:true 
})


//next was used in older times today we don't need to use next call back also next is not used with async and await in mongoose 9 that the reason next is not a function error was kept comming
// userSchema.pre('save',async function (next){
//     if(!this.isModified('password'))  return next()
//     this.password=await bcrypt.hash(this.password,10)
//     next()
// })
userSchema.pre('save',async function (){
    if(!this.isModified('password'))  return
    this.password=await bcrypt.hash(this.password,10)
})

userSchema.methods.isPasswordCorrect=async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function (){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        fullName:this.fullName,
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken=function (){
    return jwt.sign({
        _id:this._id,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User=model('User',userSchema)
