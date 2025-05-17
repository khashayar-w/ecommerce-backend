const {CustomError} = require('../Errors/class-errors')


const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new CustomError("Unauthorized: Please log in", 401));
    }

    if (req.user.Role !== role) {
      return next(
        new CustomError(
          "Forbidden: You do not have access to this resource",
          403
        )
      );
    }
    next();
  };
};


module.exports = checkRole ; 