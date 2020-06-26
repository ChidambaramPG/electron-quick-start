/**
 * @author Chidambaram P G
 * @email chidambaram@rexav.in
 * @create date 2020-05-31 10:48:28
 * @modify date 2020-05-31 10:48:28
 * @desc [description]
 */

// imports

// let base_url = 'http://localhost/inactivity-tracker'
let base_url = "https://inactivity.rexav.in";

// login form submit
$("#loginBtn").click((event) => {
    event.preventDefault();
    // check if user exist
    var data = {
        emailid: $("#login-email").val(),
        password: $("#login-password").val(),
    };

    fetch(base_url + "/api/api-login", {
        method: "POST",
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            console.log("Data:", data.user[0].id);
            if (data.user != null) {
                let eventData = {
                    event: "login",
                    user: data.user[0].id,
                };

                // save user to cookie for later user
                // document.cookie = 'user=' + JSON.stringify(data.user)
                console.log("Received:", data.user[0]);

                console.log(window.session);
                const userData = {
                    url: base_url,
                    name: "user",
                    value: JSON.stringify(data.user[0]),
                };
                window.session.defaultSession.cookies.set(userData).then(
                    (e) => {
                        console.log(e);
                    },
                    (error) => {
                        console.error(error);
                    }
                );
                // $('#user-image').attr('src',base_url + '/storage/app/uploads/'+data.user[0].image)
                const loginData = {
                    url: base_url,
                    name: "login",
                    value: JSON.stringify({ time: new Date() }),
                };

                window.session.defaultSession.cookies.set(loginData).then(
                    (e) => {
                        console.log(e);
                    },
                    (error) => {
                        console.error(error);
                    }
                );

                // add login event to server
                fetch(base_url + "/api/api-event", {
                    method: "POST",
                    body: JSON.stringify(eventData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data);

                        // if event added , reroute to user profile
                        window.location = "./profile.html";
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});

$("#logoutBtn").click((event) => {
    // manage timers on logout event
    stopActiveTimer();
    stopInactiveTimer();

    // add logout event to server
    window.session.defaultSession.cookies
        .get({ name: "user" })
        .then((cookies) => {
            if (cookies.length > 0) {
                // sending event
                let user = JSON.parse(cookies[0].value);
                console.log(user);
                let eventData = {
                    event: "logout",
                    user: user.id,
                };
                console.log(eventData);
                fetch(base_url + "/api/api-event", {
                    method: "POST",
                    body: JSON.stringify(eventData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data);
                        // window.location = "./index.html";
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });

                // sending logout time
                window.session.defaultSession.cookies
                    .get({ name: "login" })
                    .then((cookies) => {
                        console.log(cookies);
                        let loginTime = new Date(
                            JSON.parse(cookies[0].value)["time"]
                        );
                        console.log(loginTime);
                        let currTime = new Date();

                        let diff =
                            (currTime.getTime() - loginTime.getTime()) /
                            (60 * 60);

                        console.log(diff);
                        fetch(base_url + "/api/api-logout-time", {
                            method: "POST",
                            body: JSON.stringify({ time: diff, id: user.id }),
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                console.log(data);
                                window.location = "./index.html";
                            })
                            .catch((error) => {
                                console.error("Error:", error);
                            });
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        })
        .catch((error) => {
            console.log(error);
        });
});

var autoBreakStatus = true;
$(document).ready((event) => {
    // console.log(window)
    let pathName = window.location.pathname.split("/");
    console.log(pathName[pathName.length - 1]);
    if (pathName[pathName.length - 1] == "profile.html") {
        console.log("starting timer");
        startActiveTimer();
        getAllActivities();
        sendUptimeStat();
        console.log("inside image setting section");
        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    console.log(user);
                    $("#user-name").text(user.name);
                    if (user.image == "") {
                        $("#user-image").attr(
                            "src",
                            "./assets/images/users/john_doe.png"
                        );
                    } else {
                        $("#user-image").attr(
                            "src",
                            base_url + "/storage/app/" + user.image
                        );
                    }
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    window.ipcRenderer.on("SYSTEM_IDLE_TIME", (event, data) => {
        // console.log(event,data)
        if (autoBreakStatus && activeStatus) {
            console.log("auto break status is true");

            if (data["time"] > 300) {
                console.log("auto break started");
                window.ipcRenderer.send("AUTO_BREAK_EVENT", { status: true });
                stopActiveTimer();
                startInactiveTimer();
                $("#breakToggleButton").text("End Break");
                $("#warningSection").css("display", "block");
                autoBreakStatus = false;
                activeStatus = !activeStatus;

                const breakData = {
                    url: base_url,
                    name: "break-start",
                    value: JSON.stringify({ start: $.now() }),
                };
                console.log("break start time:", breakData);
                window.session.defaultSession.cookies.set(breakData).then(
                    (e) => {
                        console.log(e);
                    },
                    (error) => {
                        console.error(error);
                    }
                );

                // update to server
                window.session.defaultSession.cookies
                    .get({ name: "user" })
                    .then((cookies) => {
                        if (cookies.length > 0) {
                            let user = JSON.parse(cookies[0].value);
                            console.log(user);
                            let eventData = {
                                event: "auto-break",
                                user: user.id,
                            };
                            console.log(eventData);
                            fetch(base_url + "/api/api-event", {
                                method: "POST",
                                body: JSON.stringify(eventData),
                            })
                                .then((response) => response.json())
                                .then((data) => {
                                    console.log(data);
                                })
                                .catch((error) => {
                                    console.error("Error:", error);
                                });
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        }
    });

    let windowLoc = window.location;
    let file = windowLoc.href.split("/");

    if (file[7] === "profile.html") {
        console.log("inside image setting section");
        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    console.log(user);
                    $("#user-name").text(user.name);
                    if (user.image == "") {
                        $("#user-image").attr(
                            "src",
                            "./assets/images/users/john_doe.png"
                        );
                    } else {
                        $("#user-image").attr(
                            "src",
                            base_url + "/storage/app/" + user.image
                        );
                    }
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

// Timer control functions and events
let activeTime = 0;
var activeTimerInterval;
let inActiveTime = 0;
var inActiveTimerInterval;
var activeStatus = true;

$("#breakToggleButton").click((event) => {
    console.log("<---------- button click ----------->");
    activeStatus = !activeStatus;
    if (activeStatus) {
        console.log("stopping inactive timer");
        startActiveTimer();
        stopInactiveTimer();

        $("#breakToggleButton").text("Start Break");
        $("#warningSection").css("display", "none");
        autoBreakStatus = true;

        // save break event to server
        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    console.log(user);
                    let eventData = {
                        event: "manual-break-end",
                        user: user.id,
                    };
                    console.log(eventData);
                    fetch(base_url + "/api/api-event", {
                        method: "POST",
                        body: JSON.stringify(eventData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log(data);
                        })
                        .catch((error) => {
                            console.error("Error:", error);
                        });

                    // save break time to server
                    window.session.defaultSession.cookies
                        .get({ name: "break-start" })
                        .then((cookies) => {
                            console.log(cookies);
                            if (cookies.length > 0) {
                                let start = JSON.parse(cookies[0].value)[
                                    "start"
                                ];
                                let end = $.now();
                                console.log("start:", start);
                                console.log("end:", end);
                                console.log(
                                    (new Date(end).getTime() -
                                        new Date(start).getTime()) /
                                        1000
                                );
                                let breakTimeDiff =
                                    (new Date(end).getTime() -
                                        new Date(start).getTime()) /
                                    1000;
                                // console.log()
                                let eventData = {
                                    user: user.id,
                                    value: breakTimeDiff,
                                };
                                console.log(eventData);
                                fetch(base_url + "/api/api-break-time", {
                                    method: "POST",
                                    body: JSON.stringify(eventData),
                                })
                                    .then((response) => response.json())
                                    .then((data) => {
                                        console.log(data);
                                    })
                                    .catch((error) => {
                                        console.error("Error:", error);
                                    });
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        const breakData = {
            url: base_url,
            name: "break-start",
            value: JSON.stringify({ start: $.now() }),
        };
        console.log("break start time:", breakData);
        window.session.defaultSession.cookies.set(breakData).then(
            (e) => {
                console.log(e);
            },
            (error) => {
                console.error(error);
            }
        );

        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookie) => {
                console.log(cookie);
            })
            .catch((e) => {
                console.log;
            });

        console.log("starting inactive timer");
        stopActiveTimer();
        startInactiveTimer();

        $("#breakToggleButton").text("End Break");

        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    console.log(user);
                    let eventData = {
                        event: "manual-break",
                        user: user.id,
                    };
                    console.log(eventData);
                    fetch(base_url + "/api/api-event", {
                        method: "POST",
                        body: JSON.stringify(eventData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log(data);
                        })
                        .catch((error) => {
                            console.error("Error:", error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    console.log("<---------- end button click ----------->");
});

function startActiveTimer() {
    console.log("active timer started");
    activeTimerInterval = setInterval(() => {
        $("#activeTimer").text(secondsToHms(activeTime));
        activeTime++;
    }, 1000);
}

function stopActiveTimer() {
    console.log("active timer stopped");
    clearInterval(activeTimerInterval);
}

function startInactiveTimer() {
    console.log("inactive timer started");
    inActiveTimerInterval = setInterval(() => {
        $("#inActiveTimer").text(secondsToHms(inActiveTime));
        inActiveTime++;
    }, 1000);
}

function stopInactiveTimer() {
    console.log("inactive timer stopped");
    clearInterval(inActiveTimerInterval);
}

$("#minimizeToTrayBtn").click((event) => {
    window.ipcRenderer.send("MINIMIZE_TO_TRAY", { status: true });
});

$(document).on("click", ".attend-meeting-btn", (event) => {
    window.session.defaultSession.cookies
        .get({ name: "user" })
        .then((cookies) => {
            if (cookies.length > 0) {
                let user = JSON.parse(cookies[0].value);
                console.log(user);
                let meetingData = {
                    event: "attend-meeting",
                    user: user.id,
                    meeting: event.target.id,
                };
                console.log(meetingData);
                fetch(base_url + "/api/api-meeting-event", {
                    method: "POST",
                    body: JSON.stringify(meetingData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data);
                        $(".attend-meeting-btn#" + event.target.id).text(
                            "Attending"
                        );
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });

                let eventData = {
                    event: "attend-meeting",
                    user: user.id,
                };
                console.log(eventData);
                fetch(base_url + "/api/api-event", {
                    method: "POST",
                    body: JSON.stringify(eventData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            }
        })
        .catch((error) => {
            console.log(error);
        });
});

// helper functions
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}

function getAllActivities() {
    intervalVar = setInterval(() => {
        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    let data = {
                        user: user.id,
                    };
                    fetch(base_url + "/api/api-user-activity", {
                        method: "POST",
                        body: JSON.stringify(data),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log("Success:", data);
                            if (data["status"] === 1) {
                                populateMeetings(data["activities"]);
                            } else {
                                populateMeetings([]);
                            }
                        })
                        .catch((error) => {
                            console.error("Error:", error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, 10000);
}

function populateMeetings(meetings) {
    let met = Object.entries(meetings);
    meetings = [];
    met.forEach((item) => {
        meetings.push(item[1]);
    });
    console.log(meetings);
    let meetingsStr = "";
    meetings.forEach((meeting) => {
        let activeMeeting = new Date(meeting.scheduled_at);
        let currTime = new Date($.now());
        let diff = (activeMeeting.getTime() - currTime.getTime()) / (1000 * 60);
        console.log(activeMeeting, diff);

        if (diff < 10 && diff > -10) {
            meetingsStr +=
                "<div class='row shadow mt-3 p-4 bg-white'><div class='col-md-3'><h6 class='h5 mb-0 mt-4'>" +
                meeting["name"] +
                "</h6></div><div class='col-md-3 mb-0 mt-4'></div><div class='col-md-3'><h6 class='h5 mb-0 mt-4'>" +
                meeting["scheduled_at"] +
                "</h6><p class='text-muted mt-1 mb-4'>Hours remaining</p></div><div class='col-md-3 mb-0 mt-4' style='text-align:right;'><button class='btn btn-danger attend-meeting-btn'  id=" +
                meeting["id"] +
                ">Attend</button></div></div>";
        } else if (diff > 10 && diff < 60) {
            console.log("Meeting stat: ", meeting.notification_status);
            if (meeting.notification_status == 0) {
                window.session.defaultSession.cookies
                    .get({ name: "user" })
                    .then((cookies) => {
                        console.log("Cookie stat: ", cookies);
                        if (cookies.length > 0) {
                            console.log();
                            window.ipcRenderer.send("NEW_MEETING_ADDED", {
                                status: true,
                            });
                            let user = JSON.parse(cookies[0].value);
                            console.log(user);
                            let eventData = {
                                aid: meeting.id,
                                uid: user.id,
                            };

                            fetch(
                                base_url + "/api/meeting-notification-shown",
                                {
                                    method: "POST",
                                    body: JSON.stringify(eventData),
                                }
                            )
                                .then((response) => response.json())
                                .then((data) => {
                                    console.log(
                                        "Notification stat changed: ",
                                        data
                                    );
                                })
                                .catch((error) => {
                                    console.error("Error:", error);
                                });
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
            meetingsStr +=
                "<div class='row shadow mt-3 p-4 bg-white'><div class='col-md-3'><h6 class='h5 mb-0 mt-4'>" +
                meeting["name"] +
                "</h6></div><div class='col-md-3 mb-0 mt-4'></div><div class='col-md-3'><h6 class='h5 mb-0 mt-4'>" +
                meeting["scheduled_at"] +
                "</h6><p class='text-muted mt-1 mb-4'>Hours remaining</p></div><div class='col-md-3 mb-0 mt-4' style='text-align:right;'>" +
                "<button class='btn btn-danger' disabled>Attend</button></div></div>";
        }
    });
    $("#meetings-section").html("");
    $("#meetings-section").append(meetingsStr);
}

function sendUptimeStat() {
    intervalVar = setInterval(() => {
        window.session.defaultSession.cookies
            .get({ name: "user" })
            .then((cookies) => {
                if (cookies.length > 0) {
                    let user = JSON.parse(cookies[0].value);
                    let data = {
                        user: user.id,
                    };

                    fetch(base_url + "/api/api-user-ping", {
                        method: "POST",
                        body: JSON.stringify(data),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log("Success:", data);
                        })
                        .catch((error) => {
                            console.error("Error:", error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, 60000);
}
