const jwt  = require('jsonwebtoken');
const { CustomError } = require('../Errors/class-errors');


const authenticateUser = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
    //    throw new CustomError('Unauthorized: No token provide',401) ;
                return next(
                new CustomError("Unauthorized: No token provided", 401)
                );
    }
    jwt.verify(token  , process.env.JWT_SECRET , (err, decoded)=>{
        if(err){
            // throw new CustomError('Forbidden: Invalid token',403);
                return next(
                    new CustomError("Forbidden: Invalid token", 403)
                );
}
        req.user = decoded;
        next();
    })
}



module.exports = authenticateUser;