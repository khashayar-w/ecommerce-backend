const { CustomError } = require("../Errors/class-errors");
const{tryCatchHandler} = require("../Helpers/try_catch_handlers");
const{sendResponse} =require("../Helpers/response-handler");
const CartModel = require("../Models/Cart_model");


const addItem = tryCatchHandler(async(req,res)=>{
        const userID = req.user.User_id;
        const { product_id, quantity } = req.body;

        const [productInfo, cart] = await Promise.all([
          CartModel.getProductIdByUUID(product_id),
          CartModel.getCartByUserId(userID),
        ]);
        
        if (!productInfo) {
          throw new CustomError("Invalid product ID.", 400);
        }
        const product = await CartModel.getItemsById(productInfo.product_id);
        if(product.stock_quantity < quantity){
          return sendResponse(res,400,false, null, "Insufficient inventory");
        }

        let cartID = cart ? cart.cart_id : null ; 

        if (!cartID) {
          const newCart = await CartModel.createCart(userID);
          cartID = newCart.cart_id;
        }

        const cartItem = await CartModel.addItem(
          cartID,
          productInfo.product_id,
          quantity
        );
        sendResponse(
          res,
          201,
          true,
          cartItem,
          "Product added to cart successfully."
        );
});

const getCart = tryCatchHandler(async(req,res)=>{
    const userID = req.user.User_id;
    const cart = await CartModel.getCartByUserId(userID);
    if(!cart) return sendResponse(res,400,false,null,"Your cart is empty.");
    const cartID = cart.cart_id;
    const cartItems = await CartModel.getItemsInCart(cartID);
    //new code:checking for items
    if(!cartItems){
      return sendResponse(res,400,false,null,"Your cart ID is correct, but it looks like your shopping cart is empty at the moment.")
    }
    const detailedCartItems = await Promise.all(
        cartItems.map(async (item) => {
            const itemInfo = await CartModel.getItemsById(item.product_id);
            return {
                ...itemInfo,  
                quantity: item.quantity 
            };
        })
    );

    sendResponse(res, 200, true, detailedCartItems, "Cart retrieved successfully.");
});


const updateCart = tryCatchHandler(async(req,res)=>{
  const userID = req.user.User_id;
  const product_id = req.params.product_id
  const {quantity} = req.body;
  const productInfo = await CartModel.getProductIdByUUID(product_id);
  const productID = productInfo.product_id
  const cart = await CartModel.getCartByUserId(userID);
  const cartID  =cart.cart_id
  const updatedItem = await CartModel.updateItemQuantity(cartID,productID,quantity)
  sendResponse(res,200,true,updatedItem,"Cart item updated successfully.")
})
  
  

//*delete Cart
const clearCart  = tryCatchHandler(async(req,res)=>{
  const userID = req.user.User_id;
  const cart  = await CartModel.getCartByUserId(userID);
  const cartID = cart.cart_id;
  await CartModel.clearCart(cartID);
  sendResponse(res,200,true,null,"Cart cleared successfully.")
})

//*delete  with product_id
const deleteCartItem = tryCatchHandler(async (req, res) => {
  const userID = req.user.User_id;
  const product_id = req.params.product_id;
  const product = await CartModel.getProductIdByUUID(product_id);
  const productID = product.product_id;
  const cart = await CartModel.getCartByUserId(userID);
  const cartID = cart.cart_id;
  await CartModel.deleteCartItem(cartID,productID)
  const cartItems = await CartModel.getItemsInCart(cartID);
  if(!cartItems.length){
    return sendResponse(res,200,true,null,"Your cart is now empty.")
  }
  const detailedCartItems = await Promise.all(
    cartItems.map(async(item)=>{
      const itemInfo = await CartModel.getItemsById(item.product_id);
      return{
        ...itemInfo,
        quantity:item.quantity
      }
    })
  );
  sendResponse(res,200,true,detailedCartItems,"Item deleted and cart updated.")
});




module.exports = {
    addItem,
    getCart,
    updateCart,
    clearCart,
    deleteCartItem,
}