


class CustomError extends Error {
    constructor(message , statuscode){
        super(message);
        this.statuscode = statuscode || 400 ; 
        this.name  = this.constructor.name;
    }
}

class DataBaseError extends Error{
    constructor(message , statuscode){
        super(message);
        this.statuscode = statuscode || 500;
        this.name = this.constructor.name ; 
    }
}

module.exports={
    CustomError,
    DataBaseError
}