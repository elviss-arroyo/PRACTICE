$(document).ready(function () {
    const API_KEY = "4ecce31518d3c79af6da91dc53d038d5"; // TMDB API key
    const IMG = "https://image.tmdb.org/t/p/w200"; // base image URL

    let currentQuery = ""; 
    let currentPage = 1; 
    let layout = "grid"; 


    $("#searchView").show(); // show search view on load
    $("#collectionView").hide(); // hide collections on load
    
    $("#searchBtn").click(function () { // when search button clicked
        currentQuery = $("#searchInput").val().trim(); // get input value
        if (!currentQuery) return; // stop if empty search
        currentPage = 1; // reset page to 1

        $("#collectionView").hide(); // hide collections
        $("#searchView").show(); // show search results

        searchMovies(); // call API search function
    });


    $("#collectionBtn").click(function () { // when collections clicked
        $("#searchView").hide(); // hide search view
        $("#collectionView").show(); // show collections view
        loadCollection(28, "#actionMovies"); // load action movies
        loadCollection(27, "#horrorMovies"); // load horror movies
    });

    function loadCollection(genre, container) { // load movies by genre
        $.get("https://api.themoviedb.org/3/discover/movie", { // API request
            api_key: API_KEY, // API key
            with_genres: genre // genre filter
        }).done(data => { // when data returns
            renderMovies(data.results, container); // render movies
        });
    }


    
    function searchMovies() { // search function
        $.get("https://api.themoviedb.org/3/search/movie", { // API request
            api_key: API_KEY, // API key
            query: currentQuery, // search text
            page: currentPage // page number
        }).done(data => { // when response comes back
            renderMovies(data.results, "#resultsGrid"); // show results
            buildControls(data.total_pages); // build pagination
        });
    }


    
    function formatMovies(movies) { // format API data
        return movies.map(m => ({ // loop through movies
            id: m.id, // movie ID
            title: m.title, // movie title
            poster: m.poster_path // poster image
                ? IMG + m.poster_path // if exists use image
                : "https://via.placeholder.com/200x300" // fallback image
        }));
    }


    
    function renderMovies(movies, container) { // render movies to UI
        const template = $("#movie-template").html(); // get template
        const slicedMovies = movies.slice(0, 10); // limit to 10 movies
        const formattedData = formatMovies(slicedMovies); // format data
        const html = Mustache.render(template, { // render Mustache
            movies: formattedData // pass data to template
        });

        $(container).html(html); 

        applyLayout(); 
    }


    
    function showDetails(movie) { // show selected movie details
        const template = $("#details-template").html(); // get template
        const data = { // build movie detail object
            poster: movie.poster_path // poster image
                ? "https://image.tmdb.org/t/p/w300" + movie.poster_path
                : "https://via.placeholder.com/300x450", // fallback image
            title: movie.title, // title
            release_date: movie.release_date || "N/A", // release date
            vote_average: movie.vote_average, // rating
            language: (movie.original_language || "N/A").toUpperCase(), // language
            overview: movie.overview || "No description available" // description
        };

        $("#movieDetails").html(Mustache.render(template, data)); 
    }


    
    $(document).on("click", ".movie-card", function () { // click movie card
        const id = $(this).data("id"); // get movie id
        $.get("https://api.themoviedb.org/3/movie/" + id, { // API request
            api_key: API_KEY // API key
        }).done(movie => showDetails(movie)); // show details

    });


    
    function buildControls(totalPages) { // build pagination controls
        const template = $("#controls-template").html(); // get template
        const pages = []; // store page buttons
        for (let i = 1; i <= Math.min(totalPages, 5); i++) { // limit pages
            pages.push({ // add page object
                number: i, // page number
                active: i === currentPage ? "active" : "" // active page
            });
        }

        
        const html = Mustache.render(template, { pages: pages }); // render controls
        $("#controls").html(html); // inject controls
        $(".page-btn").click(function () { // page click event
            currentPage = parseInt($(this).data("page")); // set page
            searchMovies(); // reload search
        });

        $("#gridBtn").click(() => { // grid view button
            layout = "grid"; // set grid mode
            applyLayout(); // apply layout
        });

        $("#listBtn").click(() => { // list view button
            layout = "list"; // set list mode
            applyLayout(); // apply layout
        });

        applyLayout(); // apply layout initially
    }


    function applyLayout() { // layout mode

        if (layout === "list") { // if list view
            $("#resultsGrid, #actionMovies, #horrorMovies").addClass("list-view"); // list style
        } else { // if grid view
            $("#resultsGrid, #actionMovies, #horrorMovies").removeClass("list-view"); // grid style
        }
    }

});
