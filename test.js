const s = "a";
const d = "m";

function nextChar(c) {
  var i = (parseInt(c, 36) + 1) % 36;
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

console.log(calculatePath(s, d));
