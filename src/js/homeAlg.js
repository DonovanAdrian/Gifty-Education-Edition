/*
Welcome to the home page! This page welcomes an authenticated user to their wealth (or lack thereof) of gifts that they
have put on their "wish list"! The user is able to view each gift's details in a modal and choose to edit, delete, or
add more gifts on this page as well. There is also a navigation tab at the top of the window that shows the user their
options for which page they would like to navigate to or sign out.

As always, all the necessary declarations are below!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var userArr = [];                       //An array that stores all the user data that is fetched from the database
var giftArr = [];                       //An array that stores all the user's gifts that are fetched from the database
var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var userBoughtGifts = [];               //An array that stores the user's bought gifts
var userBoughtGiftsUsers = [];          //An array that stores the owners of the user's bought gifts

var invitesValidBool = false;           //A boolean used for error checking in a user's invite list
var friendsValidBool = false;           //A boolean used for error checking in a user's friend list
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read
var updateUserBool = false;             //A boolean used to tell whether the user should be updated to DB in error checking
var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var giftListEmptyBool = false;          //A global boolean that tells whether the giftList is empty

var giftCounter = 0;                    //An integer used to keep track of the number of gifts loaded on the page
var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var giftCreationDate;                   //Stores the "Creation Date" field on a gift's detail window object
var giftList;                           //Stores the "Gift List" object on the webpage
var giftStorage;                        //Stores a gift object in memory to be sent to the "giftAddUpdate" page
var privateList;                        //Clears the "privateList" object in memory before being sent to "giftAddUpdate"
var boughtGifts;                        //Stores the "Bought Gifts" object on the webpage
var addBtn;                             //Stores the "Add Gift" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var user;                               //Stores an authenticated user's data
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var modal;                              //Stores the modal that is used for displaying gift details
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var userBase;                           //Tells the webpage where to look in the database for data
var userGifts;                          //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data
var notificationBtn;                    //Stores the "Notification" object on the webpage


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
    try {
        user = JSON.parse(sessionStorage.validUser);
        console.log("User: " + user.userName + " logged in");
        if (user.giftList == undefined) {
            deployGiftListEmptyNotification();
            giftListEmptyBool = true;
        } else if (user.giftList.length == 0) {
            deployGiftListEmptyNotification();
            giftListEmptyBool = true;
        }
        if (user.invites == undefined) {
            console.log("Invites Not Found");
        } else if (user.invites != undefined) {
            if (user.invites.length > 0) {
                invitesValidBool = true;
            }
        }

        if (user.friends == undefined) {
            console.log("Friends Not Found");
        } else if (user.friends != undefined) {
            if (user.friends.length > 0) {
                friendsValidBool = true;
            }
        }

        if (user.readNotifications == undefined) {
            console.log("Read Notifications Not Found");
        } else {
            readNotificationsBool = true;
        }

        if (user.notifications == undefined) {
            console.log("Notifications Not Found");
        } else if (user.notifications != undefined) {
            if (readNotificationsBool){
                if (user.notifications.length > 0 && user.readNotifications.length != user.notifications.length) {
                    notificationBtn.src = "img/bellNotificationOn.png";
                    notificationBtn.onclick = function() {
                        navigation(4);
                    }
                } else {
                    notificationBtn.src = "img/bellNotificationOff.png";
                    notificationBtn.onclick = function() {
                        navigation(4);
                    }
                }
            } else if (user.notifications.length > 0) {
                notificationBtn.src = "img/bellNotificationOn.png";
                notificationBtn.onclick = function() {
                    navigation(4);
                }
            }
        }
        userArr = JSON.parse(sessionStorage.userArr);
    } catch (err) {
        console.log(err.toString());
        window.location.href = "index.html";
    }
}


//This function checks the user's data for errors. One such error is a user that does not exist anymore is on their
//friend list. If this is the case, then the user's data will be properly updated in the database.
function checkUserErrors(){
  var userUIDs = [];
  var inviteEditInt = 0;
  var friendEditInt = 0;
  var totalErrors = 0;

  for(var i = 0; i < userArr.length; i++){
    userUIDs.push(userArr[i].uid);
  }

  console.log("Checking for errors...");

  //check invites for users that no longer exist
  if(invitesValidBool){
    for(var i = 0; i < user.invites.length; i++){
      if(!userUIDs.includes(user.invites[i])){
        user.invites.splice(i, 1);
        inviteEditInt++;
      }
    }

    if(inviteEditInt > 0){
      updateUserBool = true;
      console.log("Update to DB required: 1...");
    }

    if(user.invites.length > 0) {
      inviteNote.style.background = "#ff3923";
    }
  }

  //check friends for users that no longer exist
  if(friendsValidBool){
    for(var i = 0; i < user.friends.length; i++){
      if(!userUIDs.includes(user.friends[i])){
        user.friends.splice(i, 1);
        friendEditInt++;
      }
    }

    if(friendEditInt > 0){
      updateUserBool = true;
      console.log("Update to DB required: 2...");
    }
  }

  if(updateUserBool){
    console.log("Updates needed! Computing...");
    totalErrors = friendEditInt + inviteEditInt;
    updateUserToDB(totalErrors, friendEditInt, inviteEditInt);
  } else {
    console.log("No updates needed!");
  }
}


//If a user's data is shown to contain errors, then it will be updated to the database in this function
function updateUserToDB(totalErrors, friendEditInt, inviteEditInt){
  if(inviteEditInt > 0) {
    var supplementaryInvitesArr = user.invites;
    firebase.database().ref("users/" + user.uid).update({
      invites: user.invites
    });
    user.invites = supplementaryInvitesArr;
  }
  if(friendEditInt > 0) {
    var supplementaryFriendsArr = user.friends;
    firebase.database().ref("users/" + user.uid).update({
      friends: user.friends
    });
    user.friends = supplementaryFriendsArr;
  }
  console.log("Updates pushed!");
}


//This function collects the gifts which a user has bought and are put into the necessary arrays. These arrays will
//be sent to the boughtGifts page if the "Bought Gifts" button is pressed.
function collectUserBoughtGifts(){
  var userGiftArr = [];
  var userPrivateGiftArr = [];
  for(var i = 0; i < userArr.length; i++) {
    userGiftArr = userArr[i].giftList;
    userPrivateGiftArr = userArr[i].privateList;

    if(userGiftArr == undefined){}
    else if (userGiftArr.length != undefined) {
      for (var a = 0; a < userGiftArr.length; a++) {
        if (userGiftArr[a].buyer == user.userName) {
          userBoughtGifts.push(userGiftArr[a]);
          userBoughtGiftsUsers.push(userArr[i].name);
        }
      }
    }

    if(userPrivateGiftArr == undefined){}
    else if (userPrivateGiftArr.length != undefined) {
      for (var b = 0; b < userPrivateGiftArr.length; b++) {
        if (userPrivateGiftArr[b].buyer == user.userName) {
          userBoughtGifts.push(userPrivateGiftArr[b]);
          userBoughtGiftsUsers.push(userArr[i].name + " (Private List)");
        }
      }
    }
  }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, user errors are checked, bought gifts
//are collected, the database is queried, and the login timer is started.
window.onload = function instantiate() {

  notificationBtn = document.getElementById('notificationButton');
  giftCreationDate = document.getElementById('giftCreationDate');
  giftList = document.getElementById('giftListContainer');
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById('closeOffline');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
  inviteNote = document.getElementById('inviteNote');
  boughtGifts = document.getElementById('boughtGifts');
  addBtn = document.getElementById('addGift');
  modal = document.getElementById('giftModal');
  getCurrentUser();

  const config = JSON.parse(sessionStorage.config);

  firebase.initializeApp(config);
  firebase.analytics();

  firebase.auth().signInAnonymously().catch(function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
    } else {
      // User is signed out.
    }
  });

  checkUserErrors();

  window.addEventListener("online", function(){
    offlineModal.style.display = "none";
    location.reload();
  });

  window.addEventListener("offline", function() {
    var now = 0;
    offlineTimer = setInterval(function(){
      now = now + 1000;
      if(now >= 5000){
        try{
          if (onlineInt == 0) {
            document.getElementById("TestGift").innerHTML = "Loading Failed, Please Connect To Internet";
          } else {
            document.getElementById("TestGift").innerHTML = "No Gifts Found! Add Some Gifts With The Button Below!";
          }
        } catch(err) {
          if(giftCounter == 0) {
            console.log("Loading Element Missing, Creating A New One");
            var liItem = document.createElement("LI");
            liItem.id = "TestGift";
            liItem.className = "gift";
            if (onlineInt == 0) {
              var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
            } else {
              var textNode = document.createTextNode("No Gifts Found! Add Some Gifts With The Button Below!");
            }
            liItem.appendChild(textNode);
            giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
          }
        }
        offlineModal.style.display = "block";
        clearInterval(offlineTimer);
      }
    }, 1000);
  });

  //close offlineModal on close
  offlineSpan.onclick = function() {
    offlineModal.style.display = "none";
  };

  //close offlineModal on click
  window.onclick = function(event) {
    if (event.target == offlineModal) {
      offlineModal.style.display = "none";
    }
  };

  collectUserBoughtGifts();
  boughtGifts.innerHTML = "Bought Gifts";
  boughtGifts.onclick = function(){
      if(userBoughtGifts.length == 0){
          alert("Buy Some Gifts From Some Users First!");
      } else {
          sessionStorage.setItem("boughtGifts", JSON.stringify(userBoughtGifts));
          sessionStorage.setItem("boughtGiftsUsers", JSON.stringify(userBoughtGiftsUsers));
          navigation(5);
      }
  };

  addBtn.innerHTML = "Add Gift";
  addBtn.onclick = function() {
      giftStorage = "";
      privateList = "";
      sessionStorage.setItem("privateList", JSON.stringify(privateList));
      sessionStorage.setItem("giftStorage", JSON.stringify(giftStorage));
      navigation(5);
  };

  loadingTimer = setInterval(function(){
    loadingTimerInt = loadingTimerInt + 1000;
    if(loadingTimerInt >= 2000){
      var testGift = document.getElementById("TestGift");
      if (testGift == undefined){
        //console.log("TestGift Missing. Loading Properly.");
      } else {
        testGift.innerHTML = "Loading... Please Wait...";
      }
      clearInterval(loadingTimer);
    }
  }, 1000);

  databaseQuery();

  loginTimer(); //if action, then reset timer


    //This function controls how long the user has been inactive for and reminds them that they have been inactive
    //after a certain amount of time. If the user is inactive for too long, they will be logged out
    function loginTimer(){
        var loginNum = 0;
        console.log("Login Timer Started");
        setInterval(function(){ //900 15 mins, 600 10 mins
            document.onmousemove = resetTimer;
            document.onkeypress = resetTimer;
            document.onload = resetTimer;
            document.onmousemove = resetTimer;
            document.onmousedown = resetTimer; // touchscreen presses
            document.ontouchstart = resetTimer;
            document.onclick = resetTimer;     // touchpad clicks
            document.onscroll = resetTimer;    // scrolling with arrow keys
            document.onkeypress = resetTimer;
            loginNum = loginNum + 1;
            if (loginNum >= logoutLimit){//default 900
                console.log("User Timed Out");
                signOut();
            } else if (loginNum > logoutReminder){//default 600
                //console.log("User Inactive");
                areYouStillThereNote(loginNum);
                areYouStillThereBool = true;
            }
            function resetTimer() {
                if (areYouStillThereBool) {
                    //console.log("User Active");
                    ohThereYouAre();
                }
                loginNum = 0;
            }
        }, 1000);
    }


    //This function closes any open modals and opens the notification modal to tell the user that they have
    //been inactive for too long.
    function areYouStillThereNote(timeElapsed){
        var timeRemaining = logoutLimit - timeElapsed;
        var timeMins = Math.floor(timeRemaining/60);
        var timeSecs = timeRemaining%60;

        if (timeSecs < 10) {
            timeSecs = ("0" + timeSecs).slice(-2);
        }

        try {
            modal.style.display = "none";
        } catch (err) {
            //console.log("Basic Modal Not Open");
        }
        noteInfoField.innerHTML = "You have been inactive for 5 minutes, you will be logged out in " + timeMins
            + ":" + timeSecs + "!";
        noteTitleField.innerHTML = "Are You Still There?";
        noteModal.style.display = "block";

        //close on close
        noteSpan.onclick = function() {
            noteModal.style.display = "none";
            areYouStillThereBool = false;
        };
    }


    //This function edits the notification modal to welcome the user back after being inactive
  function ohThereYouAre(){
    noteInfoField.innerHTML = "Welcome back, " + user.name;
    noteTitleField.innerHTML = "Oh, There You Are!";

    var nowJ = 0;
    var j = setInterval(function(){
      nowJ = nowJ + 1000;
      if(nowJ >= 3000){
        noteModal.style.display = "none";
        areYouStillThereBool = false;
        clearInterval(j);
      }
    }, 1000);

    //close on click
    window.onclick = function(event) {
      if (event.target == noteModal) {
        noteModal.style.display = "none";
        areYouStillThereBool = false;
      }
    };
  }


//This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
//as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
//locations are stored and checked on regularly.
    function databaseQuery() {

        userBase = firebase.database().ref("users/");
        userGifts = firebase.database().ref("users/" + user.uid + "/giftList");
        userInvites = firebase.database().ref("users/" + user.uid + "/invites");

        var fetchData = function (postRef) {
            postRef.on('child_added', function (data) {
                onlineInt = 1;

                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    //console.log("Adding " + userArr[i].userName + " to most updated version: " + data.val().userName);
                    userArr[i] = data.val();
                }

                if(data.key == user.uid){
                    user = data.val();
                    if (data.val().notifications == undefined) {
                        notificationBtn.src = "img/bellNotificationOff.png";
                        notificationBtn.onclick = function () {}
                    } else if (data.val().readNotifications == undefined){
                        //console.log("No Read Notifications");
                    } else if (data.val().readNotifications.length == data.val().notifications.length) {
                        notificationBtn.src = "img/bellNotificationOff.png";
                        notificationBtn.onclick = function() {
                            navigation(4);
                        }
                    }
                    console.log("User Updated: 1");
                }
            });

            postRef.on('child_changed', function (data) {
                console.log("User Updated: " + data.val().userName);
                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    console.log("Updating " + userArr[i].userName + " to most updated version: " + data.val().userName);
                    userArr[i] = data.val();
                }

                if(data.key == user.uid){
                    user = data.val();
                    console.log("User Updated: 2");
                }
            });

            postRef.on('child_removed', function (data) {
                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    console.log("Removing " + userArr[i].userName + " / " + data.val().userName);
                    userArr.splice(i, 1);
                }
            });
        };

        var fetchGifts = function (postRef) {
            postRef.on('child_added', function (data) {
                giftArr.push(data.val());

                createGiftElement(data.val().description, data.val().link, data.val().received, data.val().title,
                    data.key, data.val().where, data.val().uid, data.val().creationDate, data.val().buyer);
            });

            postRef.on('child_changed', function(data) {
                giftArr[data.key] = data.val();

                changeGiftElement(data.val().description, data.val().link, data.val().received, data.val().title,
                    data.key, data.val().where, data.val().uid, data.val().creationDate, data.val().buyer);
            });

            postRef.on('child_removed', function(data) {
                sessionStorage.setItem("validUser", JSON.stringify(user));
                location.reload();
            });
        };

        var fetchInvites = function (postRef) {
            postRef.on('child_added', function (data) {
                inviteArr.push(data.val());

                inviteNote.style.background = "#ff3923";
            });

            postRef.on('child_changed', function (data) {
                console.log(inviteArr);
                inviteArr[data.key] = data.val();
                console.log(inviteArr);
            });

            postRef.on('child_removed', function (data) {
                console.log(inviteArr);
                inviteArr.splice(data.key, 1);
                console.log(inviteArr);

                if (inviteArr.length == 0) {
                    console.log("Invite List Removed");
                    inviteNote.style.background = "#008222";
                }
            });
        };

        fetchData(userBase);
        fetchGifts(userGifts);
        fetchInvites(userInvites);

        listeningFirebaseRefs.push(userBase);
        listeningFirebaseRefs.push(userGifts);
        listeningFirebaseRefs.push(userInvites);
    }


    //This function is called from the databaseQuery() function and helps find the index of a user's data to properly
    //update or remove it from the userArr array.
  function findUIDItemInArr(item, userArray){
    for(var i = 0; i < userArray.length; i++){
      if(userArray[i].uid == item){
        //console.log("Found item: " + item);
        return i;
      }
    }
    return -1;
  }


  //This function creates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
  //with the proper gift's details and buttons.
  function createGiftElement(giftDescription, giftLink, giftReceived, giftTitle, giftKey, giftWhere, giftUid, giftDate,
                             giftBuyer){
      try{
          document.getElementById("TestGift").remove();
      } catch (err) {}

      var liItem = document.createElement("LI");
      liItem.id = "gift" + giftUid;
      liItem.className = "gift";
      liItem.onclick = function (){
          var spanGift = document.getElementsByClassName("close")[0];
          var updateBtn = document.getElementById('giftUpdate');
          var deleteBtn = document.getElementById('giftDelete');
          var descField = document.getElementById('giftDescription');
          var titleField = document.getElementById('giftTitle');
          var whereField = document.getElementById('giftWhere');
          var linkField = document.getElementById('giftLink');

          if (giftLink != ""){
              linkField.innerHTML = "Click me to go to the webpage!";
              linkField.onclick = function() {
                  var newGiftLink = "http://";
                  if(giftLink.includes("https://")){
                      giftLink = giftLink.slice(8, giftLink.length);
                  } else if (giftLink.includes("http://")){
                      giftLink = giftLink.slice(7, giftLink.length);
                  }
                  newGiftLink += giftLink;
                  window.open(newGiftLink, "_blank");
              };
          } else {
              linkField.innerHTML = "There was no link provided";
              linkField.onclick = function() {
              };
          }
          if(giftDescription != "") {
              descField.innerHTML = "Description: " + giftDescription;
          } else {
              descField.innerHTML = "There was no description provided";
          }
          titleField.innerHTML = giftTitle;
          if(giftWhere != "") {
              whereField.innerHTML = "This can be found at: " + giftWhere;
          } else {
              whereField.innerHTML = "There was no location provided";
          }
          if(giftDate != undefined) {
              if (giftDate != "") {
                  giftCreationDate.innerHTML = "Created on: " + giftDate;
              } else {
                  giftCreationDate.innerHTML = "Creation date not available";
              }
          } else {
              giftCreationDate.innerHTML = "Creation date not available";
          }
          updateBtn.onclick = function(){
              updateMaintenanceLog("home", "Attempting to update gift: " + giftTitle + " " + giftKey + " " + user.userName);
              updateGiftElement(giftUid);
          };
          deleteBtn.onclick = function(){
              updateMaintenanceLog("home", "Attempting to delete gift: " + giftTitle + " " + giftKey + " " + user.userName);
              deleteGiftElement(giftKey, giftTitle, giftUid, giftBuyer);
          };

          //show modal
          modal.style.display = "block";

          //close on close
          spanGift.onclick = function() {
              modal.style.display = "none";
          };

          //close on click
          window.onclick = function(event) {
              if (event.target == modal) {
                  modal.style.display = "none";
              }
          }
      }
      var textNode = document.createTextNode(giftTitle);
      liItem.appendChild(textNode);
      giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
      clearInterval(offlineTimer);

      giftCounter++;
      if (giftCounter > 5)
          boughtGifts.style.opacity = ".75";
  }


  //This function updates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
  //with the proper gift's details and buttons.
    function changeGiftElement(description, link, received, title, key, where, uid, date, buyer) {
        var editGift = document.getElementById("gift" + uid);
        editGift.innerHTML = title;
        editGift.className = "gift";
        editGift.onclick = function (){
            var spanGift = document.getElementsByClassName("close")[0];
            var updateBtn = document.getElementById('giftUpdate');
            var deleteBtn = document.getElementById('giftDelete');
            var descField = document.getElementById('giftDescription');
            var titleField = document.getElementById('giftTitle');
            var whereField = document.getElementById('giftWhere');
            var linkField = document.getElementById('giftLink');

            if (link != ""){
                linkField.innerHTML = "Click me to go to the webpage!";
                linkField.onclick = function() {
                    var newGiftLink = "http://";
                    if(link.includes("https://")){
                        link = link.slice(8, link.length);
                    } else if (link.includes("http://")){
                        link = link.slice(7, link.length);
                    }
                    newGiftLink += link;
                    window.open(newGiftLink, "_blank");
                };
            } else {
                linkField.innerHTML = "There was no link provided";
                linkField.onclick = function() {
                };
            }
            if(description != "") {
                descField.innerHTML = "Description: " + description;
            } else {
                descField.innerHTML = "There was no description provided";
            }
            titleField.innerHTML = title;
            if(where != "") {
                whereField.innerHTML = "This can be found at: " + where;
            } else {
                whereField.innerHTML = "There was no location provided";
            }
            if(date != undefined) {
                if (date != "") {
                    giftCreationDate.innerHTML = "Created on: " + date;
                } else {
                    giftCreationDate.innerHTML = "Creation date not available";
                }
            } else {
                giftCreationDate.innerHTML = "Creation date not available";
            }
            updateBtn.onclick = function(){
                updateMaintenanceLog("home", "Attempting to update gift: " + title + " " + key + " " + user.userName);
                updateGiftElement(uid);
            };
            deleteBtn.onclick = function(){
                updateMaintenanceLog("home", "Attempting to delete gift: " + title + " " + key + " " + user.userName);
                deleteGiftElement(key, title, uid, buyer);
            };

            //show modal
            modal.style.display = "block";

            //close on close
            spanGift.onclick = function() {
                modal.style.display = "none";
            };

            //close on click
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }
        };
    }


  //This removes the gift's element from the webpage and deploys an empty gift list notification if necessary.
  function removeGiftElement(uid) {
    document.getElementById("gift" + uid).remove();

    giftCounter--;
    if (giftCounter == 0){
      deployGiftListEmptyNotification();
    }
  }


  //This redirects the user to the giftAddUpdate page to update a specific gift.
    function updateGiftElement(uid) {
        giftStorage = uid;
        privateList = "";
        sessionStorage.setItem("privateList", JSON.stringify(privateList));
        sessionStorage.setItem("giftStorage", JSON.stringify(giftStorage));
        navigation(5);
    }


  //This deletes a specific gift from the user's data in the database and adds a notification if it had a buyer
  function deleteGiftElement(key, title, uid, buyer) {
    var verifyDeleteBool = true;
    var toDelete = -1;

    for (var i = 0; i < giftArr.length; i++){
      if(title == giftArr[i].title) {
        toDelete = i;
        break;
      }
    }

    if(toDelete != -1) {
      giftArr.splice(toDelete, 1);

      for (var i = 0; i < giftArr.length; i++) {
        if (title == giftArr[i].title) {
          verifyDeleteBool = false;
          break;
        }
      }
    } else {
      verifyDeleteBool = false;
    }

    if(verifyDeleteBool){
      removeGiftElement(uid);
      firebase.database().ref("users/" + user.uid).update({
        giftList: giftArr
      });

      modal.style.display = "none";

      noteInfoField.innerHTML = "Gift Deleted";
      noteTitleField.innerHTML = "Gift " + title + " successfully deleted!";
      noteModal.style.display = "block";

      //close on close
      noteSpan.onclick = function() {
        noteModal.style.display = "none";
      };

      //close on click
      window.onclick = function(event) {
        if (event.target == noteModal) {
          noteModal.style.display = "none";
        }
      };

      var nowJ = 0;
      var j = setInterval(function(){
        nowJ = nowJ + 1000;
        if(nowJ >= 3000){
          noteModal.style.display = "none";
          clearInterval(j);
        }
      }, 1000);

      if(buyer != ""){
        var userFound = findUserNameItemInArr(buyer, userArr);
        if(userFound != -1){
          addNotificationToDB(userArr[userFound], title);
        } else {
          console.log("User not found");
        }
      } else {
        console.log("No buyer, no notification needed");
      }

    } else {
      alert("Delete failed, please try again later!");
    }
  }


    //This function is called from the deleteGiftElement() function and helps find the index of a user's User Name to
    //properly add a notification to the database
  function findUserNameItemInArr(item, userArray){
    for(var i = 0; i < userArray.length; i++){
      if(userArray[i].userName == item){
        console.log("Found item: " + item);
        return i;
      }
    }
    return -1;
  }


  //This function adds a notification to the database
  function addNotificationToDB(buyerUserData, giftTitle){
    var pageName = "deleteGift";
    var giftOwner = user.uid;
    var notificationString = generateNotificationString(giftOwner, giftTitle, pageName);
    var buyerUserNotifications;
    if(buyerUserData.notifications == undefined || buyerUserData.notifications == null){
      buyerUserNotifications = [];
    } else {
      buyerUserNotifications = buyerUserData.notifications;
    }
    buyerUserNotifications.push(notificationString);

    if(buyerUserData.notifications != undefined) {
      firebase.database().ref("users/" + buyerUserData.uid).update({
        notifications: buyerUserNotifications
      });
    } else {
      console.log("New Notifications List");
      firebase.database().ref("users/" + buyerUserData.uid).update({notifications:{0:notificationString}});
    }
    console.log("Added Notification To DB");
  }

  //This function helps generate the notification data for each notification
  function generateNotificationString(giftOwner, giftTitle, pageName){
    console.log("Generating Notification");
    return (giftOwner + "," + giftTitle + "," + pageName);
  }
};

//This function adds specific data to a maintenance log stored in the DB
function updateMaintenanceLog(locationData, detailsData) {
    var today = new Date();
    var UTChh = today.getUTCHours();
    var UTCmm = today.getUTCMinutes();
    var UTCss = today.getUTCSeconds();
    var dd = today.getUTCDate();
    var mm = today.getMonth()+1;
    var yy = today.getFullYear();
    var timeData = mm + "/" + dd + "/" + yy + " " + UTChh + ":" + UTCmm + ":" + UTCss;
    var newUid = firebase.database().ref("maintenance").push();
    newUid = newUid.toString();
    newUid = newUid.substr(51, 70);

    firebase.database().ref("maintenance/" + newUid).set({
        uid: newUid,
        location: locationData,
        details: detailsData,
        time: timeData
    });
}


//This function deploys a notification that shows that the user's gift list is empty
function deployGiftListEmptyNotification(){
    try{
        document.getElementById("TestGift").innerHTML = "No Gifts Found! Add Some Gifts With The Button Below!";
    } catch(err){
        console.log("Loading Element Missing, Creating A New One");
        var liItem = document.createElement("LI");
        liItem.id = "TestGift";
        liItem.className = "gift";
        var textNode = document.createTextNode("No Gifts Found! Add Some Gifts With The Button Below!");
        liItem.appendChild(textNode);
        giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
    }

    clearInterval(offlineTimer);
}


//This function signs out the user and clears their data from memory
function signOut(){
  sessionStorage.clear();
  window.location.href = "index.html";
}


//This function assists the navigation tab in storing basic data before redirecting to another page
function navigation(nav){
    sessionStorage.setItem("validUser", JSON.stringify(user));
    sessionStorage.setItem("userArr", JSON.stringify(userArr));
    switch(nav){
        case 0:
            window.location.href = "home.html";
            break;
        case 1:
            window.location.href = "lists.html";
            break;
        case 2:
            window.location.href = "invites.html";
            break;
        case 3:
            window.location.href = "settings.html";
            break;
        case 4:
            window.location.href = "notifications.html";
            break;
        case 5:
            window.location.href = "giftAddUpdate.html";
        default:
            break;
    }
}
