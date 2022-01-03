const express = require("express");
const cheerio = require("cheerio");
const rp = require("request-promise");
const path = require("path");
const cache = require("memory-cache");

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// configure cache middleware
let memCache = new cache.Cache();
let cacheMiddleware = (duration) => {
  return (req, res, next) => {
    let key = "__express__" + req.originalUrl || req.url;
    let cacheContent = memCache.get(key);
    if (cacheContent) {
      res.send(cacheContent);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        memCache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// chess moves url
const url = "https://www.chessgames.com/chessecohelp.html";

// routes
const getHTML = async () => {
  let html = "";
  try {
    html = await rp(url);
  } catch (e) {
    console.log(e);
  }
  return html;
};

app.get("/", async (req, res) => {
  let html = await getHTML();

  res.send(html);
});

app.get("/:code", cacheMiddleware(180), async (req, res) => {
  let html = await getHTML();
  let code = req.params.code;
  const $ = cheerio.load(html);
  let tags = $(`tr:contains(${code})`, html);

  const name = $(tags).children("td").children("font").children("b").text();
  const moves = $(tags).children("td").children("font").children("font").text();

  res.render("index", { name: name, moves: moves });
});

// PORT
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
