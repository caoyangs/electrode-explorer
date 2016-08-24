"use strict";

const Fs = require("fs");
const Promise = require("bluebird");
const Path = require("path");
const Config = require("@caoyangs/electrode-confippet").config;
const checkVersion = require("./utils/check-version");
const execFile = require("child_process").execFile;

const prefixes = Config.MODULE_PREFIXES_INCLUDE;
const pattern = prefixes && prefixes.length && new RegExp(prefixes.join("|"));

const getDepLatest = (dep, version, isDev) => {
  return new Promise((resolve, reject) => {

    execFile("bash", [Path.join(__dirname, "../../scripts/info-module.sh"), dep], (err, stdout, stderr) => {
      if (err) {
        console.log("error getting module info", err);
        return reject(err);
      }

      if (stderr) {
        console.error("module info stderr", stderr);
        return reject(new Error(stderr));
      }

      const m = stdout.match(/latest:\s'([\d\.]+)'/);
      let wantedVersion = m ? m[1] : version.replace(/[^\.\d]/g, "");

      if (!(/\./).test(wantedVersion)) {
        wantedVersion += ".0.0";
      }

      resolve({
        uri: "#",
        displayName: dep,
        version: checkVersion(wantedVersion, version),
        description: isDev ? "[dev]" : ""
      });

    });

  });
};

const processDeps = (deps, isDev) => {

  const promises = [];

  Object.keys(deps).map((dep) => {

    if (pattern && !(pattern).test(dep)) {
      return;
    }

    const promise = getDepLatest(dep, deps[dep], isDev);
    promises.push(promise);

  });

  return Promise.all(promises);

};

const checkDepVersions = (deps, isDev) => {

  return new Promise((resolve, reject) => {

    processDeps(deps, isDev)
      .then((depArr) => {
        resolve(depArr);
      })
      .catch((err) => {
        reject(err);
      });

  });

};

const writeDeps = (moduleName, moduleDeps) => {

  if (!moduleDeps.length) {
    return;
  }

  // Fetch the repo data file if it already exists
  let repoFile = {};
  try {
    repoFile = require(`../data/${moduleName}.json`);
  } catch (err) {}

  repoFile.deps = moduleDeps;

  const writePath = Path.join(__dirname, `../data/${moduleName}.json`);

  return new Promise((resolve) => {
    Fs.writeFile(writePath, JSON.stringify(repoFile), (err) => {
      if (err) {
        console.error("Error writing file with dependencies", err);
      }
      resolve({});
    });
  });
};

module.exports = (moduleName, deps, devDeps) => {

  return Promise.all([
    checkDepVersions(deps),
    checkDepVersions(devDeps, true)
  ])
    .then((depArrays) => {
      return writeDeps(moduleName, Array.concat(depArrays[0], depArrays[1]))
    })
    .catch((err) => {
      console.log("error getting module dependencies", err);
    });

};
