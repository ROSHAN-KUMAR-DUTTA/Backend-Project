import { jwt } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";


export const verifyJwt=asyncHandler(async (req,_,next)=>{  //when a parameter is not used then place _ instead of parameter name
    try {
        const token = req.cookie?.accessToken || req.headers('Authorisation')?.replace('Bearer ','')
        if(!token){
            throw new ApiError(400,'Unauthorized request')
        }
        const decodedUser=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findbyId(decodedUser?._id).select('-password -refreshToken')
        if(!user){
            throw new ApiError(400,'Invalid access token')
        }
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(400,error?.message||"Invalid access token")
    }
})