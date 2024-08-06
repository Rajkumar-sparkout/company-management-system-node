const express = require("express");
const route = express.Router();
const pgSQL = require("../dbconfig/dbconfig.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const query = require("../queries/query.js");
const store = require("store2");
var LocalStorage = require("node-localstorage").LocalStorage;
const localstorage = new LocalStorage("./scratch");
const auth = require("../middleware/auth.js");

const day = new Date();
membershipExpired = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

// console.log('-----------membership expire date---------->:' +membershipExpired(day, 259200));
// console.log('-----------membership expire date---------->:' +membershipExpired(day, 129600));

route.get("/generateRandomString/:userName", (req, res) => {
  let userName = req.params.userName;
  const now = new Date();
  const character =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactorKey = character.concat(now);

  function generateString(length) {
    let result = " ";
    var characters = charactorKey;
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters
        .charAt(Math.floor(Math.random() * charactersLength))
        .trim();
    }
    return result;
  }
  const clientToken = generateString(50);
  //   store(userName, clientToken);
  localstorage.setItem(userName, clientToken);
  return res.send(clientToken);
});

route.post("/userLogin", (req, res) => {
  const { user_name, password, clientToken } = req.body;
  const checkUserNameExistInUserAccount =
    query.checkUserNameExistInUserAccountAndIsActive;
  pgSQL.query(
    checkUserNameExistInUserAccount,
    [user_name, 1],
    (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
        const datas = result.rows;
        Object.keys(datas).forEach((resp) => {
          const data = datas[resp];
          const createdPassword = data.password;
          const userName = data.user_name;
          const passwordExpired = data.password_expired;

          if (bcrypt.compareSync(password, createdPassword)) {
            if (passwordExpired == 0) {
              const user = { name: userName, clientToken: clientToken };
              const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);

              const businessUserId = data.business_user_id;
              const userId = data.user_id;
              if (businessUserId != null) {
                const getBusinessUserAllDetails =
                  query.getBusinessUserAllDetails;
                pgSQL.query(
                  getBusinessUserAllDetails,
                  [businessUserId],
                  (err, result) => {
                    if (err) throw err;

                    res.cookie(
                      name = "jwt",
                      accessToken,
                      (options = {
                        httpOnly: true, //frontend want be able to access this cookie
                        maxAge: 2 * 60 * 60 * 1000, //2 hours
                      })
                    );

                    return res.send(result.rows);
                  }
                );
              } else if (userId != null) {
                const getUserAllDetails = query.getUserAllDetails;
                pgSQL.query(getUserAllDetails, [userId], (err, result) => {
                  if (err) throw err;

                  res.cookie(
                    name = "jwt",
                    accessToken,
                    (options = {
                      httpOnly: true, //frontend want be able to access this cookie
                      maxAge: 2 * 60 * 60 * 1000, //2 hours
                    })
                  );
                  return res.send(result.rows);
                });
              }
            } else {
              return res.send({
                status: 403,
                message:
                  "Your password has been expired. Please reset your password",
              });
            }
          } else {
            return res.send({ status: 401, message: "Invalid credentials" });
          }
        });
      } else {
        return res.send({
          status: 404,
          message: "User not found, Please signup before you signin",
        });
      }
    }
  );
});

route.post("/logout", auth, (req, res) => {
  res.cookie((name = "jwt"), (val = ""), (options = { maxAge: 0 }));
  // res.clearCookie('jwt');
  localstorage.clear();
  return res.send({ message: "logout success" });
});

generateOTP = () => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

route.get("/generateOTPForExistUser/:mobile_number", (req, res) => {
  let mobile_number = req.params.mobile_number;
  const otp = generateOTP();
  const now = new Date();

  const UserNameExistInUserAccount =
    "select user_name from user_account where user_name = $1";
  pgSQL.query(UserNameExistInUserAccount, [mobile_number], (err, result) => {
    if (err) throw err;

    if (result.rows.length > 0) {
      const mobileNumberAlreadyExist =
        "select mobile_number from user_otp where mobile_number = $1";
      pgSQL.query(mobileNumberAlreadyExist, [mobile_number], (err, result) => {
        if (err) throw err;

        if (result.rows.length > 0) {
          const updateOTP =
            "UPDATE user_otp SET user_otp = $1, last_modified_date = $2 where mobile_number = $3";
          pgSQL.query(updateOTP, [otp, now, mobile_number], (err, result) => {
            if (err) throw err;

            return res.send({
              message: "OTP generated successfully",
              status: 200,
            });
          });
        } else {
          return res.send({
            message: "This mobile number user is not registered",
            status: 404,
          });
        }
      });
    } else {
      return res.send({
        message: "This mobile number user is not registered",
        status: 404,
      });
    }
  });
});

otpExpired = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

passwordExpired = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

route.post("/createNewPassword", (req, res) => {
  const { mobile_number, user_otp, password } = req.body;

  const now = new Date();
  const currentDate = now.getDate();
  const currentTime = now.getTime();

  const mobileNumberExistInUserAccount =
    "SELECT user_name from user_account WHERE user_name = $1";
  pgSQL.query(
    mobileNumberExistInUserAccount,
    [mobile_number],
    (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
        const checkMobilNumberAndOtpAreSame =
          "select user_otp, mobile_number, last_modified_date from user_otp where user_otp = $1 and mobile_number = $2";
        pgSQL.query(
          checkMobilNumberAndOtpAreSame,
          [user_otp, mobile_number],
          (err, result) => {
            if (err) throw err;

            if (result.rows.length > 0) {
              const datas = result.rows;
              Object.keys(datas).forEach((resp) => {
                const data = datas[resp];
                const lastModifiedDate = data.last_modified_date;
                const createdDate = lastModifiedDate.getDate();
                const otpExpiredTime = otpExpired(lastModifiedDate, 5);

                if (createdDate == currentDate) {
                  if (otpExpiredTime >= currentTime) {
                    bcrypt.genSalt(10, (err, salt) => {
                      bcrypt.hash(password, salt, (err, hashedPassword) => {
                        if (err) throw err;

                        const encryptPassword = hashedPassword;
                        const updatePassword =
                          "UPDATE user_account SET password = $1, last_modified_date = $2, password_expire_date = $3 WHERE user_name = $4";
                        pgSQL.query(
                          updatePassword,
                          [
                            encryptPassword,
                            now,
                            passwordExpired(now, 129600),
                            mobile_number,
                          ],
                          (err, result) => {
                            if (err) throw err;

                            return res.send({
                              status: 200,
                              message: "New password updated successfully",
                            });
                          }
                        );
                      });
                    });
                  } else {
                    return res.send({
                      status: 400,
                      message:
                        "Your entered OTP has been expired, please generate the new OTP",
                    });
                  }
                } else {
                  return res.send({
                    status: 400,
                    message:
                      "Your entered OTP has been expired, please generate the new OTP",
                  });
                }
              });
            } else {
              return res.send({
                status: 400,
                message: "Your entered OTP has been invalid",
              });
            }
          }
        );
      } else {
        return res.send({
          status: 400,
          message: "This mobile number user is not registered",
        });
      }
    }
  );
});

module.exports = route;
