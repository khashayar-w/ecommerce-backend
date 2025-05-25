const express = require('express')
const route = express.Router();
const productsController = require('../Controller/products_controller')
const authenticateUser =require('../Middlewares/authentication_middleware');
const { ValidateId, validateProductsInfoMiddleware, validateUUID, validateUpdateProductsMiddleware } = require('../Middlewares/validation_middleware');
const checkRole = require('../Middlewares/check_role_middleware')


route.get('/',productsController.getProducts);
route.get('/:id',ValidateId,productsController.getProduct);
//*manager only
route.post('/',authenticateUser,checkRole("manager"),validateProductsInfoMiddleware,productsController.addProduct);
route.put('/:id',authenticateUser,checkRole("manager"),validateUUID,validateUpdateProductsMiddleware,productsController.updateProduct);
route.delete('/:id',authenticateUser,checkRole("manager"),validateUUID,productsController.deleteProduct)





module.exports = route ; 