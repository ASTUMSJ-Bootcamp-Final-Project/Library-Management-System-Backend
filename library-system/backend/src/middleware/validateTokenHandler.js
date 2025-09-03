const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { accessTokenSecret } = require("../config/env");

const validateToken = asyncHandler(async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;

  // Check if Authorization header exists and starts with Bearer
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];

    // Check if token exists
    if (!token) {
      res.status(401);
      throw new Error("Token is missing");
    }

    // Verify the token
    jwt.verify(token, accessTokenSecret, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      req.user = decoded.user;
      console.log("User authenticated:", req.user); // Debug log
      next();
    });
  } else {
    res.status(401);
    throw new Error("Authorization header missing or invalid");
  }
});

module.exports = validateToken;
