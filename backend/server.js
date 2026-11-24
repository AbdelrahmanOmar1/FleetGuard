const chalk = require("chalk").default;
const app = require("./app");
const dotenv = require("dotenv").config();

// const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(chalk.cyan(`Server is running on port ${PORT}...`));
});
