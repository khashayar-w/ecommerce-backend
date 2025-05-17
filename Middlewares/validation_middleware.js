const Joi = require("joi");
const{CustomError, DataBaseError} = require('../Errors/class-errors')


//* users - register
const validateEmailMiddleware = (req,res,next)=>{
  const schema = Joi.object({
    email:Joi.string().email().required(),
  })
  const {error} = schema.validate(req.body);
  if(error){
    return next(new CustomError(error.details[0].message),400)
  };
  next();

}
const validateRegisterMiddleware = (req, res, next) => {
  const schema = Joi.object({
    code:Joi.number().integer().positive().required() ,
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,100}$/)
      .required(),
    password: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,100}$/)
      .required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(new CustomError(error.details[0].message, 400));
  }
  next();
};


//* users - login


const validateLoginMiddleware = (req,res,next)=>{
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().pattern(/^[a-zA-Z0-9\s]{1,100}$/).required(),
    });
    const {error} = schema.validate(req.body);
    if(error){
        return next(new CustomError(error.details[0].message , 400))
    }
    next();
}
const  validateUpdateProfileMiddleware = (req,res,next)=>{
  const schema = Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,100}$/).messages({
        "string.guid":"Invalid username format."
      })
      ,
    oldPassword: Joi.string().pattern(/^[a-zA-Z0-9\s]{1,100}$/).required().messages({
      "string.guid":"Invalid password format.",
      "any.required":"Old password required."
    }),
    newPassword: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,100}$/).messages({
        "string.guid":"Invalid password format."
      })
      ,
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(new CustomError(error.details[0].message, 400));
  }
  next();
}

//*id 

const ValidateId = (req,res,next)=>{
  const schema  = Joi.object({
    id:Joi.number().integer().positive().required()
  });
  const {error} = schema.validate(req.params);
  if(error){
    return next(new CustomError(error.details[0].message,400))
  }
  next();
}
const validateUUID = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().uuid().required().messages({
      "string.guid": "Invalid product ID format",
      "any.required": "Product Id is required"
    }),
  });
  const { error } = schema.validate(req.params);
  if (error) {
    return next(new CustomError(error.details[0].message), 400);
  }
  next();
};

//*products

const validateProductsInfoMiddleware = (req,res,next)=>{
  const schema = Joi.object({
    name: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,255}$/)
      .required(),
    description: Joi.string()
      .trim()
      .min(1) 
      .max(65535) 
      .required()
      .messages({
        "string.base": "Description must be a text.",
        "string.empty": "Description cannot be empty.",
        "string.max": "Description is too long.",
        "any.required": "Description is required.",
      }),
    price: Joi.number().precision(2).positive().messages({
      "number.base": "Price must be a valid number.",
      "number.positive": "Price must be greater than zero.",
      "number.precision": "Price must have at most two decimal places.",
      "any.required": "Price is required.",
    }),
    stock_quantity: Joi.number().integer().min(0).required().messages({
      "number.base": "Stock quantity must be a valid number.",
      "number.integer": "Stock quantity must be an integer.",
      "number.min": "Stock quantity cannot be negative.",
      "any.required": "Stock quantity is required.",
    }),
    image_url: Joi.string()
      .uri()
      .allow(null, "") 
      .messages({
        "string.uri": "Image URL must be a valid URL.",
      }),

    });
    const{error} = schema.validate(req.body);
    if(error){
      return next(new CustomError (error.details[0].message , 400))
    }
    next();
}



const validateUpdateProductsMiddleware = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]{1,255}$/)
      ,
    description: Joi.string().trim().min(1).max(65535).messages({
      "string.base": "Description must be a text.",
      "string.empty": "Description cannot be empty.",
      "string.max": "Description is too long.",
      "any.required": "Description is required.",
    }),
    price: Joi.number().precision(2).positive().messages({
      "number.base": "Price must be a valid number.",
      "number.positive": "Price must be greater than zero.",
      "number.precision": "Price must have at most two decimal places.",
      "any.required": "Price is required.",
    }),
    stock_quantity: Joi.number().integer().min(0).messages({
      "number.base": "Stock quantity must be a valid number.",
      "number.integer": "Stock quantity must be an integer.",
      "number.min": "Stock quantity cannot be negative.",
      "any.required": "Stock quantity is required.",
    }),
    image_url: Joi.string().uri().allow(null, "").messages({
      "string.uri": "Image URL must be a valid URL.",
    }),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new CustomError(error.details[0].message, 400));
  }
  next();
};


