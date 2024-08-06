const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConn = require("./app/dbconfig/dbconfig");
const cmsysUserRoute = require("./app/routes/cmsysUser.route");
const userRoute = require("./app/routes/user.route");
const cmsysUserLoginRoute = require("./app/routes/cmsysUserLogin.route");

// private routes
const customerRoute = require("./app/privateRoutes/customer.route");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(cookieParser());

// default route
app.get("/", (req, res) => {
  return res.send({ message: "Node app is running" });
});

app.use("/", cmsysUserRoute);
app.use("/", userRoute);
app.use("/", cmsysUserLoginRoute);
app.use("/", customerRoute);

app.listen(3000, () => {
  console.log("Node app is listening on port 3000");
});
module.exports = app;
