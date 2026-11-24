const asyncHandler=(requestHandler)=>(err,req,res,next)=>{
    Promise.resolve(requestHandler(err,req,res,next)).catch((error)=>next(error))
}

export default asyncHandler

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