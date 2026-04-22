$(document).ready(function () {
    const API_KEY = "4ecce31518d3c79af6da91dc53d038d5";
    const IMG = "https://image.tmdb.org/t/p/w200";
    const BASE = "https://api.themoviedb.org/3";

    let currentQuery = "";
    let currentPage = 1;
    let layout = "grid";
    let sessionId = localStorage.getItem("tmdb_session_id") || null;
    let accountId = localStorage.getItem("tmdb_account_id") || null;
    let username = localStorage.getItem("tmdb_username") || null;

    // ─── STORAGE HELPERS ─────────────────────────────────────────────────────

    function getList(key) {
        return JSON.parse(localStorage.getItem(key) || "[]");
    }

    function saveList(key, arr) {
        localStorage.setItem(key, JSON.stringify(arr));
    }

    function isInList(key, id) {
        return getList(key).some(m => m.id === id);
    }

    function addToList(key, movie) {
        const list = getList(key);
        if (!list.some(m => m.id === movie.id)) {
            list.push(movie);
            saveList(key, list);
        }
    }

    function removeFromList(key, id) {
        const list = getList(key).filter(m => m.id !== id);
        saveList(key, list);
    }

    function toggleList(key, movie) {
        if (isInList(key, movie.id)) {
            removeFromList(key, movie.id);
            return false;
        } else {
            addToList(key, movie);
            return true;
        }
    }

    // ─── AUTH STATE ───────────────────────────────────────────────────────────

    function updateAuthUI() {
        if (sessionId && username) {
            $("#authArea").hide();
            $("#userArea").show();
            $("#usernameDisplay").text("👤 " + username);
        } else {
            $("#authArea").show();
            $("#userArea").hide();
        }
    }

    updateAuthUI();

    // ─── LOGIN BUTTON → opens modal ──────────────────────────────────────────

    $("#loginBtn").click(function () {
        $("#authModal").show();
        $("#authError").text("");
        $("#tokenInput").val("");
    });

    $("#cancelAuthBtn, #modalBackdrop").click(function () {
        $("#authModal").hide();
    });

    // Step 1: get a request token and open TMDB approval page
    $("#startAuthBtn").click(function () {
        $("#authError").text("");
        $.get(BASE + "/authentication/token/new", { api_key: API_KEY })
            .done(function (data) {
                if (data.success) {
                    const token = data.request_token;
                    // Pre-fill the input with token so user can confirm easily
                    $("#tokenInput").val(token);
                    const approveUrl = "https://www.themoviedb.org/authenticate/" + token;
                    window.open(approveUrl, "_blank");
                    $("#authError").css("color", "#4caf50").text("✔ Approve access in the TMDB tab, then click 'Confirm & Login'.");
                } else {
                    $("#authError").css("color", "red").text("Failed to get request token.");
                }
            })
            .fail(function () {
                $("#authError").css("color", "red").text("Network error. Check your API key.");
            });
    });

    // Step 2: exchange approved request token for a session
    $("#confirmTokenBtn").click(function () {
        const token = $("#tokenInput").val().trim();
        if (!token) {
            $("#authError").css("color", "red").text("Please paste your request token.");
            return;
        }
        $("#authError").css("color", "#999").text("Creating session...");

        $.ajax({
            url: BASE + "/authentication/session/new",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ request_token: token }),
            headers: { "Authorization": "Bearer " + API_KEY }
        }).done(function (data) {
            if (data.success) {
                sessionId = data.session_id;
                localStorage.setItem("tmdb_session_id", sessionId);
                fetchAccountDetails();
            } else {
                $("#authError").css("color", "red").text("Session creation failed. Did you approve the token?");
            }
        }).fail(function (xhr) {
            // Fallback: try query-param style
            $.post(BASE + "/authentication/session/new?api_key=" + API_KEY, { request_token: token })
                .done(function (data) {
                    if (data.success) {
                        sessionId = data.session_id;
                        localStorage.setItem("tmdb_session_id", sessionId);
                        fetchAccountDetails();
                    } else {
                        $("#authError").css("color", "red").text("Token not approved yet. Please approve on TMDB first.");
                    }
                })
                .fail(function () {
                    $("#authError").css("color", "red").text("Error. Make sure you approved the token on TMDB.");
                });
        });
    });

    function fetchAccountDetails() {
        $.get(BASE + "/account", { api_key: API_KEY, session_id: sessionId })
            .done(function (data) {
                accountId = data.id;
                username = data.username;
                localStorage.setItem("tmdb_account_id", accountId);
                localStorage.setItem("tmdb_username", username);
                updateAuthUI();
                $("#authModal").hide();
                // Optionally sync TMDB favorites/watchlist to localStorage
                syncTMDBLists();
            })
            .fail(function () {
                $("#authError").css("color", "red").text("Session valid but failed to fetch account.");
            });
    }

    // Step 3: (Optional) sync remote TMDB favorites/watchlist into localStorage
    function syncTMDBLists() {
        if (!sessionId || !accountId) return;

        // Sync Favorites
        $.get(BASE + "/account/" + accountId + "/favorite/movies", {
            api_key: API_KEY,
            session_id: sessionId
        }).done(function (data) {
            if (data.results && data.results.length) {
                data.results.forEach(function (m) {
                    addToList("favorites", formatSingle(m));
                });
            }
        });

        // Sync Watchlist
        $.get(BASE + "/account/" + accountId + "/watchlist/movies", {
            api_key: API_KEY,
            session_id: sessionId
        }).done(function (data) {
            if (data.results && data.results.length) {
                data.results.forEach(function (m) {
                    addToList("watchlist", formatSingle(m));
                });
            }
        });
    }

    // POST to TMDB API if logged in, always mirror to localStorage
    function postToTMDB(mediaType, mediaId, listType, add) {
        if (!sessionId || !accountId) return;
        $.ajax({
            url: BASE + "/account/" + accountId + "/" + listType,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                media_type: mediaType,
                media_id: mediaId,
                [listType === "favorite" ? "favorite" : "watchlist"]: add
            }),
            data: JSON.stringify(
                listType === "favorite"
                    ? { media_type: mediaType, media_id: mediaId, favorite: add }
                    : { media_type: mediaType, media_id: mediaId, watchlist: add }
            ),
            headers: {
                "Content-Type": "application/json"
            },
            url: BASE + "/account/" + accountId + "/" + listType + "?api_key=" + API_KEY + "&session_id=" + sessionId
        });
    }

    // ─── LOGOUT ───────────────────────────────────────────────────────────────

    $("#logoutBtn").click(function () {
        if (sessionId) {
            $.ajax({
                url: BASE + "/authentication/session?api_key=" + API_KEY,
                method: "DELETE",
                contentType: "application/json",
                data: JSON.stringify({ session_id: sessionId })
            });
        }
        sessionId = null;
        accountId = null;
        username = null;
        localStorage.removeItem("tmdb_session_id");
        localStorage.removeItem("tmdb_account_id");
        localStorage.removeItem("tmdb_username");
        updateAuthUI();
    });

    // ─── VIEW SWITCHING ───────────────────────────────────────────────────────

    function showView(view) {
        $("#searchView, #collectionView, #listsView").hide();
        $(view).show();
    }

    $("#searchBtn").click(function () {
        currentQuery = $("#searchInput").val().trim();
        if (!currentQuery) return;
        currentPage = 1;
        showView("#searchView");
        searchMovies();
    });

    $("#collectionBtn").click(function () {
        showView("#collectionView");
        loadCollection(28, "#actionMovies");
        loadCollection(27, "#horrorMovies");
    });

    $("#listsBtn").click(function () {
        showView("#listsView");
        renderListsView("favorites");
    });

    // Default view
    showView("#searchView");

    // ─── TRENDING CAROUSEL ────────────────────────────────────────────────────

    function loadTrending() {
        $.get(BASE + "/trending/movie/week", { api_key: API_KEY })
            .done(function (data) {
                const movies = data.results.slice(0, 20);
                $("#carouselTrack").empty();
                movies.forEach(function (m) {
                    const poster = m.poster_path
                        ? "https://image.tmdb.org/t/p/w200" + m.poster_path
                        : "https://via.placeholder.com/200x300?text=No+Image";
                    const rating = m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A";
                    const favClass = isInList("favorites", m.id) ? "active" : "";
                    const watchClass = isInList("watchlist", m.id) ? "active" : "";

                    const card = $(`
                        <div class="carousel-card movie-card" data-id="${m.id}">
                            <img src="${poster}" alt="${m.title}">
                            <div class="carousel-card-info">
                                <p class="carousel-title">${m.title}</p>
                                <span class="carousel-rating">⭐ ${rating}</span>
                            </div>
                            <div class="card-actions">
                                <button class="fav-btn ${favClass}" data-id="${m.id}" title="Favorite">❤</button>
                                <button class="watch-btn ${watchClass}" data-id="${m.id}" title="Watchlist">🎬</button>
                            </div>
                        </div>
                    `);

                    $("#carouselTrack").append(card);
                    setTimeout(function () {
                        card.addClass("show");
                    }, 50);
                });
            });
    }

    loadTrending();

    // ─── CAROUSEL DRAG TO SCROLL ──────────────────────────────────────────────

    const $track = $("#carouselTrack");
    let isDragging = false;
    let dragStartX = 0;
    let scrollStartLeft = 0;

    $track.on("mousedown", function (e) {
        isDragging = true;
        dragStartX = e.pageX;
        scrollStartLeft = $track.scrollLeft();
        $track.addClass("dragging");
        e.preventDefault();
    });

    $(document).on("mousemove", function (e) {
        if (!isDragging) return;
        const dx = e.pageX - dragStartX;
        $track.scrollLeft(scrollStartLeft - dx);
    });

    $(document).on("mouseup mouseleave", function () {
        if (isDragging) {
            isDragging = false;
            $track.removeClass("dragging");
        }
    });

    // ─── LISTS TABS ───────────────────────────────────────────────────────────

    $(document).on("click", ".list-tab", function () {
        $(".list-tab").removeClass("active");
        $(this).addClass("active");
        const which = $(this).data("list");
        renderListsView(which);
    });

    function renderListsView(which) {
        if (which === "favorites") {
            $("#favoritesPanel").show();
            $("#watchlistPanel").hide();
            renderStoredList("favorites", "#favoritesList", "#favEmpty");
        } else {
            $("#favoritesPanel").hide();
            $("#watchlistPanel").show();
            renderStoredList("watchlist", "#watchlistList", "#watchEmpty");
        }
    }

    function renderStoredList(key, container, emptyMsg) {
        const items = getList(key);
        if (!items.length) {
            $(container).html("");
            $(emptyMsg).show();
            return;
        }
        $(emptyMsg).hide();
        const template = $("#movie-template").html();
        const html = Mustache.render(template, {
            movies: items.map(m => ({
                ...m,
                favClass: isInList("favorites", m.id) ? "active" : "",
                watchClass: isInList("watchlist", m.id) ? "active" : ""
            }))
        });
        $(container).html(html);
    }

    // ─── COLLECTIONS ─────────────────────────────────────────────────────────

    function loadCollection(genre, container) {
        $.get(BASE + "/discover/movie", {
            api_key: API_KEY,
            with_genres: genre
        }).done(data => renderMovies(data.results, container));
    }

    // ─── SEARCH ───────────────────────────────────────────────────────────────

    function searchMovies() {
        $.get(BASE + "/search/movie", {
            api_key: API_KEY,
            query: currentQuery,
            page: currentPage
        }).done(data => {
            renderMovies(data.results, "#resultsGrid");
            buildControls(data.total_pages);
        });
    }

    // ─── FORMAT HELPERS ───────────────────────────────────────────────────────

    function formatSingle(m) {
        return {
            id: m.id,
            title: m.title,
            poster: m.poster_path ? IMG + m.poster_path : "https://via.placeholder.com/200x300",
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
            favClass: isInList("favorites", m.id) ? "active" : "",
            watchClass: isInList("watchlist", m.id) ? "active" : ""
        }));
    }

    // ─── RENDER ───────────────────────────────────────────────────────────────

    function renderMovies(movies, container) {
        const template = $("#movie-template").html();
        const slicedMovies = movies.slice(0, 10);
        const html = Mustache.render(template, { movies: formatMovies(slicedMovies) });
        $(container).html(html);
        applyLayout();
    }

    function showDetails(movie) {
        const template = $("#details-template").html();
        const id = movie.id;
        const data = {
            id: id,
            poster: movie.poster_path
                ? "https://image.tmdb.org/t/p/w300" + movie.poster_path
                : "https://via.placeholder.com/300x450",
            title: movie.title,
            release_date: movie.release_date || "N/A",
            vote_average: movie.vote_average,
            language: (movie.original_language || "N/A").toUpperCase(),
            overview: movie.overview || "No description available",
            favClass: isInList("favorites", id) ? "active" : "",
            favLabel: isInList("favorites", id) ? "Remove Favorite" : "Add Favorite",
            watchClass: isInList("watchlist", id) ? "active" : "",
            watchLabel: isInList("watchlist", id) ? "Remove Watchlist" : "Add Watchlist"
        };
        $("#movieDetails").html(Mustache.render(template, data));
        // Store movie data for detail panel toggle
        $("#movieDetails").data("movie", movie);
    }

    // ─── CLICK HANDLERS ───────────────────────────────────────────────────────

    // Movie card click → show details
    $(document).on("click", ".movie-card", function (e) {
        if ($(e.target).is("button, .fav-btn, .watch-btn")) return;
        const id = $(this).data("id");
        $.get(BASE + "/movie/" + id, { api_key: API_KEY })
            .done(movie => showDetails(movie));
    });

    // Favorite toggle
    $(document).on("click", ".fav-btn", function (e) {
        e.stopPropagation();
        const id = parseInt($(this).data("id"));
        // Find movie object from current rendered context
        fetchAndToggle("favorites", id, $(this));
    });

    // Watchlist toggle
    $(document).on("click", ".watch-btn", function (e) {
        e.stopPropagation();
        const id = parseInt($(this).data("id"));
        fetchAndToggle("watchlist", id, $(this));
    });

    function fetchAndToggle(listKey, id, $btn) {
        // Try to get full movie data from API so we have all fields for the list
        $.get(BASE + "/movie/" + id, { api_key: API_KEY })
            .done(function (movie) {
                const added = toggleList(listKey, formatSingle(movie));

                // Update all matching buttons on page
                $(".fav-btn[data-id='" + id + "'], .watch-btn[data-id='" + id + "']").each(function () {
                    if ($(this).hasClass("fav-btn")) {
                        $(this).toggleClass("active", isInList("favorites", id));
                    }
                    if ($(this).hasClass("watch-btn")) {
                        $(this).toggleClass("active", isInList("watchlist", id));
                    }
                });

                // Update detail panel if it's showing this movie
                const detailMovie = $("#movieDetails").data("movie");
                if (detailMovie && detailMovie.id === id) {
                    showDetails(detailMovie);
                }

                // If in lists view, re-render
                if ($("#listsView").is(":visible")) {
                    const activeTab = $(".list-tab.active").data("list");
                    renderListsView(activeTab);
                }

                // POST to TMDB API if logged in
                const tmdbKey = listKey === "favorites" ? "favorite" : "watchlist";
                postToTMDB("movie", id, tmdbKey, added);
            });
    }

    // ─── PAGINATION / LAYOUT ─────────────────────────────────────────────────

    function buildControls(totalPages) {
        const template = $("#controls-template").html();
        const pages = [];
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push({ number: i, active: i === currentPage ? "active" : "" });
        }
        const html = Mustache.render(template, { pages });
        $("#controls").html(html);

        $(".page-btn").click(function () {
            currentPage = parseInt($(this).data("page"));
            searchMovies();
        });

        $("#gridBtn").click(() => { layout = "grid"; applyLayout(); });
        $("#listBtn").click(() => { layout = "list"; applyLayout(); });
        applyLayout();
    }

    function applyLayout() {
        if (layout === "list") {
            $("#resultsGrid, #actionMovies, #horrorMovies, #favoritesList, #watchlistList").addClass("list-view");
        } else {
            $("#resultsGrid, #actionMovies, #horrorMovies, #favoritesList, #watchlistList").removeClass("list-view");
        }
    }
});
