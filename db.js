const rp = require("request-promise");

class DB {
  constructor(url) {
    this.url = url;
  }

  async create(obj) {
    let options = {
      method: "POST",
      uri: `${this.url}/create`,
      body: obj,
      json: true
    };

    try {
      let msg = await rp(options);
      if (msg != "Create not success") {
        return { status: "success", message: msg };
      }
      return { status: "error", message: msg };
    } catch (e) {
      throw e;
    }
  }

  async find(filters = {}) {
    let options;
    if (Object.keys(filters).length > 0) {
      options = {
        method: "POST",
        uri: `${this.url}/readall/`,
        body: filters,
        json: true
      };
    } else {
      options = {
        method: "POST",
        uri: `${this.url}/readall/`,
        json: true
      };
    }

    try {
      let result = await rp(options);
      return { status: "success", data: result };
    } catch (e) {
      throw e;
    }
  }

  async update(docId, newDoc) {
    let options = {
      method: "POST",
      uri: `${this.url}/update/${docId}`,
      body: newDoc,
      json: true
    };

    try {
      let result = await rp(options);
      if (result == "Updated") {
        return { status: "success", data: newDoc };
      }
      return { status: "error" };
    } catch (e) {
      return { status: "error", message: e.message };
    }
  }
}

const db = new DB("http://localhost:5000");
module.exports = db;
