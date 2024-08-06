const express = require('express');
const route = express.Router();
const pgSQL = require('../dbconfig/dbconfig');
const bcrypt = require('bcrypt');
const query = require('../queries/query.js');

generateOTP = () => {
    var digits = '0123456789';
    let OTP = '';
    for(let i=0; i < 6; i++){
        OTP += digits[Math.floor(Math.random() * 10)]
    }
    return OTP;
}

route.post('/generateOTPForUser', (req, res)=> {
    const {mobile_number} = req.body;
    const mobileNumberExistInOtp = query.mobileNumberExistInUserOTP;
    pgSQL.query(mobileNumberExistInOtp, [mobile_number], (err, result)=> {
        if(err) throw err;

        if(result.rows.length > 0){
            return res.send({status: 400, message: 'This mobile number is already exist'})
        }

        const MobileNumberExistInUser = query.mobileNumberExistInUser;
        pgSQL.query(MobileNumberExistInUser, [mobile_number], (err, result)=> {
            if(err) throw err;

            if(result.rows.length > 0){
                return res.send({status: 400, message: 'This mobile number is already exist'})
            }
            const userNameExistInUserAccount = query.userNameExistInUserAccount;
            pgSQL.query(userNameExistInUserAccount, [mobile_number], (err, result)=> {
                if(err) throw err;

                if(result.rows.length > 0){
                    return res.send({status: 400, message: 'This mobile number is already exist'})
                }

                const otp = generateOTP();
                const otpInsert = query.insertOtp;
                pgSQL.query(otpInsert, [mobile_number, otp], (err, result)=> {

                    return res.send({status: 200, message: 'OTP generated successfully'});
                });
            });            
        });
    })
});

otpExpired = (date, minutes)=> {
    return new Date(date.getTime() + minutes*60000)
}

passwordExpired = (date, minutes)=> {
    return new Date(date.getTime() + minutes*60000)
}

route.post('/createUser', (req, res)=>{
    const {password} = req.body;
    bcrypt.genSalt(10, (err, salt)=> {
        bcrypt.hash(password, salt, (err, hashedPassword)=> {
            const hashPassword = hashedPassword;

            const {first_name, last_name, address, city, state,zipcode, country,
                     email, mobile_number, user_otp, tag} = req.body;

                    const now = new Date();
                    const currentDate = now.getDate();
                    const currentTime = now.getTime();

                        const getDatesByMobileNumber = query.selectDatesByMobileNumber;
                        pgSQL.query(getDatesByMobileNumber, [mobile_number], (err, result)=> {
                            if(err) throw err;

                            if(result.rows.length > 0){
                                const datas = result.rows;
                                Object.keys(datas).forEach((resp)=> {
                                    const dates = datas[resp];
                                    const created = dates.created_date;
                                    const createdDate = created.getDate();
                                    const lastModifiedDate = dates.last_modified_date;
                                    const otpExpiryTime = otpExpired(lastModifiedDate, 5);

                                    if(currentDate == createdDate){
                                        if(otpExpiryTime >= currentTime){
                                            const checkMobileNumberOtpAreSame = query.checkMobileNumberOtpAreSame;
                                            pgSQL.query(checkMobileNumberOtpAreSame, [user_otp, mobile_number], (err, result)=> {
                                                if(err) throw err;

                                                 if(result.rows.length > 0){
                                                    const mobileNumberEmailAlreadyExist = query.mobileNumberEmailExistInUser;
                                                    pgSQL.query(mobileNumberEmailAlreadyExist, [mobile_number, email], (err, result)=> {
                                                        if(err) throw err;

                                                        if(result.rows.length > 0){
                                                            return res.send({status: 400, message: 'This email user is already exist'});
                                                        }

                                                        const checkMobileNumberEmailExist = query.userNameEmailExistInUserAccount;
                                                        pgSQL.query(checkMobileNumberEmailExist, [mobile_number, email], (err, result)=> {
                                                            if(err) throw err;

                                                            if(result.rows.length > 0){
                                                                return res.send({status: 400, message: 'This email user is already exist'});
                                                            }

                                                            const insertUserDetails = query.insertUserDeatils;
                                                            pgSQL.query(insertUserDetails, 
                                                                [first_name, last_name, email, mobile_number, tag, 0], (err, result)=> {
                                                                    if(err) throw err;

                                                                    const userId = result.rows[0].user_id;

                                                                    const insertUserAddress = query.insertUserAddress;
                                                                    pgSQL.query(insertUserAddress, 
                                                                        [address, city, state, country, zipcode, userId], (err, result)=> {
                                                                            if(err) throw err;

                                                                            const insertPassword = query.inserUserPassword;
                                                                            pgSQL.query(insertPassword, 
                                                                                [mobile_number, email, hashPassword, 1, userId, passwordExpired(now, 129600), 0], (err, result)=> {
                                                                                    if(err) throw err;

                                                                                    const insertRole = query.insertUserRole;
                                                                                    pgSQL.query(insertRole, [1001, userId], (err, result)=> {
                                                                                        if(err) throw err;

                                                                                        return res.send({status: 200, message: 'New user created successfully'});
                                                                                    });
                                                                                });
                                                                        });                                                            
                                                                    });
                                                        });
                                                    });
                                                 }else{
                                                    return res.send({status: 400, message: 'OTP has been invalid'});
                                                 }
                                            });
                                        }else{
                                            return res.send({message: 'Your entered OTP has been expired, please generate new OTP', status: 400});
                                        }
                                    }else{
                                        return res.send({message: 'Your entered OTP has been expired, please generate new OTP', status: 400});
                                    }
                                });
                            }
                        });
        });
    });
});

module.exports = route;