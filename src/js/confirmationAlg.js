/*
Welcome to the confirmation page! This page welcomes an authenticated user to their list of pending invites. Upon
selecting a pending invite, you are greeted with their user name, share code, and the option to accept or delete the
pending invite. There is also a navigation tab at the top of the window that shows the user their options for which
page they would like to navigate to or sign out.

As per usual, the typical object declarations are below!
 */

var userArr = [];                       //An array that stores all the user data that is fetched from the database
var friendArr = [];                     //An array that stores all the user's friends that are fetched from the database
var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read
var inviteListEmptyBool = false;        //A global boolean used to dictate whether or not the invite list is empty

var inviteCount = 0;                    //An integer used to keep track of the number of invites loaded on the page
var onlineInt = 0;                      //An integer used to tell if the authenticated user is online
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var userList;                           //Stores the "User List" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var user;                               //Stores an authenticated user's data
var userInitial;                        //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data
var userFriends;                        //Tells the webpage where to look in the database for data
var modal;                              //Stores the modal that is used for displaying gift details
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var notificationBtn;                    //Stores the "Notification" object on the webpage


//This function will load an authenticated user's data from memory and updates various objects on the page based upon
//the data that the user's object contains.
function getCurrentUser(){
    try {
        user = JSON.parse(sessionStorage.validUser);
        console.log("User: " + user.userName + " logged in");
        if (user.invites == undefined) {
            console.log("Invites Not Found");
            deployInviteListEmptyNotification();
            inviteListEmptyBool = true;
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
                        navigation(5);
                    }
                } else {
                    notificationBtn.src = "img/bellNotificationOff.png";
                    notificationBtn.onclick = function() {
                        navigation(5);
                    }
                }
            } else if (user.notifications.length > 0) {
                notificationBtn.src = "img/bellNotificationOn.png";
                notificationBtn.onclick = function() {
                    navigation(5);
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
//from the indexAlg is fetched here to reconnect to the database. Additionally, the database is queried, the inviteNote
//object is "activated" and the login timer is started.
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
            document.getElementById("TestGift").innerHTML = "No Invites Found! Wait For More Friends To Send You Invites!";
          }
        } catch(err){
          if(inviteCount == 0) {
            console.log("Loading Element Missing, Creating A New One");
            var liItem = document.createElement("LI");
            liItem.id = "TestGift";
            liItem.className = "gift";
            if (onlineInt == 0) {
              var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
            } else {
              var textNode = document.createTextNode("No Invites Found! Wait For More Friends To Send You Invites!");
            }
            liItem.appendChild(textNode);
            userList.insertBefore(liItem, document.getElementById("userListContainer").childNodes[0]);
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
      } else if (!inviteListEmptyBool) {
          testGift.innerHTML = "Loading... Please Wait...";
      }
      clearInterval(loadingTimer);
    }
  }, 1000);

  databaseQuery();

  inviteConfirmButton();

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


  //This function activates a "toggle" on the invites button to notify the user that they are confirming their invites
  function inviteConfirmButton(){
    var nowConfirm = 0;
    var alternator = 0;
    console.log("Invite Button Feature Active");
    setInterval(function(){
      nowConfirm = nowConfirm + 1000;
      if(nowConfirm >= 3000){
        nowConfirm = 0;
        if(alternator == 0) {
          alternator++;
          document.getElementById("inviteNote").innerHTML = "Confirm";
          inviteNote.style.background = "#00c606";
        } else {
          alternator--;
          document.getElementById("inviteNote").innerHTML = "Invites";
          inviteNote.style.background = "#00ad05";
        }
      }
    }, 1000);
  }


    //This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
    //as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
    //locations are stored and checked on regularly.
  function databaseQuery() {

    userInitial = firebase.database().ref("users/");
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
        if (!friendArr.includes(data.val()))
          friendArr.push(data.val());
      });

      postRef.on('child_changed', function (data) {
        console.log(friendArr);
        friendArr[data.key] = data.val();
        console.log(friendArr);
      });

      postRef.on('child_removed', function (data) {
        console.log(friendArr);
        friendArr.splice(data.key, 1);
        console.log(friendArr);
      });
    };

    var fetchInvites = function (postRef) {
      postRef.on('child_added', function (data) {
        inviteArr.push(data.val());

        createInviteElement(data.val());
        inviteNote.style.background = "#ff3923";
      });

      postRef.on('child_changed', function (data) {
        inviteArr[data.key] = data.val();

        changeInviteElement(data.val());
      });

      postRef.on('child_removed', function (data) {
        sessionStorage.setItem("validUser", JSON.stringify(user));
        location.reload();
      });
    };

    fetchData(userInitial);
    fetchFriends(userFriends);
    fetchInvites(userInvites);

    listeningFirebaseRefs.push(userInitial);
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


    //This function creates each invite's element in the page. Upon clicking on an invite's element, a modal will appear
    //with the proper invite's details and buttons.
  function createInviteElement(inviteKey){
    try{
      document.getElementById("TestGift").remove();
    } catch (err) {}

    var inviteData;
    for (var i = 0; i < userArr.length; i++){
      if(inviteKey == userArr[i].uid){
        inviteData = userArr[i];
        break;
      }
    }

    var userUid = inviteData.uid;
    var inviteName = inviteData.name;
    var inviteUserName = inviteData.userName;
    var inviteShareCode = inviteData.shareCode;
    var liItem = document.createElement("LI");
    liItem.id = "user" + userUid;
    liItem.className = "gift";
    liItem.onclick = function (){
      var span = document.getElementsByClassName("close")[0];
      var inviteAdd = document.getElementById('userAccept');
      var inviteDelete = document.getElementById('userDelete');
      var inviteNameField = document.getElementById('userName');
      var inviteUserNameField = document.getElementById('userUName');
      var inviteShareCodeField = document.getElementById('userShareCode');

      if(inviteShareCode == undefined) {
        inviteShareCode = "This User Does Not Have A Share Code";
      }

      inviteNameField.innerHTML = inviteName;
      inviteUserNameField.innerHTML = "User Name: " + inviteUserName;
      inviteShareCodeField.innerHTML = "Share Code: " + inviteShareCode;

      inviteAdd.onclick = function(){
        addInvite(inviteData);
        modal.style.display = "none";
      };

      inviteDelete.onclick = function(){
        deleteInvite(userUid);
        modal.style.display = "none";
      };

      //show modal
      modal.style.display = "block";

      //close on close
      span.onclick = function() {
        modal.style.display = "none";
      };

      //close on click
      window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      }
    };
    var textNode = document.createTextNode(inviteName);
    liItem.appendChild(textNode);

    userList.insertBefore(liItem, document.getElementById("userListContainer").childNodes[0]);

    inviteCount++;
  }


    //This function updates each invite's element in the page. Upon clicking on an invite's element, a modal will appear
    //with the proper invite's details and buttons.
  function changeInviteElement(inviteKey){
    var inviteData;
    for (var i = 0; i < userArr.length; i++){
      if(inviteKey == userArr[i].uid){
        inviteData = userArr[i];
        break;
      }
    }

    var userUid = inviteData.uid;
    var inviteName = inviteData.name;
    var inviteUserName = inviteData.userName;
    var inviteShareCode = inviteData.shareCode;
    var liItemUpdate = document.getElementById("user" + inviteData.uid);
    liItemUpdate.innerHTML = inviteName;
    liItemUpdate.className = "gift";
    liItemUpdate.onclick = function (){
      var span = document.getElementsByClassName("close")[0];
      var inviteAdd = document.getElementById('userAccept');
      var inviteDelete = document.getElementById('userDelete');
      var inviteNameField = document.getElementById('userName');
      var inviteUserNameField = document.getElementById('userUName');
      var inviteShareCodeField = document.getElementById('userShareCode');

      if(inviteShareCode == undefined) {
        inviteShareCode = "This User Does Not Have A Share Code";
      }

      inviteNameField.innerHTML = inviteName;
      inviteUserNameField.innerHTML = "User Name: " + inviteUserName;
      inviteShareCodeField.innerHTML = "Share Code: " + inviteShareCode;

      inviteAdd.onclick = function(){
        addInvite(inviteData);
        modal.style.display = "none";
      };

      inviteDelete.onclick = function(){
        deleteInvite(userUid);
        modal.style.display = "none";
      };

      //show modal
      modal.style.display = "block";

      //close on close
      span.onclick = function() {
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


    //This function adds the current user's uid to the new friend's friend list and vis versa, after which it updates
    //both data sets to the database.
  function addInvite(inviteData){
    console.log("Adding " + inviteData.uid);
    console.log(friendArr);

    var friendFriendArr;
    if(inviteData.friends == undefined || inviteData.friends == null) {
      friendFriendArr = [];
    } else {
      friendFriendArr = inviteData.friends;
    }

    friendFriendArr.push(user.uid);
    firebase.database().ref("users/" + inviteData.uid).update({
      friends: friendFriendArr
    });


    if (friendArr == undefined || friendArr == null || friendArr.length == 0){
      friendArr = [];
      friendArr.push(inviteData.uid);
      user.friends = [];
      user.friends.push(inviteData.uid);
    } else {
      friendArr.push(inviteData.uid);
      user.friends.push(inviteData.uid);
    }
    firebase.database().ref("users/" + user.uid).update({
      friends: friendArr
    });

    console.log(friendArr);

    deleteInvite(inviteData.uid);
  }


  //This function removes the invite from the current user's invite list and then updates the invite list to the database.
  function deleteInvite(uid) {
    var verifyDeleteBool = true;
    var toDelete = -1;

    console.log("Deleting " + uid);
    for (var i = 0; i < inviteArr.length; i++){
      if(inviteArr[i] == uid) {
        toDelete = i;
        break;
      }
    }

    if(toDelete != -1) {
      inviteArr.splice(toDelete, 1);

      for (var i = 0; i < inviteArr.length; i++) {
        if (inviteArr[i] == uid) {
          verifyDeleteBool = false;
          break;
        }
      }
    } else {
      verifyDeleteBool = false;
    }

    if(verifyDeleteBool){
      user.invites = inviteArr;
      firebase.database().ref("users/" + user.uid).update({
        invites: inviteArr
      });

      if(inviteArr.length == 0)
        navigation(2);
    }
  }
};


//This function deploys a notification that shows that the user's invite list is empty
function deployInviteListEmptyNotification(){
  try{
    document.getElementById("TestGift").innerHTML = "No Invites Found! Invite Some Friends On The Invites Page!";
  } catch(err){
    console.log("Loading Element Missing, Creating A New One");
    var liItem = document.createElement("LI");
    liItem.id = "TestGift";
    liItem.className = "gift";
    var textNode = document.createTextNode("No Invites Found! Invite Some Friends On The Invites Page!");
    liItem.appendChild(textNode);
    userList.insertBefore(liItem, document.getElementById("userListContainer").childNodes[0]);
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
            window.location.href = "confirmation.html";
            break;
        case 5:
            window.location.href = "notifications.html";
            break;
        default:
            break;
    }
}
