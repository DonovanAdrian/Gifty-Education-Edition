/*
Welcome to the privateFriendList page! This page welcomes an authenticated user to a specific friend's private gifts.
Unlike the friendList page, this page can be accessed if it is empty. Instead, anyone who is also a friend of the user
can add gifts to this list. The main catch is that the list owner CANNOT see any of the gifts that are placed on this
list. In doing so, it allows for the element of surprise in gift giving! Much like the friendList page, however, each
gift that is clicked on will show a modal with each respective gift's details like usual. Some new additions are the
ability to delete it (if you are the creator of the gift) and edit the gift (available to any friend of the user). As
always, there is a navigation tab at the top of the page in case the user changes their mind and wants to go to another
page instead or sign out.

In the usual fashion, the usual object declarations are below!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var giftArr = [];                       //An array that stores all the user's gifts that are fetched from the database
var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var userUserNames = [];                 //An array that is used for error checking gift list buyers
var instantiatedNodes = [];             //An array that stores all the initialized gift elements.

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read
var updateGiftToDBBool = false;         //If a gift has an error, then this bool will decide to update the database

var currentModalOpen = "";              //A string that keeps track of what modal is open in the case of a gift update

var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var giftCounter = 0;                    //An integer used to keep track of the number of gifts loaded on the page
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var giftCreationDate;                   //Stores the "Creation Date" field on a gift's detail window object
var giftList;                           //Stores the "Gift List" object on the webpage
var giftStorage;                        //Stores a gift object in memory to be sent to the "giftAddUpdate" page
var currentUser;                        //Stores the current authenticated user's data
var backBtn;                            //Stores the "Back To Lists" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var user;                               //Stores an authenticated friend's user data
var userInvites;                        //Tells the webpage where to look in the database for data
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var modal;                              //Stores the modal that is used for displaying gift details
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var listNote;                           //Stores the "Lists" object on the navigation tab on the webpage
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var notificationBtn;                    //Stores the "Notification" object on the webpage
var userBase;                           //Tells the webpage where to look in the database for data
var userGifts;                          //Tells the webpage where to look in the database for data


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
  try {
    moderationSet = sessionStorage.getItem("moderationSet");
    user = JSON.parse(sessionStorage.validGiftUser);
    currentUser = JSON.parse(sessionStorage.validUser);
    if(currentUser.uid == user.uid){
      console.log("HOW'D YOU GET HERE???");
      navigation(0);
    }
    console.log("User: " + currentUser.userName + " logged in");
    console.log("Friend: " + user.userName + " loaded in");
    if (user.privateList == undefined) {
      deployGiftListEmptyNotification();
    } else if (user.privateList.length == 0) {
      deployGiftListEmptyNotification();
    }
    if (currentUser.invites == undefined) {
      console.log("Invites Not Found");
    } else if (currentUser.invites != undefined) {
      if (currentUser.invites.length > 0) {
        inviteNote.style.background = "#ff3923";
      }
    }

    if (currentUser.readNotifications == undefined) {
      console.log("Read Notifications Not Found");
    } else {
      readNotificationsBool = true;
    }

    if (currentUser.notifications == undefined) {
      console.log("Notifications Not Found");
    } else if (currentUser.notifications != undefined) {
      if (readNotificationsBool){
        if (currentUser.notifications.length > 0 && currentUser.readNotifications.length != currentUser.notifications.length) {
          notificationBtn.src = "img/bellNotificationOn.png";
          notificationBtn.onclick = function() {
            sessionStorage.setItem("validUser", JSON.stringify(currentUser));
            sessionStorage.setItem("userArr", JSON.stringify(userArr));
            window.location.href = "notifications.html";
          }
        } else {
          notificationBtn.src = "img/bellNotificationOff.png";
          notificationBtn.onclick = function() {
            sessionStorage.setItem("validUser", JSON.stringify(currentUser));
            sessionStorage.setItem("userArr", JSON.stringify(userArr));
            window.location.href = "notifications.html";
          }
        }
      } else if (currentUser.notifications.length > 0) {
        notificationBtn.src = "img/bellNotificationOn.png";
        notificationBtn.onclick = function() {
          sessionStorage.setItem("validUser", JSON.stringify(currentUser));
          sessionStorage.setItem("userArr", JSON.stringify(userArr));
          window.location.href = "notifications.html";
        }
      }
    }
    userArr = JSON.parse(sessionStorage.userArr);
  } catch (err) {
    console.log(err.toString());
    window.location.href = "index.html";
  }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, the database is queried, the login
//timer is started, and activates a "toggle" feature on the "Lists" object on the navigation tab.
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
  listNote = document.getElementById('listNote');
  backBtn = document.getElementById('addGift');
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
    offlineModal.style.display = "none";
    currentModalOpen = "";
    console.log("Closed modal");
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
    currentModalOpen = "";
    console.log("Closed modal");
    if (event.target == offlineModal) {
      offlineModal.style.display = "none";
    }
  };

  backBtn.innerHTML = "Add Private Gift";
  backBtn.onclick = function() {
    giftStorage = "";
    sessionStorage.setItem("privateList", JSON.stringify(user));
    sessionStorage.setItem("validUser", JSON.stringify(user));
    sessionStorage.setItem("validPrivateUser", JSON.stringify(currentUser));
    sessionStorage.setItem("userArr", JSON.stringify(userArr));
    sessionStorage.setItem("giftStorage", JSON.stringify(giftStorage));
    window.location.href = "giftAddUpdate.html";
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

  privateFriendListButton();


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


    //This function reminds the user that they are on a private list by alternating the text and color on the "Lists"
    //object of the navigation pane.
  function privateFriendListButton(){
    var nowConfirm = 0;
    var alternator = 0;
    console.log("Friend List Button Feature Active");
    setInterval(function(){
      nowConfirm = nowConfirm + 1000;
      if(nowConfirm >= 3000){
        nowConfirm = 0;
        if(alternator == 0) {
          alternator++;
          document.getElementById("listNote").innerHTML = "Lists";
          document.getElementById("listNote").style.background = "#00c606";
        } else {
          alternator--;
          document.getElementById("listNote").innerHTML = "Private";
          document.getElementById("listNote").style.background = "#00ad05";
        }
      }
    }, 1000);
  }


    //This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
    //as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
    //locations are stored and checked on regularly.
  function databaseQuery() {

    userBase = firebase.database().ref("users/");
    userGifts = firebase.database().ref("users/" + user.uid + "/privateList/");
    userInvites = firebase.database().ref("users/" + currentUser.uid + "/invites");

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
          console.log("User Updated: 1");
        }
      });

      postRef.on('child_changed', function (data) {
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

        if(checkGiftBuyer(data.val().buyer)){
          data.val().buyer = "";
          updateGiftToDBBool = true;
        }

        createGiftElement(data.val().description, data.val().link, data.val().received, data.val().title,
          data.key, data.val().where, data.val().uid, data.val().creationDate, data.val().buyer,
          data.val().creator);
        instantiatedNodes.push(data.val());

        if(updateGiftToDBBool){
          updateGiftError(data, data.key);
          updateGiftToDBBool = false;
        }
      });

      postRef.on('child_changed', function(data) {
        //console.log("Changing " + data.val().uid);
        giftArr[data.key] = data.val();
        instantiatedNodes[data.key] = data.val();

        if(data.val().uid == currentModalOpen){
          currentModalOpen = "";
          console.log("Closed modal");
          modal.style.display = "none";
        }

        changeGiftElement(data.val().description, data.val().link, data.val().received, data.val().title,
          data.key, data.val().where, data.val().uid, data.val().creationDate, data.val().buyer,
          data.val().creator);
      });

      postRef.on('child_removed', function(data) {
        sessionStorage.setItem("validGiftUser", JSON.stringify(user));
        sessionStorage.setItem("validUser", JSON.stringify(currentUser));
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


    //This function assists the error checking by checking to see if the buyer's user name exists.
  function checkGiftBuyer(buyer){
    var updateGiftToDB = true;

    //console.log("Checking for buyer error...");

    if(buyer == "" || buyer == null || buyer == undefined || userUserNames.includes(buyer)){
      updateGiftToDB = false;
      //console.log("No buyer error");
    } else {
      console.log("Buyer error found!");
    }

    return updateGiftToDB;
  }


    //This function updates a gift if it was found to have an out-of-date buyer.
  function updateGiftError(giftData, giftKey){
    alert("A gift needs to be updated! Key: " + giftKey);
    firebase.database().ref("users/" + user.uid + "/privateList/" + giftKey).update({
      buyer: ""
    });
  }


    //This function creates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
    //with the proper gift's details and buttons.
  function createGiftElement(giftDescription, giftLink, giftReceived, giftTitle, giftKey, giftWhere, giftUid, giftDate,
                             giftBuyer, giftCreator){
    try{
      document.getElementById("TestGift").remove();
    } catch (err) {}

    var liItem = document.createElement("LI");
    liItem.id = "gift" + giftUid;
    liItem.className = "gift";
    if(giftReceived == 1) {
      liItem.className += " checked";
      //console.log("Checked, created");
    }
    liItem.onclick = function (){
      var spanGift = document.getElementsByClassName("close")[0];
      var editBtn = document.getElementById('giftEdit');
      var deleteBtn = document.getElementById('giftDelete');
      var titleField = document.getElementById('giftTitle');
      var descField = document.getElementById('giftDescription');
      var creatorField = document.getElementById('giftCreator');
      var whereField = document.getElementById('giftWhere');
      var linkField = document.getElementById('giftLink');
      var boughtField = document.getElementById('giftBought');
      var buyField = document.getElementById('giftBuy');
      var dontBuyField = document.getElementById('giftDontBuy');

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
      if(giftReceived == 1){
        if(giftBuyer == null || giftBuyer == undefined){
          boughtField.innerHTML = "This gift has been bought";
        } else {
          if (giftBuyer == "")
            boughtField.innerHTML = "This gift has been bought";
          else
            boughtField.innerHTML = "This gift was bought by " + giftBuyer;
        }
      } else {
        boughtField.innerHTML = "This gift has not been bought yet";
      }
      if(giftDescription != "") {
        descField.innerHTML = "Description: " + giftDescription;
      } else {
        descField.innerHTML = "There was no description provided";
      }
      if(giftCreator == null || giftCreator == undefined){
        creatorField.innerHTML = "Gift creator unavailable";
      } else {
        if (giftCreator == "")
          creatorField.innerHTML = "Gift creator unavailable";
        else
          creatorField.innerHTML = "Gift was created by " + giftCreator;
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
      editBtn.onclick = function(){
        updateGiftElement(giftUid);
      };
      deleteBtn.onclick = function(){
        if (giftCreator == currentUser.userName || giftCreator == null || giftCreator == undefined) {
          deleteGiftElement(giftKey, giftTitle, giftBuyer);
        } else {
          if (giftCreator == ""){
            deleteGiftElement(giftKey, giftTitle, giftBuyer);
          } else {
            alert("Only the creator, " + giftCreator + ", can delete this gift. Please contact them to delete this gift " +
              "if it needs to be removed.");
          }
        }
      };
      buyField.innerHTML = "Click on me to buy the gift!";
      buyField.onclick = function(){
        if (giftReceived == 0) {
          firebase.database().ref("users/" + user.uid + "/privateList/" + giftKey).update({
            received: 1,
            buyer: currentUser.userName
          });
        } else {
          alert("This gift has already been marked as bought!");
        }
      };
      dontBuyField.innerHTML = "Click on me to un-buy the gift!";
      dontBuyField.onclick = function(){
        if (giftReceived == 1) {
          if (giftBuyer == currentUser.userName || giftBuyer == null || giftBuyer == undefined) {
            firebase.database().ref("users/" + user.uid + "/privateList/" + giftKey).update({
              received: 0,
              buyer: ""
            });
          } else {
            if (giftBuyer == "") {
              firebase.database().ref("users/" + user.uid + "/privateList/" + giftKey).update({
                received: 0,
                buyer: ""
              });
            } else {
              alert("Only the buyer, " + giftBuyer + ", can \"Un-Buy\" this gift. Please contact them to undo this action " +
                "if this has been done in error.");
            }
          }
        } else {
          alert("This gift has already been marked as \"Un-Bought\"!");
        }
      };

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
      };
    };
    var textNode = document.createTextNode(giftTitle);
    liItem.appendChild(textNode);

    giftList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
    clearInterval(offlineTimer);

    giftCounter++;
  }


    //This function updates each gift's element in the page. Upon clicking on a gift's element, a modal will appear
    //with the proper gift's details and buttons.
  function changeGiftElement(description, link, received, title, key, where, uid, date, buyer, creator) {
    var editGift = document.getElementById("gift" + uid);
    editGift.innerHTML = title;
    editGift.className = "gift";
    if (received == 1) {
      editGift.className += " checked";
      //console.log("Checked, changed");
    }
    editGift.onclick = function () {
      var spanGift = document.getElementsByClassName("close")[0];
      var editBtn = document.getElementById('giftEdit');
      var deleteBtn = document.getElementById('giftDelete');
      var titleField = document.getElementById('giftTitle');
      var descField = document.getElementById('giftDescription');
      var creatorField = document.getElementById('giftCreator');
      var whereField = document.getElementById('giftWhere');
      var linkField = document.getElementById('giftLink');
      var boughtField = document.getElementById('giftBought');
      var buyField = document.getElementById('giftBuy');
      var dontBuyField = document.getElementById('giftDontBuy');

      if (link != "") {
        linkField.innerHTML = "Click me to go to the webpage!";
        linkField.onclick = function () {
          var newGiftLink = "http://";
          if (link.includes("https://")) {
            link = link.slice(8, link.length);
          } else if (link.includes("http://")) {
            link = link.slice(7, link.length);
          }
          newGiftLink += link;
          window.open(newGiftLink, "_blank");
        };
      } else {
        linkField.innerHTML = "There was no link provided";
        linkField.onclick = function () {
        };
      }
      if (received == 1) {
        if (buyer == null || buyer == undefined) {
          boughtField.innerHTML = "This gift has been bought";
        } else {
          if (buyer == "")
            boughtField.innerHTML = "This gift has been bought";
          else
            boughtField.innerHTML = "This gift was bought by " + buyer;
        }
      } else {
        boughtField.innerHTML = "This gift has not been bought yet";
      }
      if (description != "") {
        descField.innerHTML = "Description: " + description;
      } else {
        descField.innerHTML = "There was no description provided";
      }
      if (creator == null || creator == undefined) {
        creatorField.innerHTML = "Gift creator unavailable";
      } else {
        if (creator == "")
          creatorField.innerHTML = "Gift creator unavailable";
        else
          creatorField.innerHTML = "Gift was created by " + creator;
      }
      titleField.innerHTML = title;
      if (where != "") {
        whereField.innerHTML = "This can be found at: " + where;
      } else {
        whereField.innerHTML = "There was no location provided";
      }
      if (date != undefined) {
        if (date != "") {
          giftCreationDate.innerHTML = "Created on: " + date;
        } else {
          giftCreationDate.innerHTML = "Creation date not available";
        }
      } else {
        giftCreationDate.innerHTML = "Creation date not available";
      }
      editBtn.onclick = function () {
        updateGiftElement(uid);
      };
      deleteBtn.onclick = function () {
        if (creator == currentUser.userName || creator == null || creator == undefined) {
          deleteGiftElement(key, title, buyer);
        } else {
          if (creator == ""){
            deleteGiftElement(key, title, buyer);
          } else {
            alert("Only the creator, " + creator + ", can delete this gift. Please contact them to delete this gift " +
              "if it needs to be removed.");
          }
        }
      };
      buyField.innerHTML = "Click on me to buy the gift!";
      buyField.onclick = function () {
        if (received == 0) {
          firebase.database().ref("users/" + user.uid + "/privateList/" + key).update({
            received: 1,
            buyer: currentUser.userName
          });
        } else {
          alert("This gift has already been marked as bought!");
        }
      };
      dontBuyField.innerHTML = "Click on me to un-buy the gift!";
      dontBuyField.onclick = function () {
        if (received == 1) {
          if (buyer == currentUser.userName || buyer == null || buyer == undefined) {
            firebase.database().ref("users/" + user.uid + "/privateList/" + key).update({
              received: 0,
              buyer: ""
            });
          } else {
            if (buyer == "") {
              firebase.database().ref("users/" + user.uid + "/privateList/" + key).update({
                received: 0,
                buyer: ""
              });
            } else {
              alert("Only the buyer, " + buyer + ", can \"Un-Buy\" this gift. Please contact them to undo this action " +
                "if this has been done in error.");
            }
          }
        } else {
          alert("This gift has already been marked as \"Un-Bought\"!");
        }
      };

      //show modal
      modal.style.display = "block";
      currentModalOpen = uid;
      console.log("Modal Open: " + currentModalOpen);

      //close on close
      spanGift.onclick = function () {
        currentModalOpen = "";
        console.log("Closed modal");
        modal.style.display = "none";
      };

      //close on click
      window.onclick = function (event) {
        if (event.target == modal) {
          currentModalOpen = "";
          console.log("Closed modal");
          modal.style.display = "none";
        }
      };
    };
  }

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
    sessionStorage.setItem("privateList", JSON.stringify(user));
    sessionStorage.setItem("validUser", JSON.stringify(user));
    sessionStorage.setItem("validPrivateUser", JSON.stringify(currentUser));
    sessionStorage.setItem("userArr", JSON.stringify(userArr));
    sessionStorage.setItem("giftStorage", JSON.stringify(giftStorage));
    window.location.href = "giftAddUpdate.html";
  }


    //This deletes a specific gift from the user's data in the database and adds a notification if it had a buyer
  function deleteGiftElement(key, title, buyer) {
    var verifyDeleteBool = true;
    var toDelete = -1;

    for (var i = 0; i < giftArr.length; i++){
      if(title == giftArr[i].title) {
        toDelete = i;
        break;
      }
    }

    if(toDelete != -1) {
      alert("Attempting to delete " + giftArr[toDelete].title + "! If this is successful, the page will reload.");
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
      firebase.database().ref("users/" + user.uid).update({
        privateList: giftArr
      });

      if(buyer != ""){
        var userFound = findUserNameItemInArr(buyer, userArr);
        if(userFound != -1){
          if(userArr[userFound].uid != currentUser.uid) {
            addNotificationToDB(userArr[userFound], currentUser.name, title);
          }
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
  function addNotificationToDB(buyerUserData, giftDeleter, giftTitle){
    var pageName = "deleteGiftPrivate";
    var giftOwner = user.uid;
    var notificationString = generateNotificationString(giftOwner, giftDeleter, giftTitle, pageName);
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
  function generateNotificationString(giftOwner, giftDeleter, giftTitle, pageName){
    console.log("Generating Notification");
    return (giftOwner + "," + giftDeleter + "," + giftTitle + "," + pageName);
  }
};


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
  sessionStorage.setItem("validUser", JSON.stringify(currentUser));
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
