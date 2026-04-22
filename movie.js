$(document).ready(function () {

const API_KEY = "4ecce31518d3c79af6da91dc53d038d5";
const IMG = "https://image.tmdb.org/t/p/w200";

const FAVORITES_KEY = "favorites";
const WATCHLIST_KEY = "watchlist";

let currentQuery = "";
let currentPage = 1;
let layout = "grid";
let currentMovieData = null;

/* ---------------- STORAGE ---------------- */

function getStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* ---------------- TOGGLES ---------------- */

function toggleFavorite(movie) {
    let favs = getStorage(FAVORITES_KEY);

    const exists = favs.find(m => m.id === movie.id);

    if (exists) {
        favs = favs.filter(m => m.id !== movie.id);
    } else {
        favs.push(movie);
    }

    saveStorage(FAVORITES_KEY, favs);
    renderFavorites();
}

function toggleWatchlist(movie) {
    let list = getStorage(WATCHLIST_KEY);

    const exists = list.find(m => m.id === movie.id);

    if (exists) {
        list = list.filter(m => m.id !== movie.id);
    } else {
        list.push(movie);
    }

    saveStorage(WATCHLIST_KEY, list);
    renderWatchlist();
}

/* ---------------- RENDER SAVED ---------------- */

function renderFavorites() {
    renderMovies(getStorage(FAVORITES_KEY), "#favoritesMovies");
}

function renderWatchlist() {
    renderMovies(getStorage(WATCHLIST_KEY), "#watchlistMovies");
}

/* ---------------- INIT ---------------- */

$("#searchView").show();
$("#collectionView, #favoritesView, #watchlistView").hide();

/* ---------------- NAV ---------------- */

$("#searchBtn").click(function () {
    currentQuery = $("#searchInput").val().trim();
    if (!currentQuery) return;

    currentPage = 1;

    $("#searchView").show();
    $("#collectionView, #favoritesView, #watchlistView").hide();

    searchMovies();
});

$("#collectionBtn").click(function () {
    $("#searchView, #favoritesView, #watchlistView").hide();
    $("#collectionView").show();

    loadCollection(28, "#actionMovies");
    loadCollection(27, "#horrorMovies");
});

$("#favoritesBtn").click(function () {
    $("#searchView, #collectionView, #watchlistView").hide();
    $("#favoritesView").show();
    renderFavorites();
});

$("#watchlistBtn").click(function () {
    $("#searchView, #collectionView, #favoritesView").hide();
    $("#watchlistView").show();
    renderWatchlist();
});

/* ---------------- API ---------------- */

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

function loadCollection(genre, container) {
    $.get("https://api.themoviedb.org/3/discover/movie", {
        api_key: API_KEY,
        with_genres: genre
    }).done(data => {
        renderMovies(data.results, container);
    });
}

/* ---------------- RENDER MOVIES ---------------- */

function formatMovies(movies) {
    return (movies || []).map(m => ({
        id: m.id,
        title: m.title,
        poster: m.poster_path
            ? IMG + m.poster_path
            : "https://via.placeholder.com/200x300"
    }));
}

function renderMovies(movies, container) {
    const template = $("#movie-template").html();
    const data = formatMovies((movies || []).slice(0, 10));

    const html = Mustache.render(template, { movies: data });
    $(container).html(html);

    applyLayout();
}

/* ---------------- DETAILS ---------------- */

function showDetails(movie) {
    currentMovieData = movie;

    const template = $("#details-template").html();

    const data = {
        poster: movie.poster_path
            ? "https://image.tmdb.org/t/p/w300" + movie.poster_path
            : "https://via.placeholder.com/300x450",
        title: movie.title,
        release_date: movie.release_date || "N/A",
        vote_average: movie.vote_average,
        language: (movie.original_language || "N/A").toUpperCase(),
        overview: movie.overview || "No description available"
    };

    $("#movieDetails").html(Mustache.render(template, data));
}

/* ---------------- CLICK MOVIE ---------------- */

$(document).on("click", ".movie-card", function () {
    const id = $(this).data("id");

    $.get("https://api.themoviedb.org/3/movie/" + id, {
        api_key: API_KEY
    }).done(movie => showDetails(movie));
});

/* ---------------- FAVORITE / WATCHLIST BUTTONS ---------------- */

$(document).on("click", "#addFavoriteBtn", function () {
    toggleFavorite(currentMovieData);
});

$(document).on("click", "#addWatchlistBtn", function () {
    toggleWatchlist(currentMovieData);
});

/* ---------------- PAGINATION ---------------- */

function buildControls(totalPages) {
    const template = $("#controls-template").html();

    let pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        pages.push({
            number: i,
            active: i === currentPage ? "active" : ""
        });
    }

    $("#controls").html(Mustache.render(template, { pages }));

    $(".page-btn").click(function () {
        currentPage = parseInt($(this).data("page"));
        searchMovies();
    });

    $("#gridBtn").click(() => {
        layout = "grid";
        applyLayout();
    });

    $("#listBtn").click(() => {
        layout = "list";
        applyLayout();
    });
}

/* ---------------- LAYOUT ---------------- */

function applyLayout() {
    if (layout === "list") {
        $("#resultsGrid, #actionMovies, #horrorMovies, #favoritesMovies, #watchlistMovies")
            .addClass("list-view");
    } else {
        $("#resultsGrid, #actionMovies, #horrorMovies, #favoritesMovies, #watchlistMovies")
            .removeClass("list-view");
    }
}

});
