/*
Welcome to the moderation page! This page welcomes moderators to all the users in their Gifty database. You can view
each user's UID, user name, number of gifts (and gift list, if clicked here), number of friends, and password (if
clicked here). A moderator can also grant a user the moderator role and send them a message individually. Eventually,
the moderator will also be able to warn and ban the user from this page, but that is not implemented at this time.
Finally, a moderator can also send a message globally, to all the users, as needed. As always, there is also a
navigation tab at the top of the window that shows the user their options for which page they would like to navigate
to or sign out.

As per usual, the typical object declarations are below!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var userArr = [];                       //An array that stores all the user data that is fetched from the database
var userUIDArr = [];                    //An array that stores all the user's UIDs
var tempUserArr = [];                   //An array used to help assign Secret Santa Names, is a duplicate of userArr
var optInUserArr = [];                  //An array used to collect users that have opted into the Secret Santa System

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var secretSantaIntBool = false;         //A boolean used to check if there are enough people opted in to Secret Santa
var secretSantaNameBool = false;        //A boolean used to check if a Secret Santa Name object is empty

var currentModalOpen = "";              //A string used to help keep track of the current modal open

var moderationSet = 1;                  //An integer used to verify that a moderator is viewing this page
var userCounter = 0;                    //An integer used to keep track of the number of users loaded on the page
var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 1800;                 //The maximum limit to logout the user after being inactive for too long

var giftList;                           //Stores the "Gift List" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var addGlobalMsgModal;                  //Stores the "Global Message" modal for sending global messages
var addGlobalMsgBtn;                    //Stores the "Global Message" button for sending global messages
var sendPrivateMessage;                 //Stores the "Private Message" text field for sending individual messages
var user;                               //Stores an authenticated user's data
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var modal;                              //Stores the modal that is used for displaying gift details
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var userInitial;                        //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data
var activateSecretSanta;                //Stores the "Activate Secret Santa" object on the webpage
var secretSantaModal;                   //Stores the modal that is used to display Secret Santa options
var santaModalSpan;                     //Stores the "X" object on the "Secret Santa" window
var secretSantaShuffle;                 //Stores the "Secret Santa Shuffle" object on the webpage
var secretSantaBtn;                     //Stores the "Secret Santa" options object on the webpage


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
    try {
        user = JSON.parse(sessionStorage.validUser);
        console.log("User: " + user.userName + " logged in");
        if (user.invites == undefined) {
            console.log("Invites Not Found");
        } else if (user.invites != undefined) {
            if (user.invites.length > 0) {
                inviteNote.style.background = "#ff3923";
            }
        }

        if (user.moderatorInt == 0){
            window.location.href = "home.html";
        }
        userArr = JSON.parse(sessionStorage.userArr);
        sessionStorage.setItem("moderationSet", moderationSet);
    } catch (err) {
        console.log(err.toString());
        window.location.href = "index.html";
    }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, the database is queried, the "toggle"
//feature is activated on the "Settings" tab, and the login timer is started.
window.onload = function instantiate() {

  giftList = document.getElementById('giftListContainer');
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById('closeOffline');
  inviteNote = document.getElementById('inviteNote');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
  addGlobalMsgModal = document.getElementById('userModal');
  addGlobalMsgBtn = document.getElementById('sendGlobalNotification');
  sendPrivateMessage = document.getElementById('sendPrivateMessage');
  modal = document.getElementById('giftModal');
  activateSecretSanta = document.getElementById('activateSecretSanta');
  secretSantaModal = document.getElementById('santaModal');
  santaModalSpan = document.getElementById('secretSantaSpan');
  secretSantaShuffle = document.getElementById('secretSantaShuffle');
  secretSantaBtn = document.getElementById('secretSantaBtn');
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


  window.addEventListener("online", function(){
    offlineModal.style.display = "none";
    currentModalOpen = "";
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
                        document.getElementById("TestGift").innerHTML = "No Users Found!";
                    }
                } catch(err) {
                    if(userCounter == 0){
                        console.log("Loading Element Missing, Creating A New One");
                        var liItem = document.createElement("LI");
                        liItem.id = "TestGift";
                        liItem.className = "gift";
                        if (onlineInt == 0) {
                            var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
                        } else {
                            var textNode = document.createTextNode("No Users Found!");
                        }
                        liItem.appendChild(textNode);
                        giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
                    }
                }
                offlineModal.style.display = "block";
                currentModalOpen = "offlineModal";
                clearInterval(offlineTimer);
            }
        }, 1000);
});

  //close offlineModal on close
  offlineSpan.onclick = function() {
    offlineModal.style.display = "none";
    currentModalOpen = "";
  };

  //close offlineModal on click
  window.onclick = function(event) {
    if (event.target == offlineModal) {
      offlineModal.style.display = "none";
      currentModalOpen = "";
    }
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

  settingsModerateButton();

  loginTimer(); //if action, then reset timer

  initializeSecretSantaArrs();


  //This function initializes the arrays needed for the Secret Santa system
  function initializeSecretSantaArrs(){
        tempUserArr = [];
        optInUserArr = [];

        for (var i = 0; i < userArr.length; i++) {
            if (userArr[i].secretSantaName != null)
                if (userArr[i].secretSantaName != "")
                    secretSantaNameBool = true;
            if (userArr[i].secretSanta != null)
                if (userArr[i].secretSanta == 1) {
                    tempUserArr.push(userArr[i]);
                    optInUserArr.push(userArr[i]);
                    if (optInUserArr.length > 2)
                        secretSantaIntBool = true;
                }
        }
    }

  generateSecretSantaModal();


  //This function initializes and generates a Secret Santa shuffle/activate modal
  function generateSecretSantaModal(){
        activateSecretSanta.onclick = function() {
            if (secretSantaNameBool && secretSantaIntBool) {
                secretSantaBtn.onclick = function () {
                    secretSantaBtn.innerHTML = "Click On Me To Deactivate Secret Santa";
                    removeSecretSantaNames();
                    updateAllUsersToDBSantaNames();
                    alert("The Secret Santa Has Been Deactivated!");
                    removeSecretSantaNums();
                    updateAllUsersToDBSantaNums();
                    secretSantaNameBool = false;
                    secretSantaModal.style.display = "none";
                    currentModalOpen = "";
                    generateSecretSantaModal();
                };

                secretSantaShuffle.onclick = function () {
                    initializeSecretSantaArrs();
                    removeSecretSantaNames();
                    createSecretSantaNames();
                    secretSantaNameBool = true;
                    alert("The Secret Santa has been shuffled!");
                };

                secretSantaBtn.innerHTML = "Click On Me To Deactivate Secret Santa";
                secretSantaShuffle.innerHTML = "Click Me To Shuffle Secret Santa Names!";

            } else if (secretSantaIntBool) {
                secretSantaBtn.onclick = function () {
                    secretSantaBtn.innerHTML = "Click On Me To Activate Secret Santa";
                    createSecretSantaNames();
                    alert("Secret Santa System Has Been Initialized. Enjoy!");
                    secretSantaNameBool = true;
                    secretSantaModal.style.display = "none";
                    currentModalOpen = "";
                    generateSecretSantaModal();
                };

                secretSantaShuffle.onclick = function(){
                    alert("Shuffle Button Not Available Until Secret Santa Is Active");
                };

                secretSantaBtn.innerHTML = "Click On Me To Activate Secret Santa";
                secretSantaShuffle.innerHTML = "Shuffle Button Not Available!";

            } else {
                secretSantaBtn.onclick = function () {
                    alert("Secret Santa Button Is Not Available Until 3 Or More Users Have Signed Up");
                };

                secretSantaShuffle.onclick = function(){
                    alert("Shuffle Button Not Available Until Secret Santa Is Active");
                };

                secretSantaBtn.innerHTML = "Secret Santa Not Available! Click Me For More Info!";
                secretSantaShuffle.innerHTML = "Shuffle Button Not Available!";
            }

            santaModalSpan.onclick = function(){
                secretSantaModal.style.display = "none";
                currentModalOpen = "";
            };

            window.onclick = function(event) {
                if (event.target == secretSantaModal) {
                    secretSantaModal.style.display = "none";
                    currentModalOpen = "";
                }
            };

            secretSantaModal.style.display = "block";
            currentModalOpen = "secretSantaModal";
        };

        activateSecretSanta.innerHTML = "Secret Santa";
    }


  //This function randomly assigns Secret Santa names and checks to make sure that everyone is assigned a name
  function createSecretSantaNames(){
        var selector;
        var userIndex;
        var retryCount = 0;

        for (var i = 0; i < optInUserArr.length; i++) {
            selector = Math.floor((Math.random() * tempUserArr.length));
            if (!userUIDArr.includes(tempUserArr[selector].uid)) {
                if (tempUserArr[selector].name != optInUserArr[i].name) {
                    if (optInUserArr[i].friends.includes(tempUserArr[selector].uid)) {
                        console.log("Matched " + tempUserArr[selector].name + " to " + optInUserArr[i].name);
                        userUIDArr.push(tempUserArr[selector].uid);
                        userIndex = findUIDItemInArr(optInUserArr[i].uid, userArr);
                        userArr[userIndex].secretSantaName = tempUserArr[selector].uid;
                        tempUserArr.splice(selector, 1);
                        retryCount = 0;
                    } else {
                        //console.log("These Users Aren't Friends :(");
                        retryCount++;
                        if(retryCount >= 10)
                            break;
                        i--;
                    }
                } else {
                    //console.log("These Are The Same Users :(");
                    retryCount++;
                    if(retryCount >= 10)
                        break;
                    i--;
                }
            } else {
                //console.log("User Has Already Been Picked");
                retryCount++;
                if(retryCount >= 10)
                    break;
                i--;
            }
        }

        if (optInUserArr.length != userUIDArr.length) {
            console.log("USERUIDARR:");
            console.log(userUIDArr);
            console.log("TEMPUSERARR:");
            console.log(tempUserArr);
            userUIDArr = [];
            removeSecretSantaNames();
            alert("Secret Santa System Was Unable To Properly Initialize Secret Santa Names. Please Try Again");
        } else {
            sessionStorage.setItem("userArr", JSON.stringify(userArr));
            updateAllUsersToDBSantaNames();
            userUIDArr = [];
        }
    }


  //This function removes the Secret Santa names in the case of an error or in case of turning off the system
  function removeSecretSantaNames(){
        for (var i = 0; i < userArr.length; i++)
            userArr[i].secretSantaName = "";

        sessionStorage.setItem("userArr", JSON.stringify(userArr));
    }


  //This function removes the Secret Santa opt-in numbers in case of turning off the Secret Santa system
  function removeSecretSantaNums(){
        for (var i = 0; i < userArr.length; i++)
            userArr[i].secretSanta = 0;

        sessionStorage.setItem("userArr", JSON.stringify(userArr));
    }


  //This function updates all the users Secret Santa opt-in numbers to the database
  function updateAllUsersToDBSantaNums(){
        for(var i = 0; i < userArr.length; i++){
            if (userArr[i].secretSanta != undefined) {
                firebase.database().ref("users/" + userArr[i].uid).update({
                    secretSanta: userArr[i].secretSanta
                });
            } else {
                console.log("Failed To Update Num " + userArr[i].name);
            }
        }
    }


  //This function updates all the users Secret Santa names to the database
  function updateAllUsersToDBSantaNames(){
        for(var i = 0; i < userArr.length; i++) {
            if (userArr[i].secretSantaName != undefined) {
                firebase.database().ref("users/" + userArr[i].uid).update({
                    secretSantaName: userArr[i].secretSantaName
                });
            } else {
                console.log("Failed To Update Name " + userArr[i].name);
            }
        }
    }


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
            currentModalOpen = "";
        } catch (err) {
            //console.log("Basic Modal Not Open");
        }
        noteInfoField.innerHTML = "You have been inactive for 5 minutes, you will be logged out in " + timeMins
            + ":" + timeSecs + "!";
        noteTitleField.innerHTML = "Are You Still There?";
        noteModal.style.display = "block";
        currentModalOpen = "noteModal";

        //close on close
        noteSpan.onclick = function() {
            noteModal.style.display = "none";
            currentModalOpen = "";
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
                currentModalOpen = "";
                areYouStillThereBool = false;
                clearInterval(j);
            }
        }, 1000);

        //close on click
        window.onclick = function(event) {
            if (event.target == noteModal) {
                noteModal.style.display = "none";
                currentModalOpen = "";
                areYouStillThereBool = false;
            }
        };
    }


    //This function activates a "toggle" on the settings button to notify the user that they are on the moderation page.
  function settingsModerateButton(){
    var nowConfirm = 0;
    var alternator = 0;
    console.log("Settings Button Feature Active");
    setInterval(function(){
      nowConfirm = nowConfirm + 1000;
      if(nowConfirm >= 3000){
        nowConfirm = 0;
        if(alternator == 0) {
          alternator++;
          document.getElementById("settingsNote").innerHTML = "Settings";
          settingsNote.style.background = "#00c606";
        } else {
          alternator--;
          document.getElementById("settingsNote").innerHTML = "Moderation";
          settingsNote.style.background = "#00ad05";
        }
      }
    }, 1000);
  }


  //This function generates the modal that is used for sending messages to individual users
  function generatePrivateMessageDialog(userData) {
        var sendNote = document.getElementById('sendNote');
        var cancelNote = document.getElementById('cancelNote');
        var privateNoteInp = document.getElementById('globalNoteInp');
        var spanNote = document.getElementById('globalNoteSpan');
        var globalNoteTitle = document.getElementById('globalNoteTitle');

        globalNoteTitle.innerHTML = "Send A Private Message Below";
        privateNoteInp.placeholder = "Hey! Just to let you know...";

        sendNote.onclick = function (){
            if(privateNoteInp.value.includes(",")){
                alert("Please do not use commas in the message. Thank you!");
            } else {
                addPrivateMessageToDB(userData, privateNoteInp.value);
                privateNoteInp.value = "";
                addGlobalMsgModal.style.display = "none";
                currentModalOpen = "";
                alert("The Private Message Has Been Sent!");
            }
        };
        cancelNote.onclick = function (){
            privateNoteInp.value = "";
            addGlobalMsgModal.style.display = "none";
            currentModalOpen = "";
        };

        addGlobalMsgModal.style.display = "block";
        currentModalOpen = "globalMessageModal";

        //close on close
        spanNote.onclick = function() {
            addGlobalMsgModal.style.display = "none";
            currentModalOpen = "";
        };

        //close on click
        window.onclick = function(event) {
            if (event.target == addGlobalMsgModal) {
                addGlobalMsgModal.style.display = "none";
                currentModalOpen = "";
            }
        };
    }


  //This function adds the private message to the specified user onto the database
  function addPrivateMessageToDB(userData, message) {
    var userNotificationArr = [];
    if(userData.notifications == undefined){
      userNotificationArr = [];
    } else {
      userNotificationArr = userData.notifications;
    }
    userNotificationArr.push(message);

    if(userData.notifications == undefined) {
      firebase.database().ref("users/" + userData.uid).update({notifications:{0:message}});
    } else {
      firebase.database().ref("users/" + userData.uid).update({
        notifications: userNotificationArr
      });
    }
  }


  //This function generates the modal that is used for sending messages to users globally
  function initializeGlobalNotification() {
        addGlobalMsgBtn.innerHTML = "Send Global Message";
        addGlobalMsgBtn.onclick = function (){
            var sendNote = document.getElementById('sendNote');
            var cancelNote = document.getElementById('cancelNote');
            var globalNoteInp = document.getElementById('globalNoteInp');
            var spanNote = document.getElementById('globalNoteSpan');
            var globalNoteTitle = document.getElementById('globalNoteTitle');

            globalNoteInp.placeholder = "WARNING: An Important Message...";
            globalNoteTitle.innerHTML = "Enter Global Notification Below";

            sendNote.onclick = function (){
                if(globalNoteInp.value.includes(",")){
                    alert("Please do not use commas in the notification. Thank you!");
                } else {
                    addGlobalMessageToDB(globalNoteInp.value);
                    globalNoteInp.value = "";
                    addGlobalMsgModal.style.display = "none";
                    currentModalOpen = "";
                    alert("The Global Message Has Been Sent!");
                }
            };
            cancelNote.onclick = function (){
                globalNoteInp.value = "";
                addGlobalMsgModal.style.display = "none";
                currentModalOpen = "";
            };

            addGlobalMsgModal.style.display = "block";
            currentModalOpen = "globalMessageModal";

            //close on close
            spanNote.onclick = function() {
                addGlobalMsgModal.style.display = "none";
                currentModalOpen = "";
            };

            //close on click
            window.onclick = function(event) {
                if (event.target == addGlobalMsgModal) {
                    addGlobalMsgModal.style.display = "none";
                    currentModalOpen = "";
                }
            };
        };
    }


    //This function adds the private message to all users onto the database
  function addGlobalMessageToDB(message) {
    var userNotificationArr = [];
    for (var i = 0; i < userArr.length; i++){
      if(userArr[i].notifications == undefined){
        userNotificationArr = [];
      } else {
        userNotificationArr = userArr[i].notifications;
      }
      userNotificationArr.push(message);

      if(userArr[i].notifications == undefined) {
        firebase.database().ref("users/" + userArr[i].uid).update({notifications:{0:message}});
      } else {
        firebase.database().ref("users/" + userArr[i].uid).update({
          notifications: userNotificationArr
        });
      }
    }
  }


    //This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
    //as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
    //locations are stored and checked on regularly.
  function databaseQuery() {

        userInitial = firebase.database().ref("users/");
        userInvites = firebase.database().ref("users/" + user.uid + "/invites");

        var fetchData = function (postRef) {
            postRef.on('child_added', function (data) {
                createUserElement(data.val());

                if(onlineInt == 0) {
                    onlineInt = 1;
                    initializeGlobalNotification();
                }

                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    //console.log("Adding " + userArr[i].userName + " to most updated version: " + data.val().userName);
                    userArr[i] = data.val();
                }

                if(data.key == user.uid){
                    user = data.val();
                    //console.log("User Updated: 1");
                }
            });

            postRef.on('child_changed', function (data) {
                changeUserElement(data.val());

                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    //console.log("Updating " + userArr[i].userName + " to most updated version: " + data.val().userName);
                    userArr[i] = data.val();
                }

                if(data.key == user.uid){
                    user = data.val();
                    //console.log("User Updated: 2");
                }

                if(currentModalOpen == data.key) {
                    modal.style.display = "none";
                    currentModalOpen = "";
                }
            });

            postRef.on('child_removed', function (data) {
                removeUserElement(data.val().uid);

                var i = findUIDItemInArr(data.key, userArr);
                if(userArr[i] != data.val() && i != -1){
                    //console.log("Removing " + userArr[i].userName + " / " + data.val().userName);
                    userArr.splice(i, 1);
                }

                if(currentModalOpen == data.key) {
                    modal.style.display = "none";
                    currentModalOpen = "";
                }
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

        fetchData(userInitial);
        fetchInvites(userInvites);

        listeningFirebaseRefs.push(userInitial);
        listeningFirebaseRefs.push(userInvites);
    }


    //This function is called from the databaseQuery() function and helps find the index of a user's data to properly
    //update or remove it from the userArr array.
  function findUIDItemInArr(item, userArray){
    for(var i = 0; i < userArray.length; i++){
      if(userArray[i].uid == item){
        console.log("Found item: " + item);
        return i;
      }
    }
    return -1;
  }


    //This function creates each user element that appears on the page. Once a user's element is clicked, their
    //respective unique id, user name, number of gifts (if clicked), number of friends, and password (if clicked) are
    //available. The user can also be granted moderator role, sent a private message, warned, or banned from here. It
    //should be noted that warning and banning are not currently operational functions.
  function createUserElement(userData){
        try{
            document.getElementById("TestGift").remove();
        } catch (err) {}

        var liItem = document.createElement("LI");
        liItem.id = "user" + userData.uid;
        liItem.className = "gift";
        if (userData.secretSanta != null)
            if (userData.secretSanta == 1)
                liItem.className += " santa";
        liItem.onclick = function (){
            var spanGift = document.getElementsByClassName("close")[0];
            var warnBtn = document.getElementById('warnUser');
            var banBtn = document.getElementById('banUser');
            var userName = document.getElementById('userName');
            var userUID = document.getElementById('userUID');
            var userUserName = document.getElementById('userUserName');
            var userGifts = document.getElementById('userGifts');
            var userPrivateGifts = document.getElementById('userPrivateGifts');
            var userFriends = document.getElementById('userFriends');
            var userPassword = document.getElementById('userPassword');
            var userSecretSanta = document.getElementById('userSecretSanta');
            var moderatorOp = document.getElementById('moderatorOp');

            userName.innerHTML = userData.name;
            userUID.innerHTML = userData.uid;
            userUserName.innerHTML = userData.userName;
            if(userData.giftList != undefined){
                userGifts.innerHTML = "# Gifts: " + userData.giftList.length;
            } else {
                userGifts.innerHTML = "This User Has No Gifts";
            }
            if(userData.privateList != undefined){
                userPrivateGifts.innerHTML = "# Private Gifts: " + userData.privateList.length;
            } else {
                userPrivateGifts.innerHTML = "This User Has No Private Gifts";
            }
            if(userData.friends != undefined) {
                userFriends.innerHTML = "# Friends: " + userData.friends.length;
            } else {
                userFriends.innerHTML = "This User Has No Friends";
            }
            userPassword.innerHTML = "Click On Me To View Password";

            if(userData.secretSanta != undefined) {
                if (userData.secretSanta == 0)
                    userSecretSanta.innerHTML = "This User Is Not Opted Into Secret Santa";
                else
                    userSecretSanta.innerHTML = "This User Is Signed Up For Secret Santa";
            } else {
                userSecretSanta.innerHTML = "This User Is Not Opted Into Secret Santa";
            }

            userSecretSanta.onclick = function() {
                manuallyOptInOut(userData);
            };

            userGifts.onclick = function() {
                if(userData.uid == user.uid){
                    alert("Navigate to the home page to see your gifts!");
                } else {
                    sessionStorage.setItem("validGiftUser", JSON.stringify(userData));//Other User Data
                    navigation(4);
                }
            };
            userPrivateGifts.onclick = function() {
                if(userData.uid == user.uid){
                    alert("You aren't allowed to see these gifts, silly!");
                } else {
                    sessionStorage.setItem("validGiftUser", JSON.stringify(userData));//Other User Data
                    navigation(5);
                }
            };
            userPassword.onclick = function() {
                try {
                    userPassword.innerHTML = decode(userData.encodeStr);
                } catch (err) {
                    userPassword.innerHTML = userData.pin;
                }
            };
            warnBtn.onclick = function(){
                alert("This will eventually warn the user of a certain offense");
                //warn function
            };
            banBtn.onclick = function(){
                alert("This will eventually ban the user for a certain offense");
                //ban function
            };
            if (userData.uid == "-L__dcUyFssV44G9stxY" && user.uid != "-L__dcUyFssV44G9stxY") {
                moderatorOp.innerHTML = "Don't Even Think About It";
                moderatorOp.onclick = function() {

                }
            } else if (userData.moderatorInt == 1) {
                moderatorOp.innerHTML = "Revoke Moderator Role";
                moderatorOp.onclick = function() {
                    if(userData.uid == user.uid){
                        alert("You cannot adjust your own role");
                    } else {
                        alert("Revoked role for: " + userData.userName);
                        firebase.database().ref("users/" + userData.uid).update({
                            moderatorInt: 0
                        });
                        modal.style.display = "none";
                        currentModalOpen = "";
                    }
                };
            } else {
                moderatorOp.innerHTML = "Grant Moderator Role";
                moderatorOp.onclick = function() {
                    if(userData.userName == user.userName){
                        alert("You cannot adjust your own role");
                        console.log("...How'd you get here...?");
                    } else {
                        alert("Granted role for: " + userData.userName);
                        firebase.database().ref("users/" + userData.uid).update({
                            moderatorInt: 1
                        });
                        modal.style.display = "none";
                        currentModalOpen = "";
                    }
                };
            }

            sendPrivateMessage.innerHTML = "Send Message To " + userData.name;
            sendPrivateMessage.onclick = function() {
                generatePrivateMessageDialog(userData);
            };

            //show modal
            modal.style.display = "block";
            currentModalOpen = userData.uid;

            //close on close
            spanGift.onclick = function() {
                modal.style.display = "none";
                currentModalOpen = "";
            };

            //close on click
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                    currentModalOpen = "";
                }
            };
        };
        var textNode = document.createTextNode(userData.name);
        liItem.appendChild(textNode);

        giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
        clearInterval(offlineTimer);

        userCounter++;
        if (userCounter > 5) {
            activateSecretSanta.style.opacity = ".75";
        }
    }


    //This function changes each user element that appears on the page. Once a user's element is clicked, their
    //respective unique id, user name, number of gifts (if clicked), number of friends, and password (if clicked) are
    //available. The user can also be granted moderator role, sent a private message, warned, or banned from here. It
    //should be noted that warning and banning are not currently operational functions.
  function changeUserElement(userData) {
        var editGift = document.getElementById("user" + userData.uid);
        editGift.innerHTML = userData.name;
        editGift.className = "gift";
        if (userData.secretSanta != null)
            if (userData.secretSanta == 1)
                editGift.className += " santa";
        editGift.onclick = function (){
            var spanGift = document.getElementsByClassName("close")[0];
            var warnBtn = document.getElementById('warnUser');
            var banBtn = document.getElementById('banUser');
            var userName = document.getElementById('userName');
            var userUID = document.getElementById('userUID');
            var userUserName = document.getElementById('userUserName');
            var userGifts = document.getElementById('userGifts');
            var userPrivateGifts = document.getElementById('userPrivateGifts');
            var userFriends = document.getElementById('userFriends');
            var userPassword = document.getElementById('userPassword');
            var userSecretSanta = document.getElementById('userSecretSanta');
            var moderatorOp = document.getElementById('moderatorOp');

            userName.innerHTML = userData.name;
            userUID.innerHTML = userData.uid;
            userUserName.innerHTML = userData.userName;
            if(userData.giftList != undefined){
                userGifts.innerHTML = "# Gifts: " + userData.giftList.length;
            } else {
                userGifts.innerHTML = "This User Has No Gifts";
            }
            if(userData.privateList != undefined){
                userPrivateGifts.innerHTML = "# Private Gifts: " + userData.privateList.length;
            } else {
                userPrivateGifts.innerHTML = "This User Has No Private Gifts";
            }
            if(userData.friends != undefined) {
                userFriends.innerHTML = "# Friends: " + userData.friends.length;
            } else {
                userFriends.innerHTML = "This User Has No Friends";
            }
            userPassword.innerHTML = "Click On Me To View Password";

            if(userData.secretSanta != undefined) {
                if (userData.secretSanta == 0)
                    userSecretSanta.innerHTML = "This User Is Not Opted Into Secret Santa";
                else
                    userSecretSanta.innerHTML = "This User Is Signed Up For Secret Santa";
            } else {
                userSecretSanta.innerHTML = "This User Is Not Opted Into Secret Santa";
            }

            userSecretSanta.onclick = function() {
                manuallyOptInOut(userData);
            };

            userGifts.onclick = function() {
                if(userData.uid == user.uid){
                    alert("Navigate to the home page to see your gifts!");
                } else {
                    sessionStorage.setItem("validGiftUser", JSON.stringify(userData));//Other User Data
                    navigation(4);
                }
            };
            userPrivateGifts.onclick = function() {
                if(userData.uid == user.uid){
                    alert("You aren't allowed to see these gifts, silly!");
                } else {
                    sessionStorage.setItem("validGiftUser", JSON.stringify(userData));//Other User Data
                    navigation(5);
                }
            };
            userPassword.onclick = function() {
                userPassword.innerHTML = decode(userData.encodeStr);
            };
            warnBtn.onclick = function(){
                alert("This will eventually warn the user of a certain offense");
                //warn function
            };
            banBtn.onclick = function(){
                alert("This will eventually ban the user for a certain offense");
                //ban function
            };
            if (userData.uid == "-L__dcUyFssV44G9stxY" && user.uid != "-L__dcUyFssV44G9stxY") {
                moderatorOp.innerHTML = "Don't Even Think About It";
                moderatorOp.onclick = function() {

                }
            } else if (userData.moderatorInt == 1) {
                moderatorOp.innerHTML = "Revoke Moderator Role";
                moderatorOp.onclick = function() {
                    if(userData.uid == user.uid){
                        alert("You cannot adjust your own role");
                    } else {
                        alert("Revoked role for: " + userData.userName);
                        firebase.database().ref("users/" + userData.uid).update({
                            moderatorInt: 0
                        });
                        modal.style.display = "none";
                        currentModalOpen = "";
                    }
                };
            } else {
                moderatorOp.innerHTML = "Grant Moderator Role";
                moderatorOp.onclick = function() {
                    if(userData.userName == user.userName){
                        alert("You cannot adjust your own role");
                        console.log("...How'd you get here...?");
                    } else {
                        alert("Granted role for: " + userData.userName);
                        firebase.database().ref("users/" + userData.uid).update({
                            moderatorInt: 1
                        });
                        modal.style.display = "none";
                        currentModalOpen = "";
                    }
                };
            }

            sendPrivateMessage.innerHTML = "Send Message To " + userData.name;
            sendPrivateMessage.onclick = function() {
                generatePrivateMessageDialog(userData);
            };

            //show modal
            modal.style.display = "block";
            currentModalOpen = userData.uid;

            //close on close
            spanGift.onclick = function() {
                modal.style.display = "none";
                currentModalOpen = "";
            };

            //close on click
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                    currentModalOpen = "";
                }
            };
        };
    }


  //This function removes a user element from the page if a user were to delete their account.
  function removeUserElement(uid) {
    document.getElementById("user" + uid).remove();

    userCounter--;
    if (userCounter == 0){
      deployUserListEmptyNotification();
    }
  }
};


//This function manually opts in users to the Secret Santa system
function manuallyOptInOut(userData){
    if (userData.secretSanta != null) {
        if (userData.secretSanta == 0) {
            firebase.database().ref("users/" + userData.uid).update({
                secretSanta: 1
            });
            alert(userData.name + " has been manually opted in to the Secret Santa Program!");
        } else {
            firebase.database().ref("users/" + userData.uid).update({
                secretSanta: 0
            });
            alert(userData.name + " has been manually opted out of the Secret Santa Program!");
        }
    } else {
        firebase.database().ref("users/" + userData.uid).update({
            secretSanta: 0
        });
        alert(userData.name + " has been manually opted out of the Secret Santa Program!");
    }
}


//This function deploys a notification that the user list is empty
function deployUserListEmptyNotification(){
  try{
    document.getElementById("TestGift").innerHTML = "No Users Found!";
  } catch(err){
    console.log("Loading Element Missing, Creating A New One");
    var liItem = document.createElement("LI");
    liItem.id = "TestGift";
    liItem.className = "gift";
    var textNode = document.createTextNode("No Users Found!");
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
            window.location.href = "friendList.html";
            break;
        case 5:
            window.location.href = "privateFriendList.html";
            break;
        default:
            break;
    }
}
