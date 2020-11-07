/*
Welcome to the giftAddUpdate page! This is the page where you can add or change a given gift's details. Much like the
userAddUpdate page, this page offers multiple functions for the user to help keep things a little more efficient. Like
most of the other pages, there is a navigation tab at the top of the page in case the user changes their mind and wants
to go to another page instead or sign out.

Like usual, all the necessary declarations are below!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var giftArr = [];                       //An array that stores all the user's gifts that are fetched from the database

var giftPresent = true;                 //A global boolean used to change the add/update button's text
var privateListBool = true;             //A global boolean used to tell whether this gift is a private gift or not
var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var invalidURLBool = false;             //A global boolean used to verify the validity of a url string

var giftUID = -1;                       //An integer that stands for the index of the current gift
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var giftStorage;                        //Stores a gift object in memory to be sent to the "giftAddUpdate" page
var privateList;                        //If someone reaches this page from a private list, they can edit the private gift
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var user;                               //Stores an authenticated user's data
var privateUser;                        //If someone reaches this page from a private list, we can keep track of that user
var descField;                          //Stores the "Description" input field on the webpage
var titleField;                         //Stores the "Title" input field on the webpage
var whereField;                         //Stores the "Where" input field on the webpage
var linkField;                          //Stores the "Link" input field on the webpage
var spanUpdate;                         //Stores the "Update"/"Add" object on the webpage
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var currentGift;                        //Stores the current gift's data in memory
var userGifts;                          //Stores the current user's gifts in memory
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
    try {
        user = JSON.parse(sessionStorage.validUser);
        privateList = JSON.parse(sessionStorage.privateList);
        if(privateList == null || privateList == undefined || privateList == "") {
            privateListBool = false;
            console.log("User: " + user.userName + " logged in");
        } else {
            privateUser = JSON.parse(sessionStorage.validPrivateUser);
            document.getElementById('homeNote').className = "";
            document.getElementById('listNote').className = "active";
            console.log("User: " + privateUser.userName + " logged in");
            console.log("Friend: " + user.userName + " logged in");
        }
        giftStorage = JSON.parse(sessionStorage.giftStorage);
        if (giftStorage == null || giftStorage == undefined || giftStorage == "") {
            giftPresent = false;
        } else {
            console.log("Gift: " + giftStorage + " found");
        }
        if (!privateListBool)
            if (user.invites == undefined) {
                console.log("Invites Not Found");
            } else if (user.invites != undefined) {
                if (user.invites.length > 0) {
                    inviteNote.style.background = "#ff3923";
                }
            }
            else
            if (currentUser.invites == undefined) {
                console.log("Invites Not Found");
            } else if (currentUser.invites != undefined) {
                if (currentUser.invites.length > 0) {
                    inviteNote.style.background = "#ff3923";
                }
            }
        userArr = JSON.parse(sessionStorage.userArr);
    } catch (err) {
        console.log(err.toString());
        window.location.href = "index.html";
    }
}

//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, the Update/Add button's text and
//function are changed, the database is queried, and the login timer is started.
window.onload = function instantiate() {

  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById("closeOffline");
  descField = document.getElementById('giftDescriptionInp');
  titleField = document.getElementById('giftTitleInp');
  whereField = document.getElementById('giftWhereInp');
  linkField = document.getElementById('giftLinkInp');
  spanUpdate = document.getElementById('updateGift');
  inviteNote = document.getElementById('inviteNote');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
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
    console.log("Online mode activated, clearing offline notification");
    offlineModal.style.display = "none";
    location.reload();
  });

  window.addEventListener("offline", function() {
    var now = 0;
    var g = setInterval(function(){
      now = now + 1000;
      if(now >= 5000){
        offlineModal.style.display = "block";
        clearInterval(g);
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

  if(giftPresent) {
    spanUpdate.innerHTML = "Update Gift";
    spanUpdate.onclick = function() {
      updateGiftToDB();
    }
  } else {
    spanUpdate.innerHTML = "Add New Gift";
    spanUpdate.onclick = function() {
      addGiftToDB();
    }
  }

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

    modal.style.display = "none";
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
        if (!privateListBool)
            noteInfoField.innerHTML = "Welcome back, " + user.name;
        else
            noteInfoField.innerHTML = "Welcome back, " + privateUser.name;
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

    if(!privateListBool) {
      userGifts = firebase.database().ref("users/" + user.uid + "/giftList/");
    } else {
      try{
        userGifts = firebase.database().ref("users/" + privateList.uid + "/privateList/");
      } catch (err) {
        console.log("Unable to connect to private list");
      }
    }

    var fetchData = function (postRef) {
      postRef.on('child_added', function (data) {
        giftArr.push(data);

        if(data.val().uid == giftStorage){
          giftUID = data.key;
          if(privateListBool){
            currentGift = data.val();
          }
          initializeData();
        }
      });

      postRef.on('child_changed', function (data) {
        giftArr[data.key] = data;

        if(data.val().uid == giftStorage){
          currentGift = data.val();
        }
      });

      postRef.on('child_removed', function (data) {
        if(privateListBool){
          sessionStorage.setItem("privateList", JSON.stringify(privateList));
        }
        sessionStorage.setItem("validUser", JSON.stringify(user));
        location.reload();
      });

    };

    fetchData(userGifts);

    listeningFirebaseRefs.push(userGifts);
  }


  //This is where the gift's data is initialized in the respective fields on the webpage
  function initializeData() {
    if(giftPresent) {
      getGift();

      titleField.value = currentGift.title;
      if (currentGift.link == "")
        linkField.placeholder = "No Link Was Provided";
      else
        linkField.value = currentGift.link;
      if (currentGift.where == "")
        whereField.placeholder = "No Location Was Provided";
      else
        whereField.value = currentGift.where;
      if (currentGift.description == "")
        descField.placeholder = "No Description Was Provided";
      else
        descField.value = currentGift.description;
    }
  }


  //This is where the current gift's data is fetched from the user's gift list or private list
  function getGift() {
    if(!privateListBool) {
      for (var i = 0; i < user.giftList.length; i++) {
        if (user.giftList[i].uid == giftStorage) {
          currentGift = user.giftList[i];
          break;
        }
      }
    } else {
      for (var i = 0; i < user.privateList.length; i++) {
        if (privateList.privateList[i].uid == giftStorage) {
          currentGift = privateList.privateList[i];
          break;
        }
      }
    }
  }


  //This function updates the gift to the database, whether they are in a private list or not
    function updateGiftToDB(){
        var newURL = verifyURLString(linkField.value);

        if(titleField.value === "")
            alert("It looks like you left the title blank. Make sure you add a title so other people know what to get " +
                "you!");
        else if (invalidURLBool)
            alert("It looks like you entered an invalid URL, please enter a valid URL or leave the field blank.");
        else {
            if(giftUID != -1) {
                if (!privateListBool) {
                    firebase.database().ref("users/" + user.uid + "/giftList/" + giftUID).update({
                        title: titleField.value,
                        link: newURL,
                        where: whereField.value,
                        received: currentGift.received,
                        uid: giftStorage,
                        buyer: currentGift.buyer,
                        description: descField.value,
                        creationDate: ""
                    });
                    if (currentGift.creationDate != undefined) {
                        if (currentGift.creationDate != "") {
                            firebase.database().ref("users/" + user.uid + "/giftList/" + giftUID).update({
                                creationDate: currentGift.creationDate
                            });
                        }
                    }

                    navigation(0);
                } else {
                    firebase.database().ref("users/" + privateList.uid + "/privateList/" + giftUID).update({
                        title: titleField.value,
                        link: newURL,
                        where: whereField.value,
                        received: currentGift.received,
                        uid: giftStorage,
                        buyer: currentGift.buyer,
                        description: descField.value
                    });
                    if (currentGift.creationDate != undefined) {
                        if (currentGift.creationDate != "") {
                            firebase.database().ref("users/" + privateList.uid + "/privateList/" + giftUID).update({
                                creationDate: currentGift.creationDate
                            });
                        }
                    }
                    if (currentGift.creator != undefined) {
                        if (currentGift.creator != "") {
                            firebase.database().ref("users/" + privateList.uid + "/privateList/" + giftUID).update({
                                creator: currentGift.creator
                            });
                        }
                    }

                    sessionStorage.setItem("validGiftUser", JSON.stringify(user));
                    navigation(4);
                }

                if(currentGift.buyer != ""){
                    var userFound = findUserNameItemInArr(currentGift.buyer, userArr);
                    if(userFound != -1){
                        if(privateListBool){
                            if (userArr[userFound].uid != privateUser.uid) {
                                addNotificationToDB(userArr[userFound], currentGift.title);
                            }
                        } else {
                            console.log(user.uid);
                            if (userArr[userFound].uid != user.uid) {
                                addNotificationToDB(userArr[userFound], currentGift.title);
                            }
                        }
                    } else {
                        console.log("User not found");
                    }
                } else {
                    console.log("No buyer, no notification needed");
                }
            } else {
                alert("There was an error updating the gift, please try again!");
                console.log(giftUID);
            }
        }
        invalidURLBool = false;
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
    var pageName = "friendList.html";
    var giftOwner = user.uid;
    if(privateListBool){
      pageName = "privateFriendList.html";
      giftOwner = privateList.uid;
    }
    var notificationString = generateNotificationString(giftOwner, giftTitle, pageName);
    var buyerUserNotifications;
    if(buyerUserData.notifications == undefined){
      buyerUserNotifications = [];
    } else {
      buyerUserNotifications = buyerUserData.notifications;
    }
    buyerUserNotifications.push(notificationString);

    if(buyerUserData.notifications != undefined) {
      firebase.database().ref("users/" + buyerUserData.uid).update({
        notifications: buyerUserNotifications
      });
      console.log("Added New Notification To DB");
    } else {
      console.log("New Notifications List");
      firebase.database().ref("users/" + buyerUserData.uid).update({notifications:{0:notificationString}});
      console.log("Added Notification To DB");
    }
  }


    //This function helps generate the notification data for each notification
  function generateNotificationString(giftOwner, giftTitle, pageName){
    console.log("Generating Notification");
    return (giftOwner + "," + giftTitle + "," + pageName);
  }


  //This function adds the gift to a public or a private list in the database
    function addGiftToDB(){
        var uid = giftArr.length;
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1;
        var yy = today.getFullYear();
        var creationDate = mm + "/" + dd + "/" + yy;
        var newURL = verifyURLString(linkField.value);

        if(titleField.value === "")
            alert("It looks like you left the title blank. Make sure you add a title so other people know what to get " +
                "you!");
        else if (invalidURLBool)
            alert("It looks like you entered an invalid URL, please enter a valid URL or leave the field blank.");
        else {
            if(!privateListBool) {
                var newUid = firebase.database().ref("users/" + user.uid + "/giftList/" + uid).push();
                newUid = newUid.toString();
                newUid = newUid.substr(77, 96);
                firebase.database().ref("users/" + user.uid + "/giftList/" + uid).set({
                    title: titleField.value,
                    link: newURL,
                    where: whereField.value,
                    received: 0,
                    uid: newUid,
                    buyer: "",
                    description: descField.value,
                    creationDate: creationDate
                });

                navigation(0);
            } else {

                var newUid = firebase.database().ref("users/" + user.uid + "/privateList/" + uid).push();
                newUid = newUid.toString();
                newUid = newUid.substr(80, 96);
                firebase.database().ref("users/" + user.uid + "/privateList/" + uid).set({
                    title: titleField.value,
                    link: newURL,
                    where: whereField.value,
                    received: 0,
                    uid: newUid,
                    buyer: "",
                    description: descField.value,
                    creationDate: creationDate,
                    creator: privateUser.userName
                });
                sessionStorage.setItem("validGiftUser", JSON.stringify(user));
                navigation(4);
            }
        }
        invalidURLBool = false;
    }

    //This function verifies the validity of a url that was input by the user, and will return a proper url if found
    function verifyURLString(url){
        var urlBuilder = "";
        var tempURL = "";
        var failedURLs = [];
        var isChar = false;
        var preDot = false;
        var dotBool = false;
        var dotDuplicate = false;
        var postDot = false;
        var validURLBool = false;
        var validURLOverride = true;
        var invalidChar = false;
        var dotEnder = false;

        for(var i = 0; i < url.length; i++){
            if (url.charAt(i) == " ") {
                failedURLs.push(urlBuilder);
                urlBuilder = "";
            } else
                urlBuilder += url.charAt(i);
        }
        failedURLs.push(urlBuilder);

        for (var a = 0; a < failedURLs.length; a++) {
            for (var b = 0; b < failedURLs[a].length; b++) {
                if (isAlphNum(failedURLs[a].charAt(b))) {
                    isChar = true;
                    preDot = true;
                    dotDuplicate = false;
                    dotEnder = false;
                }
                if (isAlphNum(failedURLs[a].charAt(b)) && dotBool) {
                    postDot = true;
                    dotDuplicate = false;
                    dotEnder = false;
                }
                if (failedURLs[a].charAt(b) == ".") {
                    dotBool = true;
                    dotEnder = true;
                    if (!dotDuplicate)
                        dotDuplicate = true;
                    else
                        validURLOverride = false;
                }
                if (isInvalid(failedURLs[a].charAt(b))) {
                    validURLOverride = false;
                    invalidChar = true;
                }
                if (postDot)
                    validURLBool = true;
            }

            if (!dotEnder && validURLBool && validURLOverride) {
                tempURL = failedURLs[a];
            }

            preDot = false;
            dotBool = false;
            dotDuplicate = false;
            postDot = false;
            validURLBool = false;
            validURLOverride = true;
            dotEnder = false;
        }


        if (tempURL == "" && isChar)
            invalidURLBool = true;
        else if (invalidChar)
            invalidURLBool = true;
        else
            console.log("Valid URL! " + tempURL);

        return tempURL;
    }

    //This function will verify that a character is indeed alphanumeric
    function isAlphNum(rChar){
        rChar = rChar.toUpperCase();
        switch (rChar){
            case "A":
            case "B":
            case "C":
            case "D":
            case "E":
            case "F":
            case "G":
            case "H":
            case "I":
            case "J":
            case "K":
            case "L":
            case "M":
            case "N":
            case "O":
            case "P":
            case "Q":
            case "R":
            case "S":
            case "T":
            case "U":
            case "V":
            case "W":
            case "X":
            case "Y":
            case "Z":
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
            case "-":
            case "_":
            case "~":
                return true;
            default:
                return false;
        }
    }

    //This function checks a list of predetermined invalid characters in a url string
    function isInvalid(rChar){
        switch(rChar){
            case "!":
            case "@":
            case "#":
            case "$":
            case "^":
            case "*":
            case "(":
            case ")":
            case " ":
            case "+":
            case "\"":
            case "\'":
            case "{":
            case "}":
            case "[":
            case "]":
            case "\\":
            case "|":
            case ";":
            case ",":
            case "<":
            case ">":
                return true;
            default:
                return false;
        }
    }
};


//This function signs out the user and clears their data from memory
function signOut(){
  sessionStorage.clear();
  window.location.href = "index.html";
}


//This function assists the navigation tab in storing basic data before redirecting to another page
function navigation(nav){
    if (!privateListBool)
        sessionStorage.setItem("validUser", JSON.stringify(user));
    else
        sessionStorage.setItem("validUser", JSON.stringify(privateUser));
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
            window.location.href = "privateFriendList.html";
            break;
        default:
            break;
    }
}
