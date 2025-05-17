const {tryCatchHandler}  = require('../Helpers/try_catch_handlers')
const {sendResponse} = require('../Helpers/response-handler')
const ProductsModel = require('../Models/products_model');
const { CustomError } = require('../Errors/class-errors');


const getProducts = tryCatchHandler(async(req,res)=>{
    const result  = await  ProductsModel.getProducts();
    sendResponse(res,200,true,result,'successful.')
});

const getProduct = tryCatchHandler(async(req,res)=>{
    const id = parseInt(req.params.id)
    const result = await ProductsModel.getProduct(id);
    sendResponse(res,200,true,result,'successful.')
});

const addProduct = tryCatchHandler(async(req,res)=>{
    const{name,description,price,stock_quantity,image_url} = req.body;
    const result  = await ProductsModel.addProduct(name,description,price,stock_quantity,image_url);
    sendResponse(res,201,true,result,'Product added successfully.')
});
const updateProduct = tryCatchHandler(async(req,res)=>{
    const id = req.params.id;
    const {name, description , price , stock_quantity , image_url } = req.body;
    await ProductsModel.getProduct(id);
    const updatedFields = {};
    if(name) updatedFields.name = name;
    if(description) updatedFields.description = description;
    if(price) updatedFields.price = price;
    if(stock_quantity) updatedFields.stock_quantity = stock_quantity;
    if (image_url !== undefined) updatedFields.image_url = image_url;
    if (Object.keys(updatedFields).length === 0) {
        return sendResponse(res, 400, false, null, "No fields to update");
    }
    const result = await ProductsModel.updateProduct(id,updatedFields);
    const {product_id,...filteredResult} = result;

    sendResponse(res,201,true,filteredResult,'Product information updated successfully.')
})
const deleteProduct = tryCatchHandler(async(req,res)=>{
    const id  = req.params.id;
    await ProductsModel.deleteProduct(id);
    sendResponse(res,201,true,null,'Product was deleted successfully.')
})

module.exports = {
    getProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
}