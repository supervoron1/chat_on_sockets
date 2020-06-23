// import {db} from './app.js';
var express = require("express"); // call express
var router = express.Router(); // get an instance of the express Router
var admin = require('firebase-admin');

router
  .route("/")
  .get(function (req, res, err) {

    // Get a database reference to our posts
    // var db = admin.database();
    var ref = db.ref("/messages");

    // Attach an asynchronous callback to read the data at our posts reference
    ref.on("value", function (snapshot) {
      console.log(snapshot.val());
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  });
module.exports = router;
