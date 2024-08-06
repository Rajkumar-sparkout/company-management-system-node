const express = require("express");
const route = express.Router();
const pgSQL = require("../dbconfig/dbconfig");
const bcrypt = require("bcrypt");
const query = require("../queries/query.js");

route.get("/getCountries", (req, res) => {
  const getCountry = query.selectCountry;
  pgSQL.query(getCountry, (err, result) => {
    if (err) throw err;
    return res.send(result.rows);
  });
});

route.get("/getStatesByCountry/:country_code", (req, res) => {
  let country = req.params.country_code;
  const getStateByCountry = query.selectStateByCountry;
  if (!country) {
    return res.send({ status: 400, message: "state id is not exist" });
  }

  const values = [country];
  pgSQL.query(getStateByCountry, values, (err, result) => {
    if (err) throw err;
    return res.send(result.rows);
  });
});

route.get("/getIndustry", (req, res) => {
  const getIndustry = query.selectIndustry;
  pgSQL.query(getIndustry, (err, result) => {
    if (err) throw err;
    return res.send(result.rows);
  });
});

generateOTP = () => {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

route.post("/generateOTPForBusinessUser", (req, res) => {
  const { mobile_number } = req.body;
  const mobileNumberExistInOtp = query.mobileNumberExistInUserOTP;
  pgSQL.query(mobileNumberExistInOtp, [mobile_number], (err, result) => {
    if (err) throw err;

    if (result.rows.length > 0) {
      return res.send({
        status: 400,
        message: "This mobile number is already exist",
      });
    }

    const MobileNumberExistInUser = query.mobileNumberExistInBusinessUser;
    pgSQL.query(MobileNumberExistInUser, [mobile_number], (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
        return res.send({
          status: 400,
          message: "This mobile number is already exist",
        });
      }

      const MobileNumberExistInUserAccount = query.userNameExistInUserAccount;
      pgSQL.query(
        MobileNumberExistInUserAccount,
        [mobile_number],
        (err, result) => {
          if (err) throw err;

          if (result.rows.length > 0) {
            return res.send({
              status: 400,
              message: "This mobile number is already exist",
            });
          }

          const otp = generateOTP();
          const otpInsert = query.insertOtp;
          pgSQL.query(otpInsert, [mobile_number, otp], (err, result) => {
            return res.send({
              status: 200,
              message: "OTP generated successfully",
            });
          });
        }
      );
    });
  });
});

otpExpired = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

passwordExpired = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

route.post("/createBusinessUser", (req, res) => {
  const { password } = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hashedPassword) => {
      const hashPassword = hashedPassword;

      const {
        company_name,
        owner,
        address,
        city,
        state,
        zipcode,
        country,
        email,
        mobile_number,
        industry,
        website,
        company_description,
        user_otp,
        tag,
      } = req.body;

      const now = new Date();
      const currentDate = now.getDate();
      const currentTime = now.getTime();

      const getDatesByMobileNumber = query.selectDatesByMobileNumber;
      pgSQL.query(getDatesByMobileNumber, [mobile_number], (err, result) => {
        if (err) throw err;

        if (result.rows.length > 0) {
          const datas = result.rows;
          Object.keys(datas).forEach((resp) => {
            const row = datas[resp];
            const created = row.created_date;
            const createdDate = created.getDate();
            const lastModifiedDate = row.last_modified_date;
            const otpExpiryTime = otpExpired(lastModifiedDate, 5);

            if (currentDate == createdDate) {
              if (otpExpiryTime >= currentTime) {
                const checkMobileNumberOtpAreSame =
                  query.checkMobileNumberOtpAreSame;
                pgSQL.query(
                  checkMobileNumberOtpAreSame,
                  [user_otp, mobile_number],
                  (err, result) => {
                    if (err) throw err;

                    if (result.rows.length > 0) {
                      const mobileNumberEmailAlreadyExist =
                        query.mobileNumberEmailExistInBusinessUser;
                      pgSQL.query(
                        mobileNumberEmailAlreadyExist,
                        [mobile_number, email],
                        (err, result) => {
                          if (err) throw err;

                          if (result.rows.length > 0) {
                            return res.send({
                              status: 400,
                              message: "This email user is already exist",
                            });
                          }

                          const checkUserNameEmailExist =
                            query.userNameEmailExistInUserAccount;
                          pgSQL.query(
                            checkUserNameEmailExist,
                            [mobile_number, email],
                            (err, result) => {
                              if (err) throw err;

                              if (result.rows.length > 0) {
                                return res.send({
                                  status: 400,
                                  message: "This email user is already exist",
                                });
                              }

                              const insertBusinessUserDetails =
                                query.insertBusinessUserDetails;
                              pgSQL.query(
                                insertBusinessUserDetails,
                                [
                                  company_name,
                                  owner,
                                  email,
                                  mobile_number,
                                  industry,
                                  website,
                                  company_description,
                                  tag,
                                ],
                                (err, result) => {
                                  if (err) throw err;

                                  const businessUserId =
                                    result.rows[0].business_user_id;

                                  const insertBusinessUserAddress =
                                    query.insertBusinessUserAddress;
                                  pgSQL.query(
                                    insertBusinessUserAddress,
                                    [
                                      address,
                                      city,
                                      state,
                                      country,
                                      zipcode,
                                      businessUserId,
                                    ],
                                    (err, result) => {
                                      if (err) throw err;

                                      const insertPassword =
                                        query.businessUserPassword;
                                      pgSQL.query(
                                        insertPassword,
                                        [
                                          mobile_number,
                                          email,
                                          hashPassword,
                                          1,
                                          businessUserId,
                                          passwordExpired(now, 129600),
                                          0,
                                        ],
                                        (err, result) => {
                                          if (err) throw err;

                                          const insertRole =
                                            query.insertBusinessUserRole;
                                          pgSQL.query(
                                            insertRole,
                                            [1000, businessUserId],
                                            (err, result) => {
                                              if (err) throw err;

                                              const insertMembership =
                                                query.insertMembership;
                                              pgSQL.query(
                                                insertMembership,
                                                [1000, 1, businessUserId],
                                                (err, result) => {
                                                  if (err) throw err;

                                                  return res.send({
                                                    status: 200,
                                                    message:
                                                      "New business user created successfully",
                                                  });
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    } else {
                      return res.send({
                        status: 400,
                        message: "OTP has been invalid",
                      });
                    }
                  }
                );
              } else {
                return res.send({
                  message:
                    "Your entered OTP has been expired, please generate new OTP",
                  status: 400,
                });
              }
            } else {
              return res.send({
                message:
                  "Your entered OTP has been expired, please generate new OTP",
                status: 400,
              });
            }
          });
        }
      });
    });
  });
});

route.delete("/deleteOTP/:mobile_number", (req, res) => {
  const mobile_number = req.params.mobile_number;

  const deleteOtpByMobileNumber = query.deleteOtpByMobileNumber;
  pgSQL.query(deleteOtpByMobileNumber, [mobile_number], (err, response) => {
    if (err) throw err;

    return res.send({
      status: 200,
      message: "User OTP and mobile number are deleted",
    });
  });
});

module.exports = route;
