/*
Welcome to the boughtGifts page! This page takes the boughtGiftsArr that is collected on the home page and lists them
here. These gifts and their details are also changed accordingly if these gifts are updated. As always, there is also a
navigation tab at the top of the window that shows the user their options for which page they would like to navigate to
or sign out.

Aaaaand here are the usual object declarations!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var userUserNames = [];                 //An array that stores user names attached to each gift
var userBoughtGiftsArr = [];            //An array that stores bought gifts
var userBoughtGiftsUsersArr = [];       //An array that stores the users attached to each gift
var initializedGiftsArr = [];           //An array that stores the gifts that have been loaded on the page

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read

var currentModalOpen = "";              //This string keeps track of the current modal open

var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var giftCounter = 0;                    //An integer used to keep track of the number of gifts loaded on the page
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long
var moderationSet = -1;                 //An integer used to tell if a moderator is viewing a user's gifts

var giftCreationDate;                   //Stores the text field for the creation date of each individual gift
var giftList;                           //Stores the "Gift List" object on the webpage
var backBtn;                            //Stores the "Back" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var user;                               //Stores an authenticated user's data
var modal;                              //Stores the modal that is used for displaying gift details
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var notificationBtn;                    //Stores the "Notification" object on the webpage
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var userInitial;                        //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data


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

        if (user.readNotifications == undefined) {
            console.log("Read Notifications Not Found");
        } else {
            readNotificationsBool = true;
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
        userBoughtGiftsArr = JSON.parse(sessionStorage.boughtGifts);
        userBoughtGiftsUsersArr = JSON.parse(sessionStorage.boughtGiftsUsers);
    } catch (err) {
        console.log(err.toString());
        window.location.href = "index.html";
    }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, gifts are initialized, the database is
//queried, the login timer is started, and the "toggle" feature is activated on the home button.
window.onload = function instantiate() {

  notificationBtn = document.getElementById('notificationButton');
  giftCreationDate = document.getElementById('giftCreationDate');
  giftList = document.getElementById('giftListContainer');
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById('closeOffline');
  noteSpan = document.getElementById('closeNotification');
  backBtn = document.getElementById('backBtn');
  inviteNote = document.getElementById('inviteNote');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
  modal = document.getElementById('giftModal');
  getCurrentUser();

  for(var i = 0; i < userArr.length; i++){
    userUserNames.push(userArr[i].userName);
  }

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
    currentModalOpen = "";
    console.log("Closed modal");
    offlineModal.style.display = "none";
    location.reload();
  });

  window.addEventListener("offline", function() {
    var now = 0;
    offlineTimer = setInterval(function(){
      now = now + 1000;
      if(now >= 5000){
        try{
          document.getElementById("TestGift").innerHTML = "Loading Failed, Please Connect To Internet";
        } catch(err){
          if(giftCounter == 0) {
            console.log("Loading Element Missing, Creating A New One");
            var liItem = document.createElement("LI");
            liItem.id = "TestGift";
            liItem.className = "gift";
            var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
            liItem.appendChild(textNode);
            giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
          }
        }
        offlineModal.style.display = "block";
        currentModalOpen = "offlineModal";
        console.log("Modal Open: " + currentModalOpen);
        clearInterval(offlineTimer);
      }
    }, 1000);
  });

  //close offlineModal on close
  offlineSpan.onclick = function() {
    currentModalOpen = "";
    console.log("Closed modal");
    offlineModal.style.display = "none";
  };

  //close offlineModal on click
  window.onclick = function(event) {
    if (event.target == offlineModal) {
      currentModalOpen = "";
      console.log("Closed modal");
      offlineModal.style.display = "none";
    }
  };

  //initialize back button
  backBtn.innerHTML = "Back To Home";
  backBtn.onclick = function() {
      navigation(0);
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

  initializeGifts();

  databaseQuery();

  loginTimer();

  homeButton();


  //This function initializes and loads the gifts that were collected on the home page.
  function initializeGifts(){
    //console.log(userBoughtGiftsArr);
    //console.log(userBoughtGiftsUsersArr);

    if(userBoughtGiftsArr.length == userBoughtGiftsUsersArr.length) {
      for (var i = 0; i < userBoughtGiftsArr.length; i++) {
        createGiftElement(userBoughtGiftsArr[i], userBoughtGiftsUsersArr[i]);
      }
    } else {
      alert("There has been a critical error, redirecting back home...");
      navigation(0);
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
    } catch (err) {
        //console.log("Basic Modal Not Open");
    }
    noteInfoField.innerHTML = "You have been inactive for 5 minutes, you will be logged out in " + timeMins
      + ":" + timeSecs + "!";
    noteTitleField.innerHTML = "Are You Still There?";
    noteModal.style.display = "block";
    currentModalOpen = "noteModal";
    console.log("Modal Open: " + currentModalOpen);

    //close on close
    noteSpan.onclick = function() {
      currentModalOpen = "";
      console.log("Closed modal");
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
        currentModalOpen = "";
        console.log("Closed modal");
        noteModal.style.display = "none";
        areYouStillThereBool = false;
        clearInterval(j);
      }
    }, 1000);

    //close on click
    window.onclick = function(event) {
      if (event.target == noteModal) {
        currentModalOpen = "";
        console.log("Closed modal");
        noteModal.style.display = "none";
        areYouStillThereBool = false;
      }
    };
  }


  //This function activates a "toggle" on the home button to notify the user that they are on the boughtGifts page.
  function homeButton(){
    var nowConfirm = 0;
    var alternator = 0;
    console.log("Home Button Feature Active");
    setInterval(function(){
      nowConfirm = nowConfirm + 1000;
      if(nowConfirm >= 3000){
        nowConfirm = 0;
        if(alternator == 0) {
          alternator++;
          document.getElementById("homeNote").innerHTML = "Home";
          document.getElementById("homeNote").style.background = "#00c606";
        } else {
          alternator--;
          document.getElementById("homeNote").innerHTML = "Bought";
          document.getElementById("homeNote").style.background = "#00ad05";
        }
      }
    }, 1000);
  }


    //This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
    //as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
    //locations are stored and checked on regularly.
  function databaseQuery() {

    userInitial = firebase.database().ref("users/");
    userInvites = firebase.database().ref("users/" + user.uid + "/invites");

    var fetchData = function (postRef) {
      postRef.on('child_added', function (data) {
        onlineInt = 1;

        var i = findUIDItemInArr(data.key, userArr);
        if(userArr[i] != data.val() && i != -1){
          checkGiftLists(data.val());

          //console.log("Adding " + userArr[i].userName + " to most updated version: " + data.val().userName);
          userArr[i] = data.val();
        }

        if(data.key == user.uid){
          user = data.val();
          console.log("User Updated: 1");
        }
      });

      postRef.on('child_changed', function (data) {
        var i = findUIDItemInArr(data.key, userArr);
        if(userArr[i] != data.val() && i != -1){
          checkGiftLists(data.val());

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


  //This function compares new gift lists and new private gift lists to the old gift lists and old private gift lists.
  function checkGiftLists(updatedUserData){
    var newGiftList = updatedUserData.giftList;
    var newPrivateGiftList = updatedUserData.privateList;

    if(newGiftList == undefined){}
    else if(newGiftList != undefined) {
      for (var i = 0; i < userBoughtGiftsArr.length; i++) {
        var a = findUIDItemInArr(userBoughtGiftsArr[i].uid, newGiftList);
        if (a != -1) {
          //console.log(newGiftList[a]);
          checkGiftData(userBoughtGiftsArr[i], newGiftList[a], updatedUserData.name);
        }
      }
    }

    if(newPrivateGiftList == undefined){}
    else if(newPrivateGiftList.length != undefined) {
      for (var i = 0; i < userBoughtGiftsArr.length; i++) {
        var a = findUIDItemInArr(userBoughtGiftsArr[i], newPrivateGiftList);
        if (a != -1) {
          //console.log(newPrivateGiftList[a]);
          checkGiftData(userBoughtGiftsArr[i], newPrivateGiftList[a], updatedUserData.name);
        }
      }
    }
  }


  //This function compares old gift data with new gift data, as well as keeping track of the gift's owner.
  function checkGiftData(currentGiftData, newGiftData, giftOwner){
    var updateGiftBool = false;
    if(currentGiftData.description != newGiftData.description) {
      console.log("Description Updated: " + currentGiftData.description + " " + newGiftData.description);
      updateGiftBool = true;
    }
    if(currentGiftData.link != newGiftData.link) {
      //console.log("Link Updated");
      updateGiftBool = true;
    }
    if(currentGiftData.title != newGiftData.title) {
      //console.log("Title Updated");
      updateGiftBool = true;
    }
    if(currentGiftData.where != newGiftData.where) {
      //console.log("Where Updated");
      updateGiftBool = true;
    }

    if(updateGiftBool) {
      if (newGiftData.uid == currentModalOpen){
        currentModalOpen = "";
        console.log("Closed modal");
        modal.style.display = "none";
      }
      changeGiftElement(newGiftData, giftOwner);
    }
  }


    //This function is called from the databaseQuery() function and helps find the index of a user's data to properly
    //update or remove it from the userArr array.
  function findUIDItemInArr(item, itemArray){
    for(var i = 0; i < itemArray.length; i++){
      if(itemArray[i].uid == item){
        //console.log("Found item: " + item);
        return i;
      }
    }
    return -1;
  }


    //This function creates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
    //with the proper gift's details.
  function createGiftElement(giftData, giftOwner){
    var giftDescription = giftData.description;
    var giftLink = giftData.link;
    var giftTitle = giftData.title + " - for " + giftOwner;
    var giftWhere = giftData.where;
    var giftUid = giftData.uid;
    var giftDate = giftData.creationDate;

    //console.log("Creating " + giftUid);
    try{
      document.getElementById("TestGift").remove();
    } catch (err) {}

    var liItem = document.createElement("LI");
    liItem.id = "gift" + giftUid;
    liItem.className = "gift";
    liItem.onclick = function (){
      var spanGift = document.getElementsByClassName("close")[0];
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

      //show modal
      modal.style.display = "block";
      currentModalOpen = giftUid;
      console.log("Modal Open: " + currentModalOpen);

      //close on close
      spanGift.onclick = function() {
        currentModalOpen = "";
        console.log("Closed modal");
        modal.style.display = "none";
      };

      //close on click
      window.onclick = function(event) {
        if (event.target == modal) {
          currentModalOpen = "";
          console.log("Closed modal");
          modal.style.display = "none";
        }
      }
    };
    var textNode = document.createTextNode(giftTitle);
    liItem.appendChild(textNode);

    giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
    initializedGiftsArr.push(giftUid);
    clearInterval(offlineTimer);
  }


    //This function updates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
    //with the proper gift's details.
  function changeGiftElement(giftData, giftOwner){
    var description = giftData.description;
    var link = giftData.link;
    var title = giftData.title + " - for " + giftOwner;
    var where = giftData.where;
    var uid = giftData.uid;
    var date = giftData.creationDate;

    console.log("Updating " + uid);
    var editGift = document.getElementById("gift" + uid);
    editGift.innerHTML = title;
    editGift.className = "gift";
    editGift.onclick = function (){
      var spanGift = document.getElementsByClassName("close")[0];
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

      //show modal
      modal.style.display = "block";
      currentModalOpen = uid;
      console.log("Modal Open: " + currentModalOpen);

      //close on close
      spanGift.onclick = function() {
        currentModalOpen = "";
        console.log("Closed modal");
        modal.style.display = "none";
      };

      //close on click
      window.onclick = function(event) {
        if (event.target == modal) {
          currentModalOpen = "";
          console.log("Closed modal");
          modal.style.display = "none";
        }
      };
    };
  }
};


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
    default:
      break;
  }
}