//* cart

const validateAddItemToCartMiddleware = (req,res,next)=>{
  const schema = Joi.object({
    product_id: Joi.string().uuid().required().messages({
      "string.guid": "Invalid product ID format",
      "any.required": "Product Id is required",
    }),
    quantity: Joi.number().integer().min(1).positive().required().messages({
      "number.base": "Quantity must be a number.",
      "number.min": "Quantity must be at least 1.",
      "any.required": "Quantity is required.",
    }),
  });
  const {error} = schema.validate(req.body);
  if(error){
    return next(new CustomError(error.details[0].message , 400))
  };
  next();
 };


const  ValidateQuantityForCart =(req,res,next)=>{
 const schema = Joi.object({
  quantity:Joi.number().integer().invalid(0).options({ convert: false }).required().messages({
    "number.base":"Quantity must be a number.",
    "number.invalid":"Quantity cannot be 0 .",
    "any.required":"Quantity is required."
  })
 })
 const {error}=schema.validate(req.body);
 if(error){
  return next(new CustomError(error.details[0].message,400))
 }
 next();
};

const validateURL = (req,res,next)=>{
  const schema = Joi.object({
    product_id: Joi.string().uuid().required().messages({
      "string.guid": "Invalid UUID format.",
      "any.required": "Product ID is required."
    })
  });
  const {error} = schema.validate(req.params);
  if(error){
    return next(new CustomError(error.details[0].message , 400))
  };
  next();
}
const validateOrderURL = (req,res,next)=>{
  const schema = Joi.object({
    order_id : Joi.number().integer().positive().invalid(0).required().messages({
      "number.base":"Invalid type of order_id",
      "number.invalid":"Order ID can not be 0 .",
      "any.required":"Order ID is required."
    
    }),
    product_id:Joi.number().integer().positive().invalid(0).messages({
      "number.base":"Invalid type of product ID.",
      "number.invalid":"Product ID can not be 0.",
    })
  })
  const {error} = schema.validate(req.params);
  if(error){
    return next(new CustomError(error.details[0].message),400)
  };
  next();
}

const validateUpdateOrder = (req,res,next)=>{
  const userRole = req.user?.Role;

  const allowedStatuses = userRole === "manager"

  ?["pending","shipped","delivered","canceled"]
  :["canceled"]

  const schema = Joi.object({
    product_id: Joi.number().integer().invalid(0).positive().messages({
      "number.base": `"product_id" must be a number`,
      "number.positive": `"product_id" must be positive`,
    }),
    quantity: Joi.number()
      .integer()
      .positive()
      .options({ convert: false })
      .messages({
        "number.base": `"quantity" must be a number`,
        "number.positive": `"quantity" must be positive`,
      }),
    status: Joi.string()
      .valid(...allowedStatuses)
      .messages({
        "any.only": `status must be one of : ${allowedStatuses.join(", ")}`,
      }),
  });
  const {error} = schema.validate(req.body,{abortEarly:false});
  if(error){
    throw next(new CustomError(error.details[0].message , 400))
  };
  next();
}

module.exports={
    validateEmailMiddleware,
    validateRegisterMiddleware,
    validateLoginMiddleware,
    validateUpdateProfileMiddleware,
    validateProductsInfoMiddleware,
    validateUpdateProductsMiddleware,
    validateAddItemToCartMiddleware,
    ValidateId,
    validateUUID,
    ValidateQuantityForCart,
    validateURL,
    validateOrderURL,
    validateUpdateOrder,
}





