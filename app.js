const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

app.use("/", require("./routes/routes.js"));

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

app.listen(PORT);

//psql --host=sociogram.cvn7rcl1ln6b.ap-south-1.rds.amazonaws.com --port=5432 --username=dbadmin --password --dbname=sociogramdb
