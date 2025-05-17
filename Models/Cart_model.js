const { DataBaseError, CustomError } = require("../Errors/class-errors");
const pool = require("../server");



class CartModel {
    static async getProductIdByUUID(id) {
        try {
            const [[result]] = await pool.query(
                'SELECT product_id FROM e_commerce.products WHERE id = ?', [id]
            );
            if (!result) throw new CustomError("Invalid ID.", 400);
            return result;
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.");
        }
    }

    static async getCartByUserId(userID) {
        try {
            const [[cart]] = await pool.query(
                'SELECT cart_id FROM e_commerce.cart WHERE user_id = ?', [userID]
            );
            return cart || null;
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.");
        }
    }

    static async createCart(userID) {
        try {
            const [result] = await pool.query(
                'INSERT INTO e_commerce.cart (user_id) VALUES (?)', [userID]
            );
            if (!result.affectedRows) {
                throw new DataBaseError("Failed to create cart.", 500);
            }
            return { cart_id: result.insertId, user_id: userID };
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.");
        }
    }

    static async addItem(cartID, productID, quantity) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [[existingItem]] = await connection.query(
                "SELECT quantity FROM e_commerce.cart_items WHERE cart_id = ? AND product_id = ?",
                [cartID, productID]
            );

            if (existingItem) {
                await connection.query(
                    "UPDATE e_commerce.cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?",
                    [quantity, cartID, productID]
                );
            } else {
                await connection.query(
                    "INSERT INTO e_commerce.cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
                    [cartID, productID, quantity]
                );
            }

            const [[updatedItem]] = await connection.query(
                "SELECT quantity FROM e_commerce.cart_items WHERE cart_id = ? AND product_id = ?",
                [cartID, productID]
            );

            await connection.commit();
            return { cartID, productID, quantity: updatedItem.quantity };
        } catch (error) {
            await connection.rollback();
            throw new DataBaseError(error.message || "Database error occurred.");
        } finally {
            connection.release();
        }
    }
    //* for get cart
    static getItemsInCart = async(cartID)=>{
        try {
            const [cartItems] = await pool.query('select product_id , quantity from e_commerce.cart_items where cart_id = ?',[cartID])
            return cartItems ? cartItems.length > 0 : null ;
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.")
        }
    };
    static getItemsById = async(productID)=>{
        try { 
            const [[result]] = await pool.query('select name,price,image_url,id,stock_quantity from e_commerce.products where product_id = ?',[productID])
            return result || null;
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.")
        }
    }   


//*update route
    static updateItemQuantity = async(cartID,productID,quantityChange)=>{
        const connection = await pool.getConnection();       
        try{
            await connection.beginTransaction()
            const [[existingItem]] = await connection.query(
                "SELECT quantity FROM e_commerce.cart_items WHERE cart_id = ? AND product_id = ?",
                [cartID, productID]
            );

            if (!existingItem) {
                throw new CustomError("Item not found in cart.", 404);
            }

            const newQuantity = existingItem.quantity + quantityChange;

            if (newQuantity <= 0) {
                // Remove the item from cart
                await connection.query(
                    "DELETE FROM e_commerce.cart_items WHERE cart_id = ? AND product_id = ?",
                    [cartID, productID]
                );
            } else {
                //Update the quantity
                await connection.query(
                    "UPDATE e_commerce.cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?",
                    [newQuantity, cartID, productID]
                );
            }

            await connection.commit();
            return { cartID, productID, quantity: Math.max(newQuantity, 0) };
        } catch (error) {
            await connection.rollback();
            throw new DataBaseError(error.message || "Database error occurred.");
        }finally{
            connection.release();
        }
    }

    static clearCart = async(cartID) =>{
        try {
            const [result]  = await pool.query('delete from e_commerce.cart_items where cart_id = ? ',[cartID])
            if(!result || result.affectedRows === 0){
                throw new DataBaseError("Failed to clear cart. Please try again.",500)
            }
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.")
        }
    }

    static deleteCartItem = async(cartID,productID)=>{
        try {
            const [result] = await pool.query('delete from e_commerce.cart_items where cart_id = ? and product_id = ?',[cartID,productID])
            if(!result || result.affectedRows === 0){
                throw new DataBaseError(
                  "The item was not deleted because it may not exist in the cart. Please check and try again."
                );
            }
            return true;
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred.")
        }
    }   


}

module.exports = CartModel;



