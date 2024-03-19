import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "shishir",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (let i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

async function checkVisited() {
  const result = await db.query("select country_code from visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

//Get home page:-
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

//Post route, adding countries:-
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  const result = await db.query(
    "SELECT country_code FROM countries WHERE country_name LIKE % || $1 || %",
    [titleCase(input)]
  );

  if (result.rows.length !== 0) {
    const data = result.rows[0];
    const country_code = data.country_code;
    const visited = await db.query("SELECT country_code FROM visited_countries WHERE country_code = $1", [country_code]);

    if (visited.rows.length !== 0) {
      const countries = await checkVisited();

      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country already visited!!",
      });
    } else {
      await db.query("insert into visited_countries (country_code) values ($1)", [
        country_code,
      ]);
    }
  } else {
    console.log("this country does not exists!!");
    const countries = await checkVisited();
      return res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country does not exists!!",
    });
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
