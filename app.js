const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const rp = require("request-promise");
const uniqid = require("uniqid");

const db = require("./db");

const btsMap = {
  หมอชิต: "a",
  สะพานควาย: "b",
  อารีย์: "c",
  สนามเป้า: "d",
  อนุสาวรีย์ชัยสมรภูมิ: "e",
  พญาไท: "f",
  ราชเทวี: "g",
  สยาม: "h",
  ชิดลม: "i",
  เพลินจิต: "j",
  นานา: "k",
  อโศก: "l",
  พร้อมพงษ์: "m",
  ทองหล่อ: "n",
  เอกมัย: "o",
  พระโขนง: "p",
  อ่อนนุช: "q",
  บางจาก: "r",
  ปุณณวิถี: "s",
  อุดมสุข: "t",
  บางนา: "u",
  แบริ่ง: "v",
  สำโรง: "w",
  สนามกีฬาแห่งชาติ: "A",
  ราชดำริ: "B",
  ศาลาแดง: "C",
  ช่องนนทรี: "D",
  สุรศักดิ์: "E",
  สะพานตากสิน: "F",
  กรุงธนบุรี: "G",
  วงเวียนใหญ่: "H"
};

function nextChar(c) {
  var i = (parseInt(c, 36) + 1) % 36;
  return (!i * 10 + i).toString(36);
}

function previousChar(c) {
  var i = (parseInt(c, 36) - 1) % 36;
  return (!i * 10 + i).toString(36);
}

const calculatePath = (s, d) => {
  // happy
  const l = [];
  if (s > d) {
    while (s !== d) {
      s = previousChar(s);
      l.push(s);
    }
    l.pop();
  } else {
    while (s !== d) {
      s = nextChar(s);
      l.push(s);
    }
    l.pop();
  }
  return l;
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.post("/users", async (req, res) => {
  const source = btsMap[req.body.source];
  const destination = btsMap[req.body.destination];
  let user = {
    source: source,
    destination: destination,
    path: calculatePath(source, destination),
    direction: source > destination ? -1 : 1,
    latest_station: source,
    status: "pending",
    type: "user",
    id: uniqid(),
    matched_user_id: null,
    meeting_point: null,
    meeting_station: null
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
      res.json(updateResponse);
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

const algo = async (myId, users) => {
  let me = users.filter(user => user.id == myId)[0];
  let relatedUsers = users.filter(user => {
    let myDirectionSet = new Set(me.path);
    let yourDirectionSet = new Set(user.path);
    let intersection = new Set(
      [...myDirectionSet].filter(x => yourDirectionSet.has(x))
    );
    return (
      user.id != me.id &&
      user.direction != me.direction &&
      intersection.size > 0
    );
  });
  console.log("related user: ", relatedUsers);
  let targetUser;
  if (relatedUsers.length > 0) {
    targetUser = relatedUsers[0];
    let myDirectionSet = new Set(me.path);
    let yourDirectionSet = new Set(targetUser.path);
    let intersection = new Set(
      [...myDirectionSet].filter(x => yourDirectionSet.has(x))
    );
    let meetingPoint = Array.from(intersection)[
      parseInt(intersection.size / 2)
    ];
    let meetingStation = Object.keys(btsMap).filter(
      station => btsMap[station] === meetingPoint
    )[0];
    console.log("meetingPoint", meetingPoint);
    console.log("meetingStation", meetingStation);

    me.status = "matched";
    me.matched_user_id = targetUser.id;
    me.meeting_point = meetingPoint;
    me.meeting_station = meetingStation;
    await db.update(me._id, me);

    targetUser.status = "matched";
    targetUser.matched_user_id = me.id;
    targetUser.meeting_point = meetingPoint;
    targetUser.meeting_station = meetingStation;
    await db.update(targetUser._id, targetUser);

    return me;
  } else {
    return null;
  }
};

app.post("/matching", async (req, res) => {
  const body = req.body;
  const myId = body.id;

  const myFilters = {
    type: "user",
    id: myId
  };

  try {
    const result = await db.find(myFilters);
    const me = result.data[0];
    if (me.status != "pending") {
      res.json(me);
      return;
    }
  } catch (e) {
    throw e;
  }

  const filters = {
    status: "pending",
    type: "user"
  };
  try {
    const result = await db.find(filters);
    const users = result.data;
    let algoResult = await algo(myId, users);
    res.json(algoResult);
  } catch (e) {
    throw e;
  }
});

app.get("/tracking/:id", async (req, res) => {
  const id = req.params.id;

  let filters = {
    id,
    type: "user"
  };

  try {
    let response = await db.find(filters);
    let user = response.data[0];
    let station = Object.keys(btsMap).filter(
      station => btsMap[station] === user.latest_station
    )[0];
    res.json({
      id: user.id,
      station
    });
  } catch (e) {
    throw e;
  }
});

app.post("/tracking/:id", async (req, res) => {
  const id = req.params.id;
  const station = req.body.station;

  let filters = {
    type: "user",
    id
  };

  try {
    let response = await db.find(filters);
    let me = response.data[0];
    me.latest_station = btsMap[station];
    let updateResponse = await db.update(me._id, me);
    if (updateResponse.status == "success") {
      res.json({
        status: updateResponse.status,
        data: updateResponse.data
      });
    }
  } catch (e) {
    throw e;
  }
});

app.listen(3000);
