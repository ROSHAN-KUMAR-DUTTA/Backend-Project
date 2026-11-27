import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";


export const verifyJwt=asyncHandler(async (req,_,next)=>{  //when a parameter is not used then place _ instead of parameter name
    try {
        // console.log(req.cookies)
        const token = req.cookies?.AccessToken || req.header('Authorization')?.replace('Bearer ','')
        // console.log(token)
        if(!token){
            throw new ApiError(400,'Unauthorized request')
        }
        const decodedUser=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedUser)
        const user=await User.findById(decodedUser?._id).select('-password -refreshToken')
        if(!user){
            throw new ApiError(400,'Invalid access token')
        }
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(400,error?.message||"Invalid access token")
    }
})