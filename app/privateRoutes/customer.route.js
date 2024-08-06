const express = require("express");
const route = express.Router();
const pgSQL = require("../dbconfig/dbconfig");
const auth = require("../middleware/auth");

route.post("/createCustomer", auth, (req, res) => {
  const {
    customer_number,
    customer_name,
    address,
    city,
    state,
    country,
    zipcode,
    email,
    mobile_number,
    whatsapp_number,
  } = req.body;

  const customerAlreadyExistByMobileNumber =
    "select mobile_number from customer where mobile_number = $1";
  pgSQL.query(
    customerAlreadyExistByMobileNumber,
    [mobile_number],
    (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
        return res.send({
          status: 400,
          message: "This mobile number is already exist",
        });
      }

      const insertCustomer =
        "INSERT INTO customer (customer_number, customer_name, email, mobile_number, whatsapp_numbet) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id";
      pgSQL.query(
        insertCustomer,
        [customer_number, customer_name, email, mobile_number, whatsapp_number],
        (err, result) => {
          if (err) throw err;

          const customerId = result.rows[0].customer_id;
          const insertCustomerAddress =
            "INSERT INTO customer_address (address, city, state, country, zipcode, customer_id) VALUES ($1, $2, $3, $4, $5, $6)";
          pgSQL.query(
            insertCustomerAddress,
            [address, city, state, country, zipcode, customerId],
            (err, result) => {
              if (err) throw err;

              return res.send({
                status: 200,
                message: "Customer created successfully",
              });
            }
          );
        }
      );
    }
  );
});

module.exports = route;
