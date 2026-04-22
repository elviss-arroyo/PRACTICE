$(document).ready(function () {
    const API_KEY = "4ecce31518d3c79af6da91dc53d038d5"; 
    const IMG = "https://image.tmdb.org/t/p/w200";

    let currentQuery = ""; 
    let currentPage = 1; 
    let layout = "grid"; 

    // --- NAVIGATION ---
    function switchView(viewId) {
        $("#searchView, #collectionView, #watchlistView").hide();
        $(viewId).show();
    }

    $("#searchBtn").click(function () {
        currentQuery = $("#searchInput").val().trim();
        if (!currentQuery) return;
        currentPage = 1;
        switchView("#searchView");
        searchMovies();
    });

    $("#collectionBtn").click(function () {
        switchView("#collectionView");
        loadCollection(28, "#actionMovies");
        loadCollection(27, "#horrorMovies");
    });

    $("#watchlistBtn").click(function() {
        switchView("#watchlistView");
        renderWatchlist();
    });

    // --- API FUNCTIONS ---
    function loadCollection(genre, container) {
        $.get("https://api.themoviedb.org/3/discover/movie", {
            api_key: API_KEY,
            with_genres: genre
        }).done(data => renderMovies(data.results, container));
    }

    function searchMovies() {
        $.get("https://api.themoviedb.org/3/search/movie", {
            api_key: API_KEY,
            query: currentQuery,
            page: currentPage
        }).done(data => {
            renderMovies(data.results, "#resultsGrid");
            buildControls(data.total_pages);
        });
    }

    // --- RENDERING ---
    function formatMovies(movies) {
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            poster: m.poster_path ? IMG + m.poster_path : "https://via.placeholder.com/200x300"
        }));
    }

    function renderMovies(movies, container) {
        const template = $("#movie-template").html();
        const formattedData = formatMovies(movies.slice(0, 10));
        const html = Mustache.render(template, { movies: formattedData });
        $(container).html(html);
        applyLayout();
    }

    function showDetails(movie) {
        const template = $("#details-template").html();
        const data = {
            id: movie.id,
            poster: movie.poster_path ? "https://image.tmdb.org/t/p/w300" + movie.poster_path : "https://via.placeholder.com/300x450",
            poster_path: movie.poster_path,
            title: movie.title,
            release_date: movie.release_date || "N/A",
            vote_average: movie.vote_average,
            language: (movie.original_language || "N/A").toUpperCase(),
            overview: movie.overview || "No description available"
        };
        $("#movieDetails").html(Mustache.render(template, data));
    }

    // --- WATCHLIST LOGIC (Local Storage) ---
    $(document).on("click", ".watchlist-toggle-btn", function() {
        const movieData = {
            id: $(this).data("id"),
            title: $(this).data("title"),
            poster_path: $(this).data("poster")
        };
        let list = JSON.parse(localStorage.getItem("myWatchlist")) || [];
        const index = list.findIndex(m => m.id === movieData.id);

        if (index === -1) {
            list.push(movieData);
            alert("Added to Watchlist");
        } else {
            list.splice(index, 1);
            alert("Removed from Watchlist");
        }
        localStorage.setItem("myWatchlist", JSON.stringify(list));
        if ($("#watchlistView").is(":visible")) renderWatchlist();
    });

    function renderWatchlist() {
        const list = JSON.parse(localStorage.getItem("myWatchlist")) || [];
        renderMovies(list, "#watchlistGrid");
    }

    // --- AUTHENTICATION (Optional/Advanced) ---
    $("#loginBtn").click(function() {
        $.get("https://api.themoviedb.org/3/authentication/token/new", { api_key: API_KEY })
        .done(resp => {
            const token = resp.request_token;
            window.location.href = `https://www.themoviedb.org/authenticate/${token}?redirect_to=${window.location.href}`;
        });
    });

    // --- EVENT LISTENERS ---
    $(document).on("click", ".movie-card", function () {
        const id = $(this).data("id");
        $.get("https://api.themoviedb.org/3/movie/" + id, { api_key: API_KEY })
        .done(movie => showDetails(movie));
    });

    function buildControls(totalPages) {
        const template = $("#controls-template").html();
        const pages = [];
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push({ number: i, active: i === currentPage ? "active" : "" });
        }
        $("#controls").html(Mustache.render(template, { pages: pages }));
        
        $(".page-btn").off().click(function () {
            currentPage = parseInt($(this).data("page"));
            searchMovies();
