$(document).ready(function () {

    var myApiKey = "4ecce31518d3c79af6da91dc53d038d5";
    var smallPic = "https://image.tmdb.org/t/p/w200";
    var medPic = "https://image.tmdb.org/t/p/w342";
    var bigPic = "https://image.tmdb.org/t/p/w500";
    var castPic = "https://image.tmdb.org/t/p/w185";
    var theUrl = "https://api.themoviedb.org/3";

    var searchWord = "";
    var pageNum = 1;
    var viewType = "grid";
    var genreSelected = null;
    var discoverPageNum = 1;
    var mySession = localStorage.getItem("tmdb_session_id") || null;
    var myAccount = localStorage.getItem("tmdb_account_id") || null;
    var myName = localStorage.getItem("tmdb_username") || null;

    // all the genres from the tmdb website
    var genreList = [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
        { id: 14, name: "Fantasy" },
        { id: 36, name: "History" },
        { id: 27, name: "Horror" },
        { id: 10402, name: "Music" },
        { id: 9648, name: "Mystery" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" }
    ];

    // get from local storage
    function getMyList(listName) {
        return JSON.parse(localStorage.getItem(listName) || "[]");
    }

    function saveMyList(listName, theArray) {
        localStorage.setItem(listName, JSON.stringify(theArray));
    }

    function checkIfInList(listName, movieId) {
        return getMyList(listName).some(function(m) { return m.id === movieId; });
    }

    function addMovieToList(listName, movieObj) {
        var theList = getMyList(listName);
        var alreadyThere = theList.some(function(m) { return m.id === movieObj.id; });
        if (!alreadyThere) {
            theList.push(movieObj);
            saveMyList(listName, theList);
        }
    }

    function removeMovieFromList(listName, movieId) {
        var filtered = getMyList(listName).filter(function(m) { return m.id !== movieId; });
        saveMyList(listName, filtered);
    }

    function toggleMovieInList(listName, movieObj) {
        if (checkIfInList(listName, movieObj.id)) {
            removeMovieFromList(listName, movieObj.id);
            return false;
        } else {
            addMovieToList(listName, movieObj);
            return true;
        }
    }

    //  login/logout 
    function updateLoginArea() {
        if (mySession && myName) {
            $("#authArea").hide();
            $("#userArea").show();
            $("#usernameDisplay").text(myName);
        } else {
            $("#authArea").show();
            $("#userArea").hide();
        }
    }
    updateLoginArea();

    $("#loginBtn").click(function() {
        $("#authModal").show();
        $("#authError").text("");
        $("#tokenInput").val("");
    });

    $("#cancelAuthBtn").click(function() {
        $("#authModal").hide();
    });

    $("#modalBackdrop").click(function() {
        $("#authModal").hide();
    });

    $("#startAuthBtn").click(function () {
        $("#authError").text("");
        $.get(theUrl + "/authentication/token/new", { api_key: myApiKey })
            .done(function (data) {
                if (data.success) {
                    $("#tokenInput").val(data.request_token);
                    window.open("https://www.themoviedb.org/authenticate/" + data.request_token, "_blank");
                } else {
                    $("#authError").css("color", "#e74c3c").text("Failed to get request token.");
                }
            })
            .fail(function() {
                $("#authError").css("color", "#e74c3c").text("Network error.");
            });
    });

    $("#confirmTokenBtn").click(function () {
        var tokenValue = $("#tokenInput").val().trim();
        if (!tokenValue) {
            $("#authError").css("color", "#e74c3c").text("Please paste your request token.");
            return;
        }
        $("#authError").css("color", "#999").text("Creating session...");
        $.post(theUrl + "/authentication/session/new?api_key=" + myApiKey, { request_token: tokenValue })
            .done(function (data) {
                if (data.success) {
                    mySession = data.session_id;
                    localStorage.setItem("tmdb_session_id", mySession);
                    getAccountInfo();
                } else {
                    $("#authError").css("color", "#e74c3c").text("Token not approved yet.");
                }
            })
            .fail(function() {
                $("#authError").css("color", "#e74c3c").text("Error. Approve the token on TMDB first.");
            });
    });

    function getAccountInfo() {
        $.get(theUrl + "/account", { api_key: myApiKey, session_id: mySession })
            .done(function (data) {
                myAccount = data.id;
                myName = data.username;
                localStorage.setItem("tmdb_account_id", myAccount);
                localStorage.setItem("tmdb_username", myName);
                updateLoginArea();
                $("#authModal").hide();
                loadUserLists();
            })
            .fail(function() {
                $("#authError").css("color", "#e74c3c").text("Session valid but failed to fetch account.");
            });
    }

    function loadUserLists() {
        if (!mySession || !myAccount) return;
        $.get(theUrl + "/account/" + myAccount + "/favorite/movies", { api_key: myApiKey, session_id: mySession })
            .done(function(data) {
                if (data.results) {
                    data.results.forEach(function(m) {
                        addMovieToList("favorites", makeMovieObj(m));
                    });
                }
            });
        $.get(theUrl + "/account/" + myAccount + "/watchlist/movies", { api_key: myApiKey, session_id: mySession })
            .done(function(data) {
                if (data.results) {
                    data.results.forEach(function(m) {
                        addMovieToList("watchlist", makeMovieObj(m));
                    });
                }
            });
    }

    function sendToTMDB(whichList, theMovieId, isAdding) {
        if (!mySession || !myAccount) return;
        var postBody;
        if (whichList === "favorite") {
            postBody = { media_type: "movie", media_id: theMovieId, favorite: isAdding };
        } else {
            postBody = { media_type: "movie", media_id: theMovieId, watchlist: isAdding };
        }
        $.ajax({
            url: theUrl + "/account/" + myAccount + "/" + whichList + "?api_key=" + myApiKey + "&session_id=" + mySession,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(postBody)
        });
    }

    $("#logoutBtn").click(function () {
        if (mySession) {
            $.ajax({
                url: theUrl + "/authentication/session?api_key=" + myApiKey,
                method: "DELETE",
                contentType: "application/json",
                data: JSON.stringify({ session_id: mySession })
            });
        }
        mySession = null;
        myAccount = null;
        myName = null;
        localStorage.removeItem("tmdb_session_id");
        localStorage.removeItem("tmdb_account_id");
        localStorage.removeItem("tmdb_username");
        updateLoginArea();
    });

    // switch between pages
    function switchPage(whichPage) {
        $("#searchView").hide();
        $("#discoverView").hide();
        $("#collectionView").hide();
        $("#listsView").hide();
        $(whichPage).show();
    }

    $("#searchBtn").click(function () {
        searchWord = $("#searchInput").val().trim();
        if (!searchWord) return;
        pageNum = 1;
        switchPage("#searchView");
        doSearch();
    });

    $("#searchInput").keypress(function (e) {
        if (e.which === 13) {
            $("#searchBtn").trigger("click");
        }
    });

    $("#discoverBtn").click(function () {
        switchPage("#discoverView");
        makeGenreButtons();
        if (!genreSelected) {
            loadDiscoverMovies();
        }
    });

    $("#collectionBtn").click(function () {
        switchPage("#collectionView");
        getTopRated("#topRatedMovies");
        getPopular("#mostPopularMovies");
    });

    $("#listsBtn").click(function () {
        switchPage("#listsView");
        showListTab("favorites");
    });

    $("#sortSelect").change(function () {
        discoverPageNum = 1;
        loadDiscoverMovies();
    });

    switchPage("#searchView");

    // build the genre buttons
    function makeGenreButtons() {
        if ($("#genreChips").children().length) return;
        genreList.forEach(function (g) {
            var btn = $('<button class="genre-chip" data-id="' + g.id + '">' + g.name + '</button>');
            $("#genreChips").append(btn);
        });
    }

    $(document).on("click", ".genre-chip", function () {
        $(".genre-chip").removeClass("active");
        $(this).addClass("active");
        genreSelected = parseInt($(this).data("id"));
        discoverPageNum = 1;
        loadDiscoverMovies();
    });

    // load discover movies
    function loadDiscoverMovies() {
        var params = {
            api_key: myApiKey,
            sort_by: $("#sortSelect").val() || "popularity.desc",
            page: discoverPageNum,
            "vote_count.gte": 50
        };
        if (genreSelected) {
            params.with_genres = genreSelected;
        }
        $.get(theUrl + "/discover/movie", params)
            .done(function (data) {
                putMoviesOnPage(data.results, "#discoverGrid");
                makeDiscoverPageButtons(data.total_pages);
            });
    }

    function makeDiscoverPageButtons(totalPagesNum) {
        var template = $("#discover-controls-template").html();
        var pagesArray = [];
        for (var i = 1; i <= Math.min(totalPagesNum, 5); i++) {
            pagesArray.push({ number: i, active: i === discoverPageNum ? "active" : "" });
        }
        $("#discoverControls").html(Mustache.render(template, { pages: pagesArray }));

        $(".discover-page-btn").click(function () {
            discoverPageNum = parseInt($(this).data("page"));
            loadDiscoverMovies();
        });

        $("#discoverGridBtn").click(function() { viewType = "grid"; fixLayout(); });
        $("#discoverListBtn").click(function() { viewType = "list"; fixLayout(); });

        fixLayout();
    }

    // favorites and watchlist tabs
    $(document).on("click", ".list-tab", function () {
        $(".list-tab").removeClass("active");
        $(this).addClass("active");
        showListTab($(this).data("list"));
    });

    function showListTab(tabName) {
        if (tabName === "favorites") {
            $("#favoritesPanel").show();
            $("#watchlistPanel").hide();
            showSavedMovies("favorites", "#favoritesList", "#favEmpty");
        } else {
            $("#favoritesPanel").hide();
            $("#watchlistPanel").show();
            showSavedMovies("watchlist", "#watchlistList", "#watchEmpty");
        }
    }

    function showSavedMovies(listName, containerEl, emptyEl) {
        var savedMovies = getMyList(listName);
        if (!savedMovies.length) {
            $(containerEl).html("");
            $(emptyEl).show();
            return;
        }
        $(emptyEl).hide();
        var template = $("#movie-template").html();
        $(containerEl).html(Mustache.render(template, {
            movies: savedMovies.map(function(m) {
                return {
                    id: m.id,
                    title: m.title,
                    poster: m.poster,
                    release_date: m.release_date,
                    vote_average: m.vote_average,
                    original_language: m.original_language,
                    overview: m.overview,
                    poster_path: m.poster_path,
                    rating: m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A",
                    favClass: checkIfInList("favorites", m.id) ? "active" : "",
                    watchClass: checkIfInList("watchlist", m.id) ? "active" : ""
                };
            })
        }));
    }

    // collections
    function getTopRated(whereToput) {
        $.get(theUrl + "/movie/top_rated", { api_key: myApiKey, page: 1 })
            .done(function(data) {
                putMoviesOnPage(data.results, whereToput);
            });
    }

    function getPopular(whereToput) {
        $.get(theUrl + "/movie/popular", { api_key: myApiKey, page: 1 })
            .done(function(data) {
                putMoviesOnPage(data.results, whereToput);
            });
    }

    // search function
    function doSearch() {
        $.get(theUrl + "/search/movie", { api_key: myApiKey, query: searchWord, page: pageNum })
            .done(function(data) {
                putMoviesOnPage(data.results, "#resultsGrid");
                makePageButtons(data.total_pages);
            });
    }

    // turn api data into object
    function makeMovieObj(m) {
        return {
            id: m.id,
            title: m.title,
            poster: m.poster_path ? smallPic + m.poster_path : "",
            poster_path: m.poster_path,
            release_date: m.release_date || "N/A",
            vote_average: m.vote_average,
            original_language: m.original_language || "N/A",
            overview: m.overview || "No description available"
        };
    }

    function makeMoviesArray(moviesArr) {
        return moviesArr.map(function(m) {
            var obj = makeMovieObj(m);
            obj.rating = m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A";
            obj.favClass = checkIfInList("favorites", m.id) ? "active" : "";
            obj.watchClass = checkIfInList("watchlist", m.id) ? "active" : "";
            return obj;
        });
    }

    // put movies into a grid
    function putMoviesOnPage(moviesArr, whereEl) {
        var template = $("#movie-template").html();
        var html = Mustache.render(template, { movies: makeMoviesArray(moviesArr.slice(0, 20)) });
        $(whereEl).html(html);
        fixLayout();
    }

    // show movie details on the right
    function openMovieDetails(movieData) {
        var id = movieData.id;
        var templateData = {
            id: id,
            poster: movieData.poster_path ? bigPic + movieData.poster_path : "",
            title: movieData.title,
            release_date: movieData.release_date || "N/A",
            vote_average: movieData.vote_average ? parseFloat(movieData.vote_average).toFixed(1) : "N/A",
            language: (movieData.original_language || "N/A").toUpperCase(),
            overview: movieData.overview || "No description available",
            favClass: checkIfInList("favorites", id) ? "active" : "",
            favLabel: checkIfInList("favorites", id) ? "Remove" : "Favorite",
            watchClass: checkIfInList("watchlist", id) ? "active" : "",
            watchLabel: checkIfInList("watchlist", id) ? "Remove" : "Watchlist"
        };

        var template = $("#details-template").html();
        $("#movieDetails").html(Mustache.render(template, templateData)).data("movie", movieData);

        $.get(theUrl + "/movie/" + id + "/credits", { api_key: myApiKey })
            .done(function (credits) {
                var castMembers = credits.cast.slice(0, 3);
                if (!castMembers.length) return;

                var director = credits.crew.find(function(p) { return p.job === "Director"; });

                var castHtml = '<div class="cast-section">';
                if (director) {
                    castHtml += '<p class="director-line"><b>Director:</b> ' + $('<div>').text(director.name).html() + '</p>';
                }
                castHtml += '<h4>Cast</h4><div class="cast-list">';

                castMembers.forEach(function (actor) {
                    var photo = actor.profile_path ? castPic + actor.profile_path : "";
                    var actorName = $('<div>').text(actor.name).html();
                    var charName = $('<div>').text(actor.character).html();
                    castHtml += '<div class="cast-card">';
                    castHtml += '<img src="' + photo + '" alt="' + actorName + '" loading="lazy">';
                    castHtml += '<p class="cast-name">' + actorName + '</p>';
                    castHtml += '<p class="cast-char">' + charName + '</p>';
                    castHtml += '</div>';
                });

                castHtml += '</div></div>';
                $("#movieDetails").append(castHtml);
            });
    }

    // click a movie card
    $(document).on("click", ".movie-card", function (e) {
        if ($(e.target).is(".fav-btn, .watch-btn")) return;
        var clickedId = $(this).data("id");
        $.get(theUrl + "/movie/" + clickedId, { api_key: myApiKey }).done(function(movie) {
            openMovieDetails(movie);
        });
    });

    $(document).on("click", ".fav-btn", function (e) {
        e.stopPropagation();
        doToggle("favorites", parseInt($(this).data("id")));
    });

    $(document).on("click", ".watch-btn", function (e) {
        e.stopPropagation();
        doToggle("watchlist", parseInt($(this).data("id")));
    });

    function doToggle(listName, movieId) {
        $.get(theUrl + "/movie/" + movieId, { api_key: myApiKey }).done(function (movieData) {
            var wasAdded = toggleMovieInList(listName, makeMovieObj(movieData));
            $(".fav-btn[data-id='" + movieId + "']").toggleClass("active", checkIfInList("favorites", movieId));
            $(".watch-btn[data-id='" + movieId + "']").toggleClass("active", checkIfInList("watchlist", movieId));
            var currentDetailMovie = $("#movieDetails").data("movie");
            if (currentDetailMovie && currentDetailMovie.id === movieId) {
                openMovieDetails(currentDetailMovie);
            }
            if ($("#listsView").is(":visible")) {
                showListTab($(".list-tab.active").data("list"));
            }
            var tmdbListName = listName === "favorites" ? "favorite" : "watchlist";
            sendToTMDB(tmdbListName, movieId, wasAdded);
        });
    }

    // load the trending carousel
    function loadTrendingMovies() {
        $.get(theUrl + "/trending/movie/week", { api_key: myApiKey })
            .done(function (data) {
                var trendingMovies = data.results.slice(0, 20);
                $("#carouselTrack").empty();
                trendingMovies.forEach(function (m) {
                    var poster = m.poster_path ? medPic + m.poster_path : "";
                    var rating = m.vote_average ? parseFloat(m.vote_average).toFixed(1) : "N/A";
                    var favClass = checkIfInList("favorites", m.id) ? "active" : "";
                    var watchClass = checkIfInList("watchlist", m.id) ? "active" : "";
                    var safeTitle = $('<div>').text(m.title).html();

                    var cardHtml = '<div class="carousel-card movie-card" data-id="' + m.id + '">';
                    cardHtml += '<div class="card-poster">';
                    cardHtml += '<img src="' + poster + '" alt="' + safeTitle + '" loading="lazy">';
                    cardHtml += '<div class="card-overlay">';
                    cardHtml += '<button class="fav-btn ' + favClass + '" data-id="' + m.id + '" title="Favorite">❤</button>';
                    cardHtml += '<button class="watch-btn ' + watchClass + '" data-id="' + m.id + '" title="Watchlist">＋</button>';
                    cardHtml += '</div></div>';
                    cardHtml += '<div class="card-info">';
                    cardHtml += '<p class="card-title">' + safeTitle + '</p>';
                    cardHtml += '<span class="card-rating">⭐ ' + rating + '</span>';
                    cardHtml += '</div></div>';

                    var card = $(cardHtml);
                    $("#carouselTrack").append(card);
                    setTimeout(function() { card.addClass("show"); }, 50);
                });
            });
    }

    loadTrendingMovies();

    // drag to scroll the carousel
    var trackEl = $("#carouselTrack");
    var isMouseDown = false;
    var startX = 0;
    var scrollLeft = 0;

    trackEl.on("mousedown", function (e) {
        isMouseDown = true;
        startX = e.pageX;
        scrollLeft = trackEl.scrollLeft();
        trackEl.addClass("dragging");
        e.preventDefault();
    });

    $(document).on("mousemove", function (e) {
        if (!isMouseDown) return;
        trackEl.scrollLeft(scrollLeft - (e.pageX - startX));
    });

    $(document).on("mouseup", function () {
        if (isMouseDown) {
            isMouseDown = false;
            trackEl.removeClass("dragging");
        }
    });

    // page buttons for search results
    function makePageButtons(totalPagesNum) {
        var template = $("#controls-template").html();
        var pagesArray = [];
        for (var i = 1; i <= Math.min(totalPagesNum, 5); i++) {
            pagesArray.push({ number: i, active: i === pageNum ? "active" : "" });
        }
        $("#controls").html(Mustache.render(template, { pages: pagesArray }));

        $(".page-btn").click(function () {
            pageNum = parseInt($(this).data("page"));
            doSearch();
        });

        $("#gridBtn").click(function() { viewType = "grid"; fixLayout(); });
        $("#listBtn").click(function() { viewType = "list"; fixLayout(); });

        fixLayout();
    }

    function fixLayout() {
        var allGrids = $("#resultsGrid, #discoverGrid, #topRatedMovies, #mostPopularMovies, #favoritesList, #watchlistList");
        if (viewType === "list") {
            allGrids.addClass("list-view");
        } else {
            allGrids.removeClass("list-view");
        }
    }

});
