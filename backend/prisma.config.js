const path = require("node:path");
const { defineConfig } = require("prisma/config");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Check the backend .env file.");
}

const databasePassword = process.env.DATABASE_PASSWORD;
if (databaseUrl.includes("****************") && !databasePassword) {
  throw new Error(
    "DATABASE_PASSWORD is required when DATABASE_URL contains a password placeholder.",
  );
}

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl.replace("****************", databasePassword),
  },
});
