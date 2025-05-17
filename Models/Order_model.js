const pool = require("../server");
const {DataBaseError} = require("../Errors/class-errors");



class OrderModel {
  static getCartByUserId = async (userId) => {
    try {
      const [[cart]] = await pool.query(
        "select * from e_commerce.cart where user_id=?",
        [userId]
      );
      return cart || null;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };
  static getItemsInCartByCartId = async (cartId) => {
    try {
      const [items] = await pool.query(
        "select * from e_commerce.cart_items where cart_id=?",
        [cartId]
      );
      return items;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };
  static getItemByProductId = async (productId) => {
    try {
      const [item] = await pool.query(
        "select * from e_commerce.products where product_id = ?",
        [productId]
      );
      if (!item || item.length === 0) {
        throw new DataBaseError("This product doesn't exist.", 500);
      }
      return item[0];
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  static createOrder = async (userId, cartItems) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      //* create new order
      const [orderResult] = await connection.query(
        "INSERT INTO e_commerce.orders (user_id, status) VALUES (?, ?)",
        [userId, "pending"]
      );
      const orderId = orderResult.insertId;
      //* adding item to order_items
      for (const item of cartItems) {
        const [[product]] = await connection.query(
          "SELECT * FROM e_commerce.products WHERE product_id = ?",
          [item.product_id]
        );

        if (!product || product.quantity < item.quantity) {
          throw new DataBaseError(
            `Insufficient stock for product ID ${item.product_id}`,
            400
          );
        }

        //* insert in order
        await connection.query(
          `INSERT INTO e_commerce.order_items 
          (order_id, product_id, quantity, price_at_purchase) 
          VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, product.price]
        );

        //*set new stock_quantity
        await connection.query(
          "UPDATE e_commerce.products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      //*delete cart after success Order
      await connection.query(
        "DELETE FROM e_commerce.cart_items WHERE cart_id = ?",
        [cartItems[0].cart_id]
      );

      await connection.commit();
      return { order_id: orderId };
    } catch (error) {
      await connection.rollback();
      throw new DataBaseError(error.message || "Failed to create order.");
    } finally {
      connection.release();
    }
  };

  static getOrderByUserId = async (userId) => {
    try {
      const [[order]] = await pool.query(
        "select * from  e_commerce.orders where user_id = ? ",
        [userId]
      );
      return order || null;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  static getOrderByUserIdAndOrderId = async (UserId, orderId) => {
    try {
      const [[order]] = await pool.query(
        "select * from e_commerce.orders where user_id = ? and order_id = ?",
        [UserId, orderId]
      );
      return order || null;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  static getOrderItemsByOrderId = async (orderId) => {
    try {
      const [rows] = await pool.query(
        "select * from e_commerce.order_items where order_id = ?",
        [orderId]
      );
      return rows.length >0 ? rows : null;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  //*update
  static updateOrderItemsQuantity = async (
    orderId,
    productId,
    quantity,
    connection
  ) => {
    const [result] = await connection.query(
      "UPDATE e_commerce.order_items SET quantity = ? WHERE order_id = ? AND product_id = ?",
      [quantity, orderId, productId]
    );
    return result;
  };

  static updateProductStock = async (productId, newStock, connection) => {
    const [result] = await connection.query(
      "UPDATE e_commerce.products SET stock_quantity = ? WHERE product_id = ?",
      [newStock, productId]
    );
    return result;
  };

  static deleteOrderItem = async (orderId, productId, connection) => {
    const [result] = await connection.query(
      "DELETE FROM e_commerce.order_items WHERE order_id = ? AND product_id = ?",
      [orderId, productId]
    );
    return result;
  };

  static updateOrderStatus = async (status, orderId, connection = null) => {
    const executor = connection ?? pool;
    const [result] = await executor.query(
      "UPDATE e_commerce.orders SET status = ? WHERE order_id = ?",
      [status, orderId]
    );
    return result;
  };
  
  static getOrderByOrderId = async (orderId) => {
    try {
      const [[result]] = await pool.query(
        "select * from e_commerce.orders where order_id = ?",
        [orderId]
      );
      return result || null;
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  static UpdateOrderTransactionally = async ({
    orderId,
    productId,
    newQuantity,
    updateType,
    newStockQuantity,
    cancelOrder = false,
  }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (updateType === "delete") {
        await this.deleteOrderItem(orderId, productId, connection);
      } else {
        await this.updateOrderItemsQuantity(
          orderId,
          productId,
          newQuantity,
          connection
        );
      }

      await this.updateProductStock(productId, newStockQuantity, connection);

      if (cancelOrder) {
        await this.updateOrderStatus("canceled", orderId, connection);
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally { 
      await connection.release();
    }
  };


  //*delete order_item
  //check what else you need.
  static deleteOrderItemsByOrderId = async(orderId,connection)=>{
    console.log("deleteOrderItemsByOrderId started to work")
    try {
      const [result] = await connection.query("delete from e_commerce.order_items where order_id = ?",[orderId])
      console.log(result)
      return result || null ; 
    } catch (error) {
       throw new DataBaseError(error.message || "Database error occurred.")
    }
  }

  static deleteOrderTransactionally = async({
    orderId,
    orderStatus,
    products,
  })=>{
    const connection = await pool.getConnection();
    try {
      connection.beginTransaction();
      for(const{productId,newStockQuantity} of products){
        await this.updateProductStock(productId,newStockQuantity,connection)
      }
      console.log("updated stock/Model")
      await this.updateOrderStatus(orderStatus,orderId,connection);
      console.log('status updated successfully/Model')
      await this.deleteOrderItemsByOrderId(orderId , connection);
      console.log('order deleted/Model')
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback( )
      throw new DataBaseError(error.message || "Database error occurred .")
    }finally{
      await connection.release()
    }
  };
  

  static deleteOrderItemTransactionally = async({
    orderId,
    productId,
    newStockQuantity,
    deleteType,
  })=>{
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      if(deleteType ==="deleteOrder"){
        await this.deleteOrderItem(orderId,productId,connection);
        await this.updateOrderStatus("canceled",orderId,connection);
      }else{
        await this.deleteOrderItem(orderId,productId,connection)
      }
      await this.updateProductStock(productId,newStockQuantity,connection);
      await connection.commit();
      return true
    } catch (error) {
      await connection.rollback();
      throw new DataBaseError(error.message ||"Database error occurred.")
    }finally{
      await connection.release();
    }
  }
}

module.exports = OrderModel;








