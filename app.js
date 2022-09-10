const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "moviesData.db");
let database = null;
const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjToFullMovieResponseObj = (DBObj) => {
  return {
    movieName: DBObj.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM movie`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertDBObjToFullMovieResponseObj(eachMovie)
    )
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
     INSERT INTO movie
     (directorId,movieName,leadActor)
     VALUES ('${directorId}','${movieName}','${leadActor}');
    `;
  const databaseResponse = await database.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

const convDBTJO = (DBO) => {
   return {
       movieId: DBO.movie_id,
       directorId: DBO.director_id,
       movieName: DBO.movie_name,
       leadActor: DBO.lead_actor,
   }
}

app.get("/movies/:movieId", async(request, response) => {
    const { movieId } = request.params;
    const getMovieQuery = `
    SELECT * FROM
    movie 
    WHERE movie_id = ${movieId}`;
    const film = await database.get(getMovieQuery);
    response.send(film.map((eachDetail) => convDBTJO(eachDetail)) )
})

app.put("/movies/:movieId", async(request, response) => {
    const { movieId } = request.params;
    const movieUpdatedDetails = request.body;
    const {directorId, movieName, leadActor} = movieUpdatedDetails;
    const updateMovieQuery = `
    UPDATE movie
    SET  
    movie_name = ${movieName},
    director_id = ${directorId},
    lead_actor = ${leadActor},
    WHERE
    movie_id = ${movieId}`;
    const databaseUpdatedResponse = await database.run(updateMovieQuery);
    response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async(request,response) => {
    const { movieId } = request.params;
    const deleteMovieQuery = `
    DELETE
    FROM movie
    WHERE
    movie_id = ${movieId}`
    const dbDeleteResponse = await database.run(deleteMovieQuery);
    response.send("Movie Removed");
});

const convertDBObjToDirResponseObj = (DirObj) => {
  return {
    directorId: DirObj.director_id,  
    directorName: DirObj.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getdirectorsQuery = `
    SELECT *
    FROM director`;
  const directorsArray = await database.all(getdirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDBObjToDirResponseObj(eachDirector)
    )
  );
});

app.get("directors/:directorId/movies/", async(request, response) => {
    const { directorId } = request.params
    const getDirectorMoviesQuery = `
    SELECT movie_name
    FROM movie
    WHERE 
    director_id = ${directorId}`
    const directorMovies = await database.run(getDirectorMoviesQuery);
    response.send(directorMovies.map((eachMovie) => convertDBObjToFullMovieResponseObj(eachMovie)));
});
