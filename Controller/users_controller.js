const { sendResponse } = require("../Helpers/response-handler");
const { tryCatchHandler } = require("../Helpers/try_catch_handlers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UsersModel = require("../Models/users_model");
const { CustomError } = require("../Errors/class-errors");
const sendEmail = require('../Helpers/email_verification_handler');
const { object } = require("joi");
//*users_register/part-1:verify Email

const verifyEmail = tryCatchHandler(async (req, res) => {
  const { email } = req.body;
  const isItExist = await UsersModel.getUserByEmail(email);
  if (isItExist) {
    throw new CustomError("This email already exist", 409);
  }
  const verificationCode = Math.floor(
    10000 + Math.random() * 900000
  ).toString();
  await UsersModel.storeVerificationCode(email, verificationCode);
  await sendEmail(
    email,
    "Email verification",
    `your verification code is:${verificationCode}`
  );
  sendResponse(res, 200, true, null, "Part one completed successfully.");
});

//* part-2: verification inputs
const completeRegister = tryCatchHandler(async (req, res) => {
  const { code, username, password } = req.body;
  const email = await UsersModel.getEmailByCode(code);
  if (!email) {
    throw new CustomError("Invalid or Expire verification code ", 400);
  }
  const saltRound = parseInt(process.env.SALT_ROUND);
  const hashedPass = await bcrypt.hash(password, saltRound);
  await UsersModel.register(username, email, hashedPass);
  await UsersModel.deleteVerificationCode(email);
  sendResponse(res,201,true,null,'Account created')
});

const login = tryCatchHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await UsersModel.login(email);
  if(!result){
    throw new CustomError('Email or password is incorrect.',401)
  }
  
  const hashedPass = result.password;
  const validatePassword = await bcrypt.compare(password, hashedPass);
  if (!validatePassword) {
    throw new CustomError("Email or password is incorrect", 401);
  }
  const { user_id, role } = result;
  const secretKey = process.env.JWT_SECRET;
  const token = jwt.sign({ User_id: user_id, Role: role }, secretKey, {
    expiresIn: "2h",
  });
  if (!token) {
    throw new CustomError("problem in creating token", 500);
  }
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 10000,
    })
    .status(200)
    .json({
      message: "login successful",
    });
});

const getUserInfo = tryCatchHandler(async (req, res) => {
  const userId = req.user.User_id;
  const result = await UsersModel.getUserInfo(userId);
  sendResponse(res, 200, true,{username:result.username ,  email:result.email} , "success");
});

const updateInfo = tryCatchHandler(async (req, res) => {
  const userId = req.user.User_id;
  const { username, oldPassword, newPassword } = req.body;
  const userInfo = await UsersModel.getUserInfo(userId);
  const userPassword = userInfo.password;
  const isItValid = await bcrypt.compare(oldPassword, userPassword);
  if (!isItValid) {
    throw new CustomError("Invalid password", 400);
  }
  const updatedFields = {};
  if(username) updatedFields.username = username;
  if(newPassword){
    const salt = parseInt(process.env.SALT_ROUND);
    const hashedPass = await bcrypt.hash(newPassword,salt);
    updatedFields.password = hashedPass;
    
  }
  if(Object.keys(updatedFields).length === 0){
    return sendResponse(res,400,false,null,"no fields to update.")
  }

  await UsersModel.updateInfo(
    userId,
    updatedFields,
  );
  sendResponse(res, 201, true, null, "Information was updated successfully.");
});

module.exports = {
  verifyEmail,
  completeRegister,
  login,
  getUserInfo,
  updateInfo,
};
