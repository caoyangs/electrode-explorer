"use strict";
var extendRequire = require("isomorphic-loader/lib/extend-require");
extendRequire()
  .then(function () {
    /*eslint-disable*/
    require("babel-core/register");
    require("@caoyangs/electrode-server")(require("@caoyangs/electrode-confippet").config, [require("@caoyangs/electrode-static-paths")()]);
    /*eslint-enable*/
  })
  .catch(function (err) {
    console.log("extendRequire failed", err.stack); // eslint-disable-line no-console
  });
