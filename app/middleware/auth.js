const jwt = require("jsonwebtoken");
const pgSQL = require("../dbconfig/dbconfig.js");
var LocalStorage = require("node-localstorage").LocalStorage;
const localstorage = new LocalStorage("./scratch");

const auth = (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    // const token = req.cookies['jwt'];

    const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN);
    if (!verifyToken) {
      return res.send({ status: 401, message: "unauthenticated" });
    }

    const verifyingNumber = verifyToken.name;
    console.log("---------middleware---------->:" + verifyingNumber);
    // const clientToken = verifyToken.clientToken;

    const clientToken = req.getItem(clientToken);

    if (localstorage.getItem(userName) == clientToken) {
      const verifyAuthUser =
        "select user_name from user_account where user_name = $1";
      pgSQL.query(verifyAuthUser, [verifyingNumber], (err, result) => {
        if (err) throw err;

        if (result.rows.length > 0) {
          // req.token = verifyToken;
          req.token = token;
          req.verifyingNumber = verifyingNumber;
          next();
        } else {
          return res.send({ status: 401, message: "unauthenticated" });
        }
      });
      // req.token = token;
      // req.verifyingNumber = verifyingNumber;
      // next();
    } else {
      return res.send({ status: 401, message: "unauthenticated" });
    }
  } catch (error) {
    return res.send({ status: 401, message: "unauthenticated" + error });
  }
};
module.exports = auth;

// 1.get the client side token from angular passing through interceptor
// 2. get the client side token from node where the store library by using userName
// 3. check both are matching
