const { verifyToken } = require("./verifyToken");

const isAuthenticated = async (req, res, next) => {
  try {
    let authToken;
    if (req.headers.authorization) {
      authToken = req.headers.authorization;

      // Validate the auth token.
      const user = await verifyToken(authToken);

      if (user) {
        // req.session.user = user;
        req.user = user;
        // res.locals.user = user;
        return next();
      }
    }

    // The user is not authenticated.
    res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = isAuthenticated;
