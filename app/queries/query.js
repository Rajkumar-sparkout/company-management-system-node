const express = require('express');
const route = express.Router();

//common queries for user and business user
route.mobileNumberExistInUserOTP = "select mobile_number from user_otp where mobile_number = $1";
route.userNameExistInUserAccount = "select user_name from user_account where user_name = $1";
route.insertOtp = "INSERT INTO user_otp (mobile_number, user_otp) VALUES ($1, $2)";
route.selectDatesByMobileNumber = "select created_date, last_modified_date from user_otp where mobile_number = $1";
route.checkMobileNumberOtpAreSame = "select user_otp, mobile_number from user_otp where user_otp = $1 and mobile_number = $2";
route.userNameEmailExistInUserAccount = "select user_name, email from user_account where user_name = $1 or email = $2";

//cmsysUser(business user) registration query
route.selectCountry = "select * from country";
route.selectStateByCountry =  "select * from states where country_code = $1";
route.selectIndustry = "select * from industry";
route.mobileNumberExistInBusinessUser = "select mobile_number from business_user where mobile_number = $1";
route.mobileNumberEmailExistInBusinessUser = "select mobile_number, email from business_user where mobile_number = $1 or email = $2";
route.insertBusinessUserDetails = `INSERT INTO business_user (company_name, owner, email, mobile_number, industry, website, company_description, tag)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING business_user_id`;
route.insertBusinessUserAddress = "INSERT INTO business_user_address (address, city, state, country, zipcode, business_user_id) VALUES ($1, $2, $3, $4, $5, $6)";
route.businessUserPassword = `INSERT INTO user_account (user_name, email, password, active, business_user_id, password_expire_date, password_expired) 
VALUES ($1, $2, $3, $4, $5, $6, $7)`;
route.insertBusinessUserRole = "INSERT INTO user_roles (role_id, business_user_id) VALUES ($1, $2)";
route.insertMembership = "INSERT INTO user_membership (membership_type, active, business_user_id) VALUES ($1, $2, $3)";
route.deleteOtpByMobileNumber = "DELETE FROM user_otp WHERE mobile_number = $1";

//user registration query
route.mobileNumberExistInUser = "select mobile_number from users where mobile_number = $1";
route.mobileNumberEmailExistInUser = "select mobile_number, email from users where mobile_number = $1 or email = $2";
route.insertUserDeatils = "INSERT INTO users (first_name, last_name, email, mobile_number, tag, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id";
route.insertUserAddress =  "INSERT INTO user_address (address, city, state, country, zipcode, user_id) VALUES ($1, $2, $3, $4, $5, $6)";
route.inserUserPassword = `INSERT INTO user_account (user_name, email, password, active, user_id, password_expire_date, password_expired) 
VALUES ($1, $2, $3, $4, $5, $6, $7)`;
route.insertUserRole = "INSERT INTO user_roles (role_id, users_id) VALUES ($1, $2)";

//cmsys user login route query
route.checkUserNameExistInUserAccountAndIsActive = `select user_name, password, user_id, business_user_id, password_expired from user_account 
where user_name = $1 and active = $2`;
route.getBusinessUserAllDetails = `SELECT bu.business_user_id, bu.company_name, bu.owner, bu.email, bu.mobile_number,
bu.tag, bu.industry, bu.website, bu.company_description, ur.role_id, um.membership_type FROM business_user bu INNER JOIN
user_roles ur ON bu.business_user_id = ur.business_user_id INNER JOIN user_membership um ON 
um.business_user_id = ur.business_user_id WHERE ur.business_user_id = $1`;
route .getUserAllDetails = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.mobile_number, u.tag,
ur.role_id FROM users u INNER JOIN user_roles ur ON u.user_id = ur.users_id  WHERE ur.users_id = $1`;

module.exports = route;