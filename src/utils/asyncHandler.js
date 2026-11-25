const asyncHandler=(requestHandler)=>(req,res,next)=>{  //listen yha pe phele err,req,res,next the parameter me but ab err ko hataya gya cause express iss handler ko bypass kr rha tha usse lag rha tha jab error aayega tab he isse use kro jisse hamara user ka controller jo iss handler me bana tha vo bhi bypass hua and post me status 404 aa rha tha err hatate he 200 aane lga
    return Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
}

export  {asyncHandler}

// const asyncHandler=()=>{}
// const asyncHandler=()=>{()=>{}}
// const asyncHandler=()=>()=>{}



// const asyncHandler=(requestHandler)=>async (err,req,res,next)=>{
//     try{
//         await requestHandler(err,req,res,next)
//     }catch(err){
//         res.status(err.code|| '500').json({
//             success:false,
//             message:err.message
//         })
//     }
// }