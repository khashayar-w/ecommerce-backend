const express = require('express');
const usersController = require('../Controller/users_controller')
const {validateRegisterMiddleware,validateEmailMiddleware,validateLoginMiddleware,validateUpdateProfileMiddleware} = require('../Middlewares/validation_middleware')
const authenticateUser = require('../Middlewares/authentication_middleware')
const route = express.Router();


//*register and login
route.post('/register/email-verification',validateEmailMiddleware,usersController.verifyEmail);
//* new update adding new feature verifying email 
route .post('/register/complete',validateRegisterMiddleware,usersController.completeRegister)
route.post('/login',validateLoginMiddleware,usersController.login);

//*profile

route.get('/profile',authenticateUser,usersController.getUserInfo);
route.put('/profile',authenticateUser,validateUpdateProfileMiddleware,usersController.updateInfo )


module.exports = route


