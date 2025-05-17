const express = require ("express")
const app = express()
const usersRoute  = require('./Routes/users_route');
const productsRoute = require('./Routes/products_route');
const cartRoute = require('./Routes/cart_route');
const orderRoute = require('./Routes/Order_route')
const errorHandler = require('./Middlewares/error_handler')
const cors = require ('cors')
const cookieParser = require('cookie-parser')



app.use(cors());
app.use(express.json());
require('dotenv').config();
app.use(cookieParser())
//* rest API
app.use('/api/users',usersRoute);
app.use('/api/products',productsRoute);
app.use('/api/cart',cartRoute);
app.use('/api/orders',orderRoute);
app.use(errorHandler);


const port  = process.env.HOST
 app.listen(port,()=>{
    console.log('we are listening to port :',port)
})