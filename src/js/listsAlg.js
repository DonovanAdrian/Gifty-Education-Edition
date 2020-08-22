/*
Welcome to the lists page! This page (just like the invites page) welcomes an authenticated user to their wealth
(or lack thereof) of friends that are on their friend list. If you click on a friend, you will be told how many gifts
are on each list (public or private) and you can click on a text field to access each respective list. Like most of
the other pages, there is a navigation tab at the top of the page in case the user changes their mind and wants to go
to another page instead or sign out.

Below are the usual object and data declarations!
 */

var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var friendArr = [];                     //An array that stores the user's friends that are fetched from the database
var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var userArr = [];                       //An array that stores all the user data that is fetched from the database

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read

var moderationSet = 0;                  //A boolean used to tell whether a moderator is viewing the friend list
var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var friendCount = 0;                    //An integer used to keep track of the number of friends loaded on the page
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var userList;                           //Stores the "User List" object on the webpage
var userBase;                           //Tells the webpage where to look in the database for data
var userFriends;                        //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var user;                               //Stores an authenticated user's data
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var notificationBtn;                    //Stores the "Notification" object on the webpage
var addGlobalMsgModal;                  //Stores the "Private Message" modal for sending users messages
var modalSpan;                          //Stores the "X" object on the user detail window
var modal;                              //Stores the modal that is used for displaying user details


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
  try {
    user = JSON.parse(sessionStorage.validUser);
    console.log("User: " + user.userName + " logged in");
    if (user.friends == undefined) {
      deployFriendListEmptyNotification();
    } else if (user.friends.length == 0) {
      deployFriendListEmptyNotification();
    }
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

    if (user.notifications == undefined) {
      console.log("Notifications Not Found");
    } else if (user.notifications != undefined) {
      if (readNotificationsBool){
        if (user.notifications.length > 0 && user.readNotifications.length != user.notifications.length) {
          notificationBtn.src = "img/bellNotificationOn.png";
          notificationBtn.onclick = function() {
            sessionStorage.setItem("validUser", JSON.stringify(user));
            sessionStorage.setItem("userArr", JSON.stringify(userArr));
            window.location.href = "notifications.html";
          }
        } else {
          notificationBtn.src = "img/bellNotificationOff.png";
          notificationBtn.onclick = function() {
            sessionStorage.setItem("validUser", JSON.stringify(user));
            sessionStorage.setItem("userArr", JSON.stringify(userArr));
            window.location.href = "notifications.html";
          }
        }
      } else if (user.notifications.length > 0) {
        notificationBtn.src = "img/bellNotificationOn.png";
        notificationBtn.onclick = function() {
          sessionStorage.setItem("validUser", JSON.stringify(user));
          sessionStorage.setItem("userArr", JSON.stringify(userArr));
          window.location.href = "notifications.html";
        }
      }
    }
    userArr = JSON.parse(sessionStorage.userArr);
    sessionStorage.setItem("moderationSet", moderationSet);
  } catch (err) {
    console.log(err.toString());
    window.location.href = "index.html";
  }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, the database is queried, and the login
