const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const rp = require("request-promise");
const db = require("./db");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.post("/users", async (req, res) => {
  let user = {
    ...req.body,
    type: "user"
  };

  try {
    let response = await db.create(user);
    let result = {
      status: response.status,
      message: response.message,
      user
    };
    res.json(result);
  } catch (e) {
    res.json({
      status: "error",
      message: e.message
    });
  }
});

app.get("/users/:id", async (req, res) => {
  const id = req.params.id;
  const filters = {
    id,
    type: "user"
  };

  try {
    let response = await db.find(filters);
    res.json({
      status: response.status,
      user: response.data[0]
    });
  } catch (e) {
    res.json({
      status: "error",
      message: e.message
    });
  }
});

app.post("/users/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const filters = {
    id,
    type: "user"
  };

  try {
    let result = await db.find(filters);
    let user = result.data[0];
    let newUser = {
      _id: user._id,
      id,
      type: "user",
      latest_station: body.latest_station
    };
    try {
      let updateResponse = await db.update(user._id, newUser);
      res.json({ status: "success" });
    } catch (e) {
      console.log("Inner catch");
      res.json({ status: "error", message: e.message });
    }
  } catch (e) {
    res.json({
      status: "error",
      message: e.message
    });
  }
});

app.listen(3000);
