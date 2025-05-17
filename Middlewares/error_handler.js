const { CustomError,DataBaseError } = require("../Errors/class-errors");

const errorHandler = (error, req, res, next) => {
  if (error instanceof CustomError) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
  if (error instanceof DataBaseError) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
  return res
    .status(500)
    .json({ success: false, message: "something went wrong on the server" });
};

module.exports = errorHandler;
