const {tryCatchHandler} = require('../Helpers/try_catch_handlers')
const {CustomError} = require('../Errors/class-errors')
const {sendResponse} = require('../Helpers/response-handler')
const OrderModel = require("../Models/Order_model");
const { parseConnectionUrl } = require('nodemailer/lib/shared');





const newOrder = tryCatchHandler(async (req, res) => {
  const userId = req.user.User_id;
  //*check  cart
  const cart = await OrderModel.getCartByUserId(userId);
  if (!cart) {
    return sendResponse(res,400,false, null, "Cart not found.");
  }

  const cartId = cart.cart_id;
  // *check item in cart
  const cartItems = await OrderModel.getItemsInCartByCartId(cartId);
  if (!cartItems || cartItems.length === 0) {
    return sendResponse(
      res,
      400,
      false,
      null,
      "Cart is empty. Cannot create order."
    );
  }

  //*check stock_quantity of products
  for (const item of cartItems) {
    const product = await OrderModel.getItemByProductId(item.product_id);
    if ( product.quantity < item.quantity) {
      return sendResponse(
        res,
        false,
        400,
        null,
        `Insufficient stock for product ${product?.name || "Unknown"}.`
      );
    }
  }

  //*create order
  const order = await OrderModel.createOrder(userId, cartItems);
  sendResponse(res, 201, true, order, "Order placed successfully.");
});


const getOrders = tryCatchHandler(async(req,res)=>{
  const userId = req.user.User_id;
  const order = await OrderModel.getOrderByUserId(userId);
  if(!order){
    return sendResponse(res,400,false,null,"you have not order.")
  }
  const {user_id ,...filteredResult} = order;
  
  sendResponse(
    res,
    200,
    true,
    filteredResult,
    "Order details retrieved successfully."
  );
})
const getOrder = tryCatchHandler(async(req,res)=>{
  const userId = req.user.User_id;
  const orderId = parseInt(req.params.order_id) ; 
  const order = await OrderModel.getOrderByUserIdAndOrderId(userId,orderId)
  if(!order){
    return sendResponse(res,400,false,null,"You do not have an order associate with this order ID")
  }

  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId);
  if(!orderItems) {
    return sendResponse(
      res,
      400,
      false,
      null,
      "No order items found for the provided order ID."
    );
  };
  
  const filteredOrder = orderItems.map(({order_item_id,...filteredResult})=>
    filteredResult);
  sendResponse(
    res,
    200,
    true,
    filteredOrder,
    "Order details retrieved successfully."
  );
});
const getOrderItems =tryCatchHandler(async(req,res)=>{
  const userId = req.user.User_id;
  const orderId = parseInt(req.params.order_id);

  //*order_id must belong to user:
  const order = await OrderModel.getOrderByUserIdAndOrderId(userId,orderId);
  if(!order){
    return sendResponse(res,404,false,null,"Order not found for this user.")
  };
  //*checking order status
  const orderStatus = order.status;
  if(orderStatus === "canceled"){
    return sendResponse(res,400,false,null,"This order has already been canceled.")
  };
  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId);
  if(!orderItems){
    return sendResponse(res,404,false,null,"Order not found or contains no items.")
  };

  const orderItemDetails = await Promise.all(
    orderItems.map(async ({ product_id, quantity }) => {
      const product = await OrderModel.getItemByProductId(product_id);
      const { name, price, image_url } = product;
      return { name, price, image_url, quantity };
    })
  );
  return sendResponse(res,200,true,orderItemDetails,"Order item details  was received successfully.")

})

//*update (check user Role)
const updateOrder =tryCatchHandler(async(req,res)=>{
  const userRole = req.user.Role;
  if(userRole === "manager"){
    await updateOrderForManager(req,res)
  }else if(userRole === "customer"){
    await updateOrderForCustomer(req,res)
  }else{
    return sendResponse(res,403,false,null,"Access denied .")
  }
})

