const express = require("express");
const route = express.Router();
const orderController = require('../Controller/Order_controller')
const { validateUpdateOrder, validateOrderURL} = require('../Middlewares/validation_middleware');
const checkRole= require('../Middlewares/check_role_middleware');
const authenticateUser = require("../Middlewares/authentication_middleware");



route.post('/',authenticateUser,orderController.newOrder);

route.get('/',authenticateUser,orderController.getOrders);

route.get('/:order_id',authenticateUser,validateOrderURL,orderController.getOrder);

route.get('/:order_id/items',authenticateUser,validateOrderURL,orderController.getOrderItems);

route.put('/:order_id',authenticateUser,validateOrderURL,validateUpdateOrder,orderController.updateOrder);

route.delete("/:order_id",authenticateUser,validateOrderURL,orderController.deleteOrder);

route.delete("/:order_id/item/:product_id",authenticateUser,checkRole("manager"),validateOrderURL,orderController.deleteOrderItem)

module.exports = route;