"use strict";

const Config = require("@caoyangs/electrode-confippet").config;
const ghToken = Config.automaticUpdate && process.env[Config.GHACCESS_TOKEN_NAME];

module.exports = {
  type: "oauth",
  token: ghToken
};