//*limit access .
const updateOrderForCustomer = tryCatchHandler(async (req, res) => {
  const userId = req.user.User_id;
  const orderId = parseInt(req.params.order_id);
  const { product_id, quantity, status } = req.body;

  if (!product_id && !quantity && !status) {
    return sendResponse(
      res,
      400,
      false,
      null,
      "No fields to update."
    );
  }

  const order = await OrderModel.getOrderByUserIdAndOrderId(userId, orderId);
  if (!order) {
    return sendResponse(
      res,
      404,
      false,
      null,
      "Order not found for this user."
    );
  }
  const isStatusUpdate = !!status;
  const isItemUpdate = !!product_id || !!quantity;

  if (isStatusUpdate && isItemUpdate) {
    return sendResponse(
      res,
      400,
      false,
      null,
      "You can either update status OR product/quantity, not both."
    );
  }
  //*changing status
  if (status && !product_id && !quantity) {
    await OrderModel.updateOrderStatus(status, orderId);
    return sendResponse(
      res,
      200,
      true,
      null,
      "Status was updated successfully."
    );
  }
  //* only pending orders can be modified . 
  if (order.status !== "pending") {
    return sendResponse(
      res,
      403,
      false,
      null,
      "Only pending orders can be modified . "
    );
  }
  //*checking order ID and product ID
  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId);
  const targetItem = orderItems.find((item) => item.product_id === product_id);
  if (!targetItem) {
    return sendResponse(
      res,
      404,
      false,
      null,
      "Product not found in this order."
    );
  }
  //*checking product ID
  const product = await OrderModel.getItemByProductId(product_id);

  const oldQuantity = targetItem.quantity;
  const stockQuantity = product.stock_quantity;
  //*checking order Quantity
  if (quantity > stockQuantity + oldQuantity) {
    return sendResponse(res, 400, false, null, "Insufficient inventory.");
  }
  //*updating stock
  const updatedStock = stockQuantity + oldQuantity - quantity;

  //*delete product when:
  const isDeletingItem = quantity === 0;

  //*cancel order when:
  const cancelOrder = isDeletingItem && orderItems.length === 1;
  //*transaction: 

  const transactionData = {
    orderId,
    productId: product_id,
    newQuantity: quantity,
    updateType: isDeletingItem ? "delete" : "update",
    newStockQuantity: updatedStock,
    cancelOrder,
  };


  try {
    await OrderModel.UpdateOrderTransactionally(transactionData);
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      null,
      "Error processing order."
    );
  }

  const message = isDeletingItem
    ? cancelOrder
      ? "Item deleted and order canceled . "
      : "Item deleted from order ."
    : "Order item updated successfully";

  return sendResponse(res, 200, true, null, message);
});


//* full access
const updateOrderForManager = tryCatchHandler(async(req,res)=>{
  const orderId = parseInt(req.params.order_id);
  const {product_id , quantity , status} = req.body ; 
  if(!product_id && !quantity && !status){
    return sendResponse(res,400,false,null,"NO fields to update.")
  };

  const order = await OrderModel.getOrderByOrderId(orderId)
  if(!order){
    return sendResponse(res,404,false,null,"Order not found.")
  };
  const isStatusUpdate = !!status;
  const isItemUpdate = !!product_id || !!quantity;

  if (isStatusUpdate && isItemUpdate) {
    return sendResponse(
      res,
      400,
      false,
      null,
      "You can either update status OR product/quantity, not both."
    );
  }

  if(status && !product_id && !quantity){
    await OrderModel.updateOrderStatus(status,orderId);
    return sendResponse(res,200,true,null,"Status was updated successfully . ")
    
  }
  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId);
  const targetItem = orderItems.find((item)=> item.product_id === product_id);
  if(!targetItem){
    return sendResponse(
      res,
      404,
      false,
      null,
      "Product not part of this order . "
    );
  };

  const product = await OrderModel.getItemByProductId(product_id);

  const oldQuantity = targetItem.quantity;
  const stockQuantity = product.stock_quantity;

  if(quantity > stockQuantity + oldQuantity){
    return sendResponse(res, 400, false, null, "Insufficient inventory");
  };

  const updatedStock = stockQuantity + oldQuantity - quantity ;

  const isDeletingItem = quantity === 0 ; 

  const cancelOrder =  isDeletingItem && orderItems.length === 1 ; 


  const transactionData = {
    orderId,
    productId:product_id,
    newQuantity : quantity , 
    updateType: isDeletingItem ? "delete" : "update" , 
    newStockQuantity : updatedStock , 
    cancelOrder ,
  };

  try{
    await OrderModel.UpdateOrderTransactionally(transactionData)
  }catch(error){
    return sendResponse(res,500,false,null,"Error processing order.")
  };

  const message = isDeletingItem
  ?cancelOrder
    ?"Item deleted and order canceled . "
    :"Item deleted from order."
  :"Order item updated successfully . ";

  return sendResponse(res,200,true,null,message);

});





//*1) checking  user Role for delete order
const deleteOrder = tryCatchHandler(async(req,res)=>{
  const userRole = req.user.Role;
  if(userRole === "customer"){
    await deleteOrderForCustomer(req,res)
  }else if(userRole ==="manager"){
    await deleteOrderForManager(req,res)
  }else{
    return sendResponse(res,403,false,null,"Access denied.")
  }
});


