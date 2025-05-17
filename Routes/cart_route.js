const express = require('express');
const route = express.Router();
const cartController = require('../Controller/Cart_controller');
const authenticateUser = require("../Middlewares/authentication_middleware")
const {validateAddItemToCartMiddleware,ValidateQuantityForCart,validateURL} = require("../Middlewares/validation_middleware")







route.get('/',authenticateUser,cartController.getCart);

route.post('/items',authenticateUser,validateAddItemToCartMiddleware,cartController.addItem);

route.put('/items/:product_id',authenticateUser,validateURL,ValidateQuantityForCart,cartController.updateCart);

route.delete('/items/:product_id',authenticateUser,validateURL,cartController.deleteCartItem);

route.delete('/',authenticateUser,cartController.clearCart);



module.exports = route;