//timer is started.
window.onload = function instantiate() {

  notificationBtn = document.getElementById('notificationButton');
  userList = document.getElementById("userListContainer");
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById("closeOffline");
  inviteNote = document.getElementById('inviteNote');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
  addGlobalMsgModal = document.getElementById('userModal');
  modalSpan = document.getElementById('closeModal');
  modal = document.getElementById('myModal');
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
            document.getElementById("TestGift").innerHTML = "No Friends Found! Invite Some Friends In The \"Invite\" Tab!";
          }
        } catch(err) {
          if(friendCount == 0) {
            console.log("Loading Element Missing, Creating A New One");
            var liItem = document.createElement("LI");
            liItem.id = "TestGift";
            liItem.className = "gift";
            if (onlineInt == 0) {
              var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
            } else {
              var textNode = document.createTextNode("No Friends Found! Invite Some Friends In The \"Invite\" Tab!");
            }
            liItem.appendChild(textNode);
            userList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
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
    userFriends = firebase.database().ref("users/" + user.uid + "/friends");
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
          console.log("User Updated: 1");
        }
      });

      postRef.on('child_changed', function (data) {
        var i = findUIDItemInArr(data.key, userArr);
        if(userArr[i] != data.val() && i != -1){
          console.log("Updating " + userArr[i].userName + " to most updated version: " + data.val().userName);
          userArr[i] = data.val();

          if(friendArr.includes(data.key)){
            changeFriendElement(friendArr[friendArr.indexOf(data.key)]);
          }
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

    var fetchFriends = function (postRef) {
      postRef.on('child_added', function (data) {
        friendArr.push(data.val());

        createFriendElement(data.val());
      });

      postRef.on('child_changed', function (data) {
        console.log(friendArr);
        friendArr[data.key] = data.val();
        console.log(friendArr);

        changeFriendElement(data.val());
      });

      postRef.on('child_removed', function (data) {
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
    fetchFriends(userFriends);
    fetchInvites(userInvites);

    listeningFirebaseRefs.push(userBase);
    listeningFirebaseRefs.push(userFriends);
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


  //This function creates each friend element that appears on the page. Once a friend's element is clicked, their
  //respective list's details will appear, as well as a couple helpful buttons/interactive text fields.
  function createFriendElement(friendKey) {
    var friendData;
    for (var i = 0; i < userArr.length; i++) {
      if (friendKey == userArr[i].uid) {
        friendData = userArr[i];
        break;
      }
    }

    if(friendData != null){
      try {
        document.getElementById("TestGift").remove();
      } catch (err) {}

      var userUid = friendData.uid;
      var friendName = friendData.name;
      var liItem = document.createElement("LI");
      liItem.id = "user" + userUid;
      liItem.className = "gift";
      liItem.onclick = function () {
        var userTitle = document.getElementById('userTitle');
        var publicListCount = document.getElementById('publicListCount');
        var publicList = document.getElementById('publicList');
        var privateListCount = document.getElementById('privateListCount');
        var privateListHTML = document.getElementById('privateList');
        var friendSendMessage = document.getElementById('sendPrivateMessage');
        userTitle.innerHTML = friendData.name;
        if(friendData.giftList != undefined){
          if(friendData.giftList.length > 0) {
            publicList.innerHTML = "Click on me to access " + friendData.name + "\'s public list!";
            publicList.onclick = function () {
              sessionStorage.setItem("userArr", JSON.stringify(userArr));
              sessionStorage.setItem("validGiftUser", JSON.stringify(friendData));//Friend's User Data
              sessionStorage.setItem("validUser", JSON.stringify(user));
              window.location.href = "friendList.html";
            };
            if (friendData.giftList.length == 1)
              publicListCount.innerHTML = friendData.name + " has 1 gift on their public list";
            else
              publicListCount.innerHTML = friendData.name + " has " + friendData.giftList.length + " gifts on their public list";
          } else {
            publicList.innerHTML = friendData.name + "\'s public gift list is empty, please check back later!";
            publicList.onclick = function () {};
            publicListCount.innerHTML = friendData.name + " has 0 gifts on their public list";
          }
        } else {
          publicList.innerHTML = friendData.name + "\'s public gift list is empty, please check back later!";
          publicList.onclick = function () {};
          publicListCount.innerHTML = friendData.name + " has 0 gifts on their public list";
        }
        if(friendData.privateList != undefined){
          if(friendData.privateList.length > 0) {
            if (friendData.privateList.length == 1)
              privateListCount.innerHTML = friendData.name + " has 1 gift on their private list";
            else
              privateListCount.innerHTML = friendData.name + " has " + friendData.privateList.length + " gifts on their private list";
          } else {
            privateListCount.innerHTML = friendData.name + " has 0 gifts on their private list";
          }
        } else {
          privateListCount.innerHTML = friendData.name + " has 0 gifts on their private list";
        }
        privateListHTML.innerHTML = "Click on me to access " + friendData.name + "\'s private gift list!";
        privateListHTML.onclick = function() {
          sessionStorage.setItem("userArr", JSON.stringify(userArr));
          sessionStorage.setItem("validGiftUser", JSON.stringify(friendData));//Friend's User Data
          sessionStorage.setItem("validUser", JSON.stringify(user));
          window.location.href = "privateFriendList.html";
        };

        friendSendMessage.onclick = function() {
          generatePrivateMessageDialog(friendData);
        };

        //show modal
        modal.style.display = "block";

        //close on close
        modalSpan.onclick = function() {
          modal.style.display = "none";
        };

        //close on click
        window.onclick = function(event) {
          if (event.target == modal) {
            modal.style.display = "none";
          }
        };
      };
      var textNode = document.createTextNode(friendName);
      liItem.appendChild(textNode);
      userList.insertBefore(liItem, document.getElementById("userListContainer").childNodes[0]);
      clearInterval(offlineTimer);

      friendCount++;
    }
  }


    //This function updates each friend element that appears on the page. Once a friend's element is clicked, their
    //respective list's details will appear, as well as a couple helpful buttons/interactive text fields.
  function changeFriendElement(friendKey){
    var friendData;
    for (var i = 0; i < userArr.length; i++){
      if(friendKey == userArr[i].uid){
        friendData = userArr[i];
        break;
      }
    }

    if (friendData != null) {
      var friendName = friendData.name;
      var editItem = document.createElement("LI");
      editItem.innerHTML = friendName;
      editItem.className = "gift";
      editItem.onclick = function () {
        var userTitle = document.getElementById('userTitle');
        var publicListCount = document.getElementById('publicListCount');
        var publicList = document.getElementById('publicList');
        var privateListCount = document.getElementById('privateListCount');
        var privateListHTML = document.getElementById('privateList');
        var friendSendMessage = document.getElementById('sendPrivateMessage');
        userTitle.innerHTML = friendData.name;
        if(friendData.giftList != undefined){
          if(friendData.giftList.length > 0) {
            publicList.innerHTML = "Click on me to access " + friendData.name + "\'s public list!";
            publicList.onclick = function () {
              sessionStorage.setItem("userArr", JSON.stringify(userArr));
              sessionStorage.setItem("validGiftUser", JSON.stringify(friendData));//Friend's User Data
              sessionStorage.setItem("validUser", JSON.stringify(user));
              window.location.href = "friendList.html";
            };
            if (friendData.giftList.length == 1)
              publicListCount.innerHTML = friendData.name + " has 1 gift on their public list";
            else
              publicListCount.innerHTML = friendData.name + " has " + friendData.giftList.length + " gifts on their public list";
          } else {
            publicList.innerHTML = friendData.name + "\'s public gift list is empty, please check back later!";
            publicList.onclick = function () {};
            publicListCount.innerHTML = friendData.name + " has 0 gifts on their public list";
          }
        } else {
          publicList.innerHTML = friendData.name + "\'s public gift list is empty, please check back later!";
          publicList.onclick = function () {};
          publicListCount.innerHTML = friendData.name + " has 0 gifts on their public list";
        }
        if(friendData.privateList != undefined){
          if(friendData.privateList.length > 0) {
            if (friendData.privateList.length == 1)
              privateListCount.innerHTML = friendData.name + " has 1 gift on their private list";
            else
              privateListCount.innerHTML = friendData.name + " has " + friendData.privateList.length + " gifts on their private list";
          } else {
            privateListCount.innerHTML = friendData.name + " has 0 gifts on their private list";
          }
        } else {
          privateListCount.innerHTML = friendData.name + " has 0 gifts on their private list";
        }
        privateListHTML.innerHTML = "Click on me to access " + friendData.name + "\'s private gift list!";
        privateListHTML.onclick = function() {
          sessionStorage.setItem("userArr", JSON.stringify(userArr));
          sessionStorage.setItem("validGiftUser", JSON.stringify(friendData));//Friend's User Data
          sessionStorage.setItem("validUser", JSON.stringify(user));
          window.location.href = "privateFriendList.html";
        };

        friendSendMessage.onclick = function() {
          generatePrivateMessageDialog(friendData);
        };

        //show modal
        modal.style.display = "block";

        //close on close
        modalSpan.onclick = function() {
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
  }


  //This function will open the private message modal with an input field and Send/Cancel buttons. After the user types
  //in the message and clicks "Send", the message will be added to the appropriate user's notifications in the database.
  function generatePrivateMessageDialog(userData) {
    var sendNote = document.getElementById('sendNote');
    var cancelNote = document.getElementById('cancelNote');
    var privateNoteInp = document.getElementById('privateNoteInp');
    var spanNote = document.getElementById('privateNoteSpan');
    var globalNoteTitle = document.getElementById('privateNoteTitle');
    var message = "";

    globalNoteTitle.innerHTML = "Send A Private Message Below";
    privateNoteInp.placeholder = "Hey! Just to let you know...";

    sendNote.onclick = function (){
      message = generatePrivateMessage(user.uid, privateNoteInp.value);
      addPrivateMessageToDB(userData, message);
      privateNoteInp.value = "";
      addGlobalMsgModal.style.display = "none";
    };
    cancelNote.onclick = function (){
      privateNoteInp.value = "";
      addGlobalMsgModal.style.display = "none";
    };

    addGlobalMsgModal.style.display = "block";

    //close on close
    spanNote.onclick = function() {
      addGlobalMsgModal.style.display = "none";
    };

    //close on click
    window.onclick = function(event) {
      if (event.target == addGlobalMsgModal) {
        addGlobalMsgModal.style.display = "none";
      }
    };
  }


  //This function generates the necessary private message string in order to be identified as a private message on the
  //notifications page.
  function generatePrivateMessage(userUID, message){
    return userUID + "@#$:" + message;
  }


  //This function adds the private message to the database.
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


  //After updating how data is handled with friend lists, this function was deprecated and is no longer used. After some
  //deliberation, the function will not be removed as long as it is still deemed useful at some point in the future.
  function removeFriendElement(uid){
    document.getElementById("user" + uid).remove();

    friendCount--;
    if(friendCount == 0) {
      deployFriendListEmptyNotification();
    }
  }
};


//This function deploys a notification that the user's friend list is empty
function deployFriendListEmptyNotification(){
  try{
    document.getElementById("TestGift").innerHTML = "No Friends Found! Invite Some Friends In The \"Invite\" Tab!";
  } catch(err){
    console.log("Loading Element Missing, Creating A New One");
    var liItem = document.createElement("LI");
    liItem.id = "TestGift";
    liItem.className = "gift";
    var textNode = document.createTextNode("No Friends Found! Invite Some Friends In The \"Invite\" Tab!");
    liItem.appendChild(textNode);
    userList.insertBefore(liItem, document.getElementById("giftListContainer").childNodes[0]);
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
    default:
      break;
  }
}