const deleteOrderForCustomer = tryCatchHandler(async(req,res)=>{

  const userId = req.user.User_id;
  const orderId = parseInt(req.params.order_id)
  //* this orderID  must belong to the user
  const order = await OrderModel.getOrderByUserIdAndOrderId(userId,orderId);
  if(!orderId){
    return sendResponse(res,404,false,null,"Order not found for this user.")
  };
  //*check order status
  const orderStatus = order.status;
  if(orderStatus !== "pending"){
    const message = 
    orderStatus === "canceled"
    ?"This order has been already canceled."
    :"This operation can only performed on pending status orders.";
    return sendResponse(res,400,false,null,message)
  }

  //*order_items table
  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId)
  if(!orderItems || orderItems.length === 0){
    return sendResponse(
      res,
      404,
      false,
      null,
      "Order not found or contains no items."
    );
  };

  //*extraction items  in  orderItems
  const ItemsToUpdate = [];
  for(const item of orderItems){
    const{product_id , quantity} = item;
    const product = await OrderModel.getItemByProductId(product_id);
    const stockQuantity = product.stockQuantity ; 
    const newStockQuantity = stockQuantity + quantity ; 
    ItemsToUpdate.push({productId:product_id,newStockQuantity:newStockQuantity})
  };

  const transactionData = {
    orderId,
    ItemsToUpdate,
    orderStatus:"canceled"
  };

  try {
    await OrderModel.deleteOrderTransactionally(transactionData)
  } catch (error) {
    return sendResponse(res,500,false,null,error.message || "Error processing order.")
  }
  return sendResponse(res,200,true,null,"Order deleted successfully.")

});

  
const deleteOrderForManager = tryCatchHandler(async(req,res)=>{
  const orderId  = parseInt(req.params.order_id)
  //*this order_id must for user
  const order = await OrderModel.getOrderByOrderId(orderId);
  if (!order) {
    return sendResponse(
      res,
      404,
      false,
      null,
      "Order not found ."
    );
  }
  //*check order status
  const orderStatus = order.status;
  if (orderStatus !== "pending") {
    const message =
      orderStatus === "canceled"
        ? "This order has been already canceled."
        : "This operation can only performed on pending status orders.";
    return sendResponse(res, 400, false, null, message);
  }

  //*order_items table
  const orderItems = await OrderModel.getOrderItemsByOrderId(orderId);
  if (!orderItems || orderItems.length === 0) {
    return sendResponse(
      res,
      404,
      false,
      null,
      "Order not found or contains no items."
    );
  }

  //*extraction items  in  orderItems
  const ItemsToUpdate = [];
  for (const item of orderItems) {
    const { product_id, quantity } = item;
    const product = await OrderModel.getItemByProductId(product_id);
    const stockQuantity = product.stockQuantity;
    const newStockQuantity = stockQuantity + quantity;
    ItemsToUpdate.push({
      productId: product_id,
      newStockQuantity: newStockQuantity,
    });
  }

  const transactionData = {
    orderId,
    ItemsToUpdate,
    orderStatus: "canceled",
  };

  try {
    await OrderModel.deleteOrderTransactionally(transactionData);
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Error processing order."
    );
  }
  return sendResponse(res, 200, true, null, "Order deleted successfully.");
})




//*delete specific item from order_Items  with product_id ;

const deleteOrderItem = tryCatchHandler(async(req,res)=>{

  
  const orderId = parseInt(req.params.order_id);
  const productId = parseInt(req.params.product_id)

  //*checking order

  const order = await OrderModel.getOrderByOrderId(orderId);
  if(!order){
    return sendResponse(res,404,false,null,"Order not found.")
  }

  //*checking order status
  const orderStatus = order.status;
  if(orderStatus !== "pending"){
    const message = 
    orderStatus === "canceled"
    ?"This order has been already canceled."
    :"This operation can only performed on pending orders.";

    return sendResponse(res,400,false,null,message)
  }

  //*checking product_id
  const orderItems  = await OrderModel.getOrderItemsByOrderId(orderId);
  const targetItem = orderItems.find((item)=> item.product_id === productId);
  if(!targetItem){
    return sendResponse(res,404,false,null,"Product not part of this order.")
  };

  //*update stock_quantity
  const product = await OrderModel.getItemByProductId(productId);
  const stockQuantity = product.stock_quantity;
  const itemQuantity = targetItem.quantity;
  
  const updatedStock = stockQuantity + itemQuantity ;
  
  //*change order status to cancel and delete order_items if :
  const cancelOrder = orderItems.length === 1 ; 


  const transactionData = {
    orderId,
    productId,
    newStockQuantity:updatedStock,
    deleteType:cancelOrder ?"deleteOrder":"removeItem"
  };

  try {
    await OrderModel.deleteOrderItemTransactionally(transactionData)
  } catch (error) {
    return sendResponse(res,500,false,null,"Error processing order.")
  };

  const message = cancelOrder
  ?"Item deleted and order canceled."
  :"Item deleted and order item updated successfully.";

  return sendResponse(res,200,true,null,message);
})

module.exports = {
   newOrder,
   getOrders,
   getOrder,
   getOrderItems,
   updateOrder,
   deleteOrder,
   deleteOrderItem
}