$(document).ready(function () {

    const API_KEY = "YOUR_API_KEY";

    let currentQuery = "";
    let currentPage = 1;
    let currentGenre = null;

    // LOADER
    function showLoader() { $("#loader").removeClass("hidden"); }
    function hideLoader() { $("#loader").addClass("hidden"); }

    // SEARCH
    $("#searchBtn").click(function () {
        currentQuery = $("#searchInput").val().trim();
        if (!currentQuery) return;

        currentPage = 1;
        currentGenre = null;
        fetchSearch();
    });

    // GENRE FILTERS
    $(".genre-btn").click(function () {
        currentGenre = $(this).data("genre");
        currentQuery = "";
        currentPage = 1;
        fetchGenre();
    });

    // SEARCH API
    function fetchSearch() {
        showLoader();

        $.get("https://api.themoviedb.org/3/search/movie", {
            api_key: API_KEY,
            query: currentQuery,
            page: currentPage
        })
        .done(function (data) {
            displayMovies(data.results, "#resultsGrid");
            createPagination(data.total_pages, fetchSearch);
        })
        .fail(function () {
            alert("Search error");
        })
        .always(hideLoader);
    }

    // GENRE API
    function fetchGenre() {
        showLoader();

        $.get("https://api.themoviedb.org/3/discover/movie", {
            api_key: API_KEY,
            with_genres: currentGenre,
            page: currentPage
        })
        .done(function (data) {
            displayMovies(data.results, "#resultsGrid");
            createPagination(data.total_pages, fetchGenre);
        })
        .always(hideLoader);
    }

    // DISPLAY MOVIES
    function displayMovies(movies, container) {
        $(container).empty();

        movies.slice(0, 10).forEach(movie => {

            let poster = movie.poster_path
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : "https://via.placeholder.com/200x300";

            let card = $(`
                <div class="movie-card">
                    <img src="${poster}">
                    <p>${movie.title}</p>
                </div>
            `);

            card.click(() => showDetails(movie));

            $(container).append(card);
        });
    }

    // DETAILS VIEW
    function showDetails(movie) {

        let poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : "https://via.placeholder.com/300x450";

        $("#movieDetails").html(`
            <img src="${poster}">
            <h3>${movie.title}</h3>
            <p>${movie.overview || "No description"}</p>
        `);
    }

    // PAGINATION
    function createPagination(totalPages, callback) {

        $("#pagination").empty();

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {

            let btn = $(`<button class="page-btn">${i}</button>`);

            if (i === currentPage) btn.addClass("active");

            btn.click(() => {
                currentPage = i;
                callback();
            });

            $("#pagination").append(btn);
        }
    }

    // POPULAR MOVIES (REQUIRED FEATURE)
    $.get("https://api.themoviedb.org/3/movie/popular", {
        api_key: API_KEY
    })
    .done(function (data) {
        displayMovies(data.results, "#popularMovies");
    });

});
