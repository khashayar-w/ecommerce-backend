 const sendResponse = (res,statuscode,success,data=null,message= null)=>{
    res.status(statuscode).json({success,data,message})
}



module.exports = {sendResponse};