const pool = require('../server')
const {DataBaseError} = require('../Errors/class-errors');
const { object } = require('joi');
class ProductsModel {
  static getProducts = async () => {
    try {
      const [products] = await pool.query(
        "select name,description,price,stock_quantity,image_url,id from e_commerce.products"
      );
      if (!products || products.length === 0) {
        throw new DataBaseError("No information received ", 500);
      }
      return products;
    } catch (error) {
      throw new DataBaseError(error.message || "Database  error occurred");
    }
  };

  static getProduct = async (id) => {
    try {
      const [product] = await pool.query(
        "select * from e_commerce.products where id = ?",
        [id]
      );
      if (!product || product.length === 0) {
        throw new DataBaseError("Not Found", 404);
      }
      return product[0];
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred");
    }
  };

  static addProduct = async (
    name,
    description,
    price,
    stock_quantity,
    image_url
  ) => {
    try {
      const [result] = await pool.query(
        "insert into e_commerce.products (name,description,price,stock_quantity,image_url,id) values(?,?,?,?,?,uuid())",
        [name, description, price, stock_quantity, image_url]
      );
      if (!result || result.affectedRows === 0) {
        throw new DataBaseError(
          "Failed to add product. Please try again later",
          500
        );
      }
      const [newProduct] = await pool.query(
        "select id from e_commerce.products where product_id = ?",
        [result.insertId]
      );
      return newProduct[0];
    } catch (error) {
      throw new DataBaseError(error.message || "Database error occurred.");
    }
  };

  static updateProduct = async (id, updatedFields) => {
    try {
      const [isItExist] = await pool.query(
        "SELECT * FROM e_commerce.products WHERE id = ?",
        [id]
      );
      if (!isItExist || isItExist.length === 0) {
        throw new DataBaseError("Invalid id", 401);
      }

      const fields = Object.keys(updatedFields)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = Object.values(updatedFields);

      values.push(id);

      const [newProduct] = await pool.query(
        `UPDATE e_commerce.products SET ${fields} WHERE id = ?`,
        values
      );

      if (!newProduct || newProduct.affectedRows === 0) {
        throw new DataBaseError("Product information was not updated.", 500);
      }

      return this.getProduct(id)
    } catch (error) {
      throw error;
    }
  };

  static deleteProduct = async(id)=>{
    try {
        const[isItExist] = await pool.query('select * from e_commerce.products where id=?',[id]);
        if(!isItExist || isItExist.length === 0 ){
            throw new DataBaseError("Invalid id.",401)
        }
        const[result] = await pool.query('delete from e_commerce.products where id=?',[id])
        if(!result || result.affectedRows === 0){
            throw new DataBaseError('Product was not deleted.',500)
        }
    } catch (error) {
        throw new DataBaseError(error.message || "Database error occurred.")
    }
  };

}




module.exports = ProductsModel;