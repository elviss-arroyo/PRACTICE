$(document).ready(function () {


                    // THIS PART IS THE API SETUP AND GLOBAL STATE
    const API_KEY  = "4ecce31518d3c79af6da91dc53d038d5";
    const IMG_SM   = "https://image.tmdb.org/t/p/w200";
    const IMG_MD   = "https://image.tmdb.org/t/p/w342";
    const IMG_LG   = "https://image.tmdb.org/t/p/w500";
    const IMG_CAST = "https://image.tmdb.org/t/p/w185";
    const BASE     = "https://api.themoviedb.org/3";

    let currentQuery      = "";
    let currentPage       = 1;
    let layout            = "grid";
    let activeGenreId     = null;
    let discoverPage      = 1;
    let sessionId         = localStorage.getItem("tmdb_session_id") || null;
    let accountId         = localStorage.getItem("tmdb_account_id") || null;
    let username          = localStorage.getItem("tmdb_username")   || null;


                    // THIS PART IS THE LIST OF ALL TMDB GENRES
    const GENRES = [
        { id: 28,    name: "Action"      },
        { id: 12,    name: "Adventure"   },
        { id: 16,    name: "Animation"   },
        { id: 35,    name: "Comedy"      },
        { id: 80,    name: "Crime"       },
        { id: 99,    name: "Documentary" },
        { id: 18,    name: "Drama"       },
        { id: 10751, name: "Family"      },
        { id: 14,    name: "Fantasy"     },
        { id: 36,    name: "History"     },
        { id: 27,    name: "Horror"      },
        { id: 10402, name: "Music"       },
        { id: 9648,  name: "Mystery"     },
        { id: 10749, name: "Romance"     },
        { id: 878,   name: "Sci-Fi"      }
    ];


                    // THIS PART IS LOCAL STORAGE — SAVING AND READING FAVORITES/WATCHLIST
    function getList(key)       { return JSON.parse(localStorage.getItem(key) || "[]"); }
    function saveList(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
    function isInList(key, id)  { return getList(key).some(m => m.id === id); }

    function addToList(key, movie) {
        const list = getList(key);
        if (!list.some(m => m.id === movie.id)) { list.push(movie); saveList(key, list); }
    }

    function removeFromList(key, id) { saveList(key, getList(key).filter(m => m.id !== id)); }

    function toggleList(key, movie) {
        if (isInList(key, movie.id)) { removeFromList(key, movie.id); return false; }
        addToList(key, movie); return true;
    }


                    // THIS PART IS THE LOGIN/LOGOUT UI AND TMDB AUTHENTICATION FLOW
    function updateAuthUI() {
        if (sessionId && username) {
            $("#authArea").hide();
            $("#userArea").show();
            $("#usernameDisplay").text(username);
        } else {
            $("#authArea").show();
            $("#userArea").hide();
        }
    }
    updateAuthUI();

    $("#loginBtn").click(() => { $("#authModal").show(); $("#authError").text(""); $("#tokenInput").val(""); });
    $("#cancelAuthBtn, #modalBackdrop").click(() => $("#authModal").hide());

    $("#startAuthBtn").click(function () {
        $("#authError").text("");
        $.get(BASE + "/authentication/token/new", { api_key: API_KEY })
            .done(function (data) {
                if (data.success) {
                    $("#tokenInput").val(data.request_token);
                    window.open("https://www.themoviedb.org/authenticate/" + data.request_token, "_blank");
                } else {
                    $("#authError").css("color", "#e74c3c").text("Failed to get request token.");
                }
            })
            .fail(() => $("#authError").css("color", "#e74c3c").text("Network error."));
    });

    $("#confirmTokenBtn").click(function () {
        const token = $("#tokenInput").val().trim();
        if (!token) { $("#authError").css("color", "#e74c3c").text("Please paste your request token."); return; }
        $("#authError").css("color", "#999").text("Creating session...");

        $.post(BASE + "/authentication/session/new?api_key=" + API_KEY, { request_token: token })
            .done(function (data) {
                if (data.success) {
                    sessionId = data.session_id;
                    localStorage.setItem("tmdb_session_id", sessionId);
                    fetchAccountDetails();
                } else {
                    $("#authError").css("color", "#e74c3c").text("Token not approved yet.");
                }
            })
            .fail(() => $("#authError").css("color", "#e74c3c").text("Error. Approve the token on TMDB first."));
    });

    function fetchAccountDetails() {
        $.get(BASE + "/account", { api_key: API_KEY, session_id: sessionId })
            .done(function (data) {
                accountId = data.id; username = data.username;
                localStorage.setItem("tmdb_account_id", accountId);
                localStorage.setItem("tmdb_username", username);
                updateAuthUI();
                $("#authModal").hide();
                syncTMDBLists();
            })
            .fail(() => $("#authError").css("color", "#e74c3c").text("Session valid but failed to fetch account."));
    }

    function syncTMDBLists() {
        if (!sessionId || !accountId) return;
        $.get(BASE + "/account/" + accountId + "/favorite/movies", { api_key: API_KEY, session_id: sessionId })
            .done(data => data.results && data.results.forEach(m => addToList("favorites", formatSingle(m))));
        $.get(BASE + "/account/" + accountId + "/watchlist/movies", { api_key: API_KEY, session_id: sessionId })
            .done(data => data.results && data.results.forEach(m => addToList("watchlist", formatSingle(m))));
    }

    function postToTMDB(listType, mediaId, add) {
        if (!sessionId || !accountId) return;
        const body = listType === "favorite"
            ? { media_type: "movie", media_id: mediaId, favorite: add }
            : { media_type: "movie", media_id: mediaId, watchlist: add };
        $.ajax({
            url: BASE + "/account/" + accountId + "/" + listType + "?api_key=" + API_KEY + "&session_id=" + sessionId,
            method: "POST", contentType: "application/json", data: JSON.stringify(body)
        });
    }

    $("#logoutBtn").click(function () {
        if (sessionId) {
            $.ajax({ url: BASE + "/authentication/session?api_key=" + API_KEY, method: "DELETE",
                contentType: "application/json", data: JSON.stringify({ session_id: sessionId }) });
        }
        sessionId = accountId = username = null;
        ["tmdb_session_id","tmdb_account_id","tmdb_username"].forEach(k => localStorage.removeItem(k));
        updateAuthUI();
    });


                    // THIS PART IS VIEW SWITCHING — SHOWS/HIDES THE MAIN SECTIONS
    function showView(view) {
        $("#searchView, #discoverView, #collectionView, #listsView").hide();
        $(view).show();
    }

    $("#searchBtn").click(function () {
        currentQuery = $("#searchInput").val().trim();
        if (!currentQuery) return;
        currentPage = 1;
        showView("#searchView");
        searchMovies();
    });

    $("#searchInput").keypress(function (e) {
        if (e.which === 13) $("#searchBtn").trigger("click");
    });

    $("#discoverBtn").click(function () {
        showView("#discoverView");
        buildGenreChips();
        if (!activeGenreId) loadDiscover();
    });

    $("#collectionBtn").click(function () {
        showView("#collectionView");
        loadTopRated("#topRatedMovies");
        loadMostPopular("#mostPopularMovies");
    });

    $("#listsBtn").click(function () {
        showView("#listsView");
        renderListsView("favorites");
    });

    $("#sortSelect").change(function () {
        discoverPage = 1;
        loadDiscover();
    });

    showView("#searchView");


                    // THIS PART IS THE GENRE CHIP BUTTONS IN THE DISCOVER VIEW
    function buildGenreChips() {
        if ($("#genreChips").children().length) return;
        GENRES.forEach(function (g) {
            const chip = $(`<button class="genre-chip" data-id="${g.id}">${g.name}</button>`);
            $("#genreChips").append(chip);
        });
    }

    $(document).on("click", ".genre-chip", function () {
        $(".genre-chip").removeClass("active");
        $(this).addClass("active");
        activeGenreId = parseInt($(this).data("id"));
        discoverPage = 1;
        loadDiscover();
    });


                    // THIS PART IS THE DISCOVER VIEW — FETCHES AND DISPLAYS FILTERED MOVIES
    function loadDiscover() {
        const params = {
            api_key:           API_KEY,
            sort_by:           $("#sortSelect").val() || "popularity.desc",
            page:              discoverPage,
            "vote_count.gte":  50
        };
        if (activeGenreId) params.with_genres = activeGenreId;

        $.get(BASE + "/discover/movie", params)
            .done(function (data) {
                renderMovies(data.results, "#discoverGrid");
                buildDiscoverControls(data.total_pages);
            });
    }

    function buildDiscoverControls(totalPages) {
        const template = $("#discover-controls-template").html();
        const pages = [];
        for (let i = 1; i <= Math.min(totalPages, 5); i++)
            pages.push({ number: i, active: i === discoverPage ? "active" : "" });

        $("#discoverControls").html(Mustache.render(template, { pages }));

        $(".discover-page-btn").click(function () {
            discoverPage = parseInt($(this).data("page"));
            loadDiscover();
        });

        $("#discoverGridBtn").click(() => { layout = "grid"; applyLayout(); });
        $("#discoverListBtn").click(() => { layout = "list"; applyLayout(); });

        applyLayout();
    }


                    // THIS PART IS THE MY LISTS VIEW — FAVORITES AND WATCHLIST TABS
    $(document).on("click", ".list-tab", function () {
        $(".list-tab").removeClass("active");
        $(this).addClass("active");
        renderListsView($(this).data("list"));
    });

    function renderListsView(which) {
        if (which === "favorites") {
            $("#favoritesPanel").show(); $("#watchlistPanel").hide();
            renderStoredList("favorites", "#favoritesList", "#favEmpty");
        } else {
            $("#favoritesPanel").hide(); $("#watchlistPanel").show();
            renderStoredList("watchlist", "#watchlistList", "#watchEmpty");
        }
    }

    function renderStoredList(key, container, emptyMsg) {
        const items = getList(key);
        if (!items.length) { $(container).html(""); $(emptyMsg).show(); return; }
        $(emptyMsg).hide();
        const template = $("#movie-template").html();
        $(container).html(Mustache.render(template, {
            movies: items.map(m => ({
                ...m,
                rating:     m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A",
                favClass:   isInList("favorites", m.id) ? "active" : "",
                watchClass: isInList("watchlist",  m.id) ? "active" : ""
            }))
        }));
    }


                    // THIS PART IS THE COLLECTIONS VIEW — TOP RATED AND MOST POPULAR
    function loadTopRated(container) {
        $.get(BASE + "/movie/top_rated", { api_key: API_KEY, page: 1 })
            .done(data => renderMovies(data.results, container));
    }

    function loadMostPopular(container) {
        $.get(BASE + "/movie/popular", { api_key: API_KEY, page: 1 })
            .done(data => renderMovies(data.results, container));
    }


                    // THIS PART IS THE SEARCH — FETCHES RESULTS BY QUERY
    function searchMovies() {
        $.get(BASE + "/search/movie", { api_key: API_KEY, query: currentQuery, page: currentPage })
            .done(data => {
                renderMovies(data.results, "#resultsGrid");
                buildControls(data.total_pages);
            });
    }


                    // THIS PART IS DATA FORMATTING — SHAPES API RESPONSES INTO USABLE OBJECTS
    function formatSingle(m) {
        return {
            id: m.id,
            title: m.title,
            poster: m.poster_path ? IMG_SM + m.poster_path : "https://via.placeholder.com/200x300/1c1c1c/666?text=No+Image",
            poster_path: m.poster_path,
            release_date: m.release_date || "N/A",
            vote_average: m.vote_average,
            original_language: m.original_language || "N/A",
            overview: m.overview || "No description available"
        };
    }

    function formatMovies(movies) {
        return movies.map(m => ({
            ...formatSingle(m),
            rating:     m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A",
            favClass:   isInList("favorites", m.id) ? "active" : "",
            watchClass: isInList("watchlist",  m.id) ? "active" : ""
        }));
    }


                    // THIS PART IS RENDERING — PUTS MOVIE CARDS INTO THE GRID
    function renderMovies(movies, container) {
        const template = $("#movie-template").html();
        const html = Mustache.render(template, { movies: formatMovies(movies.slice(0, 20)) });
        $(container).html(html);
        applyLayout();
    }


                    // THIS PART IS THE DETAILS PANEL — SHOWS MOVIE INFO AND CAST ON THE RIGHT
    function showDetails(movie) {
        const id = movie.id;
        const data = {
            id,
            poster:       movie.poster_path ? IMG_LG + movie.poster_path : "https://via.placeholder.com/500x750/1c1c1c/666?text=No+Image",
            title:        movie.title,
            release_date: movie.release_date || "N/A",
            vote_average: movie.vote_average ? parseFloat(movie.vote_average).toFixed(1) : "N/A",
            language:     (movie.original_language || "N/A").toUpperCase(),
            overview:     movie.overview || "No description available",
            favClass:     isInList("favorites", id) ? "active" : "",
            favLabel:     isInList("favorites", id) ? "Remove"  : "Favorite",
            watchClass:   isInList("watchlist",  id) ? "active" : "",
            watchLabel:   isInList("watchlist",  id) ? "Remove"  : "Watchlist"
        };

        const template = $("#details-template").html();
        $("#movieDetails").html(Mustache.render(template, data)).data("movie", movie);

        $.get(BASE + "/movie/" + id + "/credits", { api_key: API_KEY })
            .done(function (credits) {
                const cast = credits.cast.slice(0, 3);
                if (!cast.length) return;

                const director = credits.crew.find(p => p.job === "Director");

                let castHTML = '<div class="cast-section">';
                if (director) {
                    castHTML += `<p class="director-line"><b>Director:</b> ${$('<div>').text(director.name).html()}</p>`;
                }
                castHTML += '<h4>Cast</h4><div class="cast-list">';

                cast.forEach(function (actor) {
                    const photo = actor.profile_path
                        ? IMG_CAST + actor.profile_path
                        : "https://via.placeholder.com/185x278/252525/666?text=?";
                    const name = $('<div>').text(actor.name).html();
                    const char = $('<div>').text(actor.character).html();
                    castHTML += `
                        <div class="cast-card">
                            <img src="${photo}" alt="${name}" loading="lazy">
                            <p class="cast-name">${name}</p>
                            <p class="cast-char">${char}</p>
                        </div>`;
                });

                castHTML += '</div></div>';
                $("#movieDetails").append(castHTML);
            });
    }


                    // THIS PART IS CLICK HANDLING — CARD CLICKS, FAVORITE, AND WATCHLIST TOGGLES
    $(document).on("click", ".movie-card", function (e) {
        if ($(e.target).is(".fav-btn, .watch-btn")) return;
        const id = $(this).data("id");
        $.get(BASE + "/movie/" + id, { api_key: API_KEY }).done(movie => showDetails(movie));
    });

    $(document).on("click", ".fav-btn", function (e) {
        e.stopPropagation();
        fetchAndToggle("favorites", parseInt($(this).data("id")));
    });

    $(document).on("click", ".watch-btn", function (e) {
        e.stopPropagation();
        fetchAndToggle("watchlist", parseInt($(this).data("id")));
    });

    function fetchAndToggle(listKey, id) {
        $.get(BASE + "/movie/" + id, { api_key: API_KEY }).done(function (movie) {
            const added = toggleList(listKey, formatSingle(movie));
            $(`.fav-btn[data-id='${id}']`).toggleClass("active", isInList("favorites", id));
            $(`.watch-btn[data-id='${id}']`).toggleClass("active", isInList("watchlist", id));
            const detailMovie = $("#movieDetails").data("movie");
            if (detailMovie && detailMovie.id === id) showDetails(detailMovie);
            if ($("#listsView").is(":visible")) renderListsView($(".list-tab.active").data("list"));
            postToTMDB(listKey === "favorites" ? "favorite" : "watchlist", id, added);
        });
    }


                    // THIS PART IS THE TRENDING CAROUSEL AT THE TOP OF THE PAGE
    function loadTrending() {
        $.get(BASE + "/trending/movie/week", { api_key: API_KEY })
            .done(function (data) {
                const movies = data.results.slice(0, 20);
                $("#carouselTrack").empty();
                movies.forEach(function (m) {
                    const poster     = m.poster_path ? IMG_MD + m.poster_path : "https://via.placeholder.com/342x513/1c1c1c/666?text=No+Image";
                    const rating     = m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A";
                    const favClass   = isInList("favorites", m.id) ? "active" : "";
                    const watchClass = isInList("watchlist",  m.id) ? "active" : "";
                    const safeTitle  = $('<div>').text(m.title).html();

                    const card = $(`
                        <div class="carousel-card movie-card" data-id="${m.id}">
                            <div class="card-poster">
                                <img src="${poster}" alt="${safeTitle}" loading="lazy">
                                <div class="card-overlay">
                                    <button class="fav-btn ${favClass}" data-id="${m.id}" title="Favorite">❤</button>
                                    <button class="watch-btn ${watchClass}" data-id="${m.id}" title="Watchlist">＋</button>
                                </div>
                            </div>
                            <div class="card-info">
                                <p class="card-title">${safeTitle}</p>
                                <span class="card-rating">⭐ ${rating}</span>
                            </div>
                        </div>
                    `);

                    $("#carouselTrack").append(card);
                    setTimeout(() => card.addClass("show"), 50);
                });
            });
    }

    loadTrending();


                    // THIS PART IS DRAG-TO-SCROLL ON THE CAROUSEL
    const $track = $("#carouselTrack");
    let isDragging = false, dragStartX = 0, scrollStart = 0;

    $track.on("mousedown", function (e) {
        isDragging = true; dragStartX = e.pageX; scrollStart = $track.scrollLeft();
        $track.addClass("dragging"); e.preventDefault();
    });
    $(document).on("mousemove", function (e) {
        if (!isDragging) return;
        $track.scrollLeft(scrollStart - (e.pageX - dragStartX));
    });
    $(document).on("mouseup", function () {
        if (isDragging) { isDragging = false; $track.removeClass("dragging"); }
    });


                    // THIS PART IS PAGINATION AND GRID/LIST LAYOUT TOGGLE FOR SEARCH RESULTS
    function buildControls(totalPages) {
        const template = $("#controls-template").html();
        const pages = [];
        for (let i = 1; i <= Math.min(totalPages, 5); i++)
            pages.push({ number: i, active: i === currentPage ? "active" : "" });

        $("#controls").html(Mustache.render(template, { pages }));

        $(".page-btn").click(function () { currentPage = parseInt($(this).data("page")); searchMovies(); });
        $("#gridBtn").click(() => { layout = "grid"; applyLayout(); });
        $("#listBtn").click(() => { layout = "list";  applyLayout(); });
        applyLayout();
    }

    function applyLayout() {
        const grids = $("#resultsGrid, #discoverGrid, #topRatedMovies, #mostPopularMovies, #favoritesList, #watchlistList");
        if (layout === "list") grids.addClass("list-view");
        else grids.removeClass("list-view");
    }
});
