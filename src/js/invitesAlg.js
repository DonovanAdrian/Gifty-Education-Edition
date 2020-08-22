/*
Welcome to the invites page! This page (just like the lists page) welcomes an authenticated user to their wealth (or
lack thereof) of friends that are on their friend list. If you click on one of these friends, you will be shown their
user name and share code. You also have the option of removing the user from the friend list on this page. Like most of
the other pages, there is a navigation tab at the top of the page in case the user changes their mind and wants to go
to another page instead or sign out.

As always, below are the usual object and data declarations!
 */

var inviteArr = [];                     //An array that stores all the user's invites that are fetched from the database
var friendArr = [];                     //An array that stores the user's friends that are fetched from the database
var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var userArr = [];                       //An array that stores all the user data that is fetched from the database

var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive
var readNotificationsBool = false;      //A boolean used to dictate whether all notifications have been read
var invitesFound = false;               //A boolean used to assist the deployment of an empty friend list notification

var friendCount = 0;                    //An integer used to keep track of the number of friends loaded on the page
var loadingTimerInt = 0;                //An integer used to keep track of how long it takes to load the list of gifts
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var userList;                           //Stores the "User List" object on the webpage
var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var userInviteModal;                    //Stores the "Invite" window object on the webpage
var confirmUserModal;                   //Stores the "Confirm" window object on the webpage
var addUserBtn;                         //Stores the "Add User" object on the webpage
var user;                               //Stores an authenticated user's data
var newInvite;                          //Stores the "New Invite" object on the webpage
var inviteNote;                         //Stores the "Invite" object on the navigation tab on the webpage
var userInput;                          //Stores the User Input on the "Invite" window object
var offlineTimer;                       //Stores the "Offline" timer globally so it can be cancelled from any function
var loadingTimer;                       //Stores the "Loading" timer globally so it can be cancelled from any function
var userInitial;                        //Tells the webpage where to look in the database for data
var userFriends;                        //Tells the webpage where to look in the database for data
var userInvites;                        //Tells the webpage where to look in the database for data
var addGlobalMsgModal;                  //Stores the "Private Message" modal for sending users messages
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window
var notificationBtn;                    //Stores the "Notification" object on the webpage
var modal;                              //Stores the modal that is used for displaying user details


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
        newInvite.style.display = "block";
        inviteNote.style.background = "#ff3923";
        invitesFound = true;
      }
    }
    if (user.friends == undefined) {
      deployFriendListEmptyNotification();
    } else if (user.friends.length == 0) {
      deployFriendListEmptyNotification();
    } else {
      //console.log(user.friends);
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
  } catch (err) {
    console.log(err.toString());
    window.location.href = "index.html";
  }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. Additionally, the "Add User" button is instantiated,
//the database is queried, and the login timer is started.
window.onload = function instantiate() {

  notificationBtn = document.getElementById('notificationButton');
  userList = document.getElementById("userListContainer");
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById("closeOffline");
  userInviteModal = document.getElementById('userInviteModal');
  confirmUserModal = document.getElementById('confirmModal');
  inviteNote = document.getElementById('inviteNote');
  newInvite = document.getElementById('newInviteIcon');
  addUserBtn = document.getElementById('addUser');
  noteModal = document.getElementById('notificationModal');
  noteTitleField = document.getElementById('notificationTitle');
  noteInfoField = document.getElementById('notificationInfo');
  noteSpan = document.getElementById('closeNotification');
  addGlobalMsgModal = document.getElementById('userModal');
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
            document.getElementById("TestGift").innerHTML = "No Friends Found! Invite Some Friends With The Button Below!";
          }
        } catch(err){
          if(friendCount == 0) {
            console.log("Loading Element Missing, Creating A New One");
            var liItem = document.createElement("LI");
            liItem.id = "TestGift";
            liItem.className = "gift";
            if (onlineInt == 0) {
              var textNode = document.createTextNode("Loading Failed, Please Connect To Internet");
            } else {
              var textNode = document.createTextNode("No Friends Found! Invite Some Friends With The Button Below!");
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

  newInvite.onclick = function() {
    sessionStorage.setItem("validUser", JSON.stringify(user));
    window.location.href = "confirmation.html";
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

  addUserBtn.innerHTML = "Invite User";
  generateAddUserBtn();

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
        friendArr.push(data.val());
        //console.log("Creating " + data.val());
        createFriendElement(data.val());
      });

      postRef.on('child_changed', function (data) {
        friendArr[data.key] = data.val();
        //console.log("Changing " + data.val());
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
      });

      postRef.on('child_changed', function (data) {
        inviteArr[data.key] = data.val();
      });

      postRef.on('child_removed', function (data) {
        inviteArr.splice(data.key, 1);

        if (inviteArr.length == 0) {
          console.log("Invite List Removed");
          newInvite.style.display = "none";
          inviteNote.style.background = "#008222";
        }
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


    //This function creates each friend element that appears on the page. Once a friend's element is clicked, their
    //respective user names/share codes will appear, as well as a couple helpful buttons/interactive text fields.
  function createFriendElement(friendKey){
    var friendData;
    for (var i = 0; i < userArr.length; i++){
      if(friendKey == userArr[i].uid){
        friendData = userArr[i];
        break;
      }
    }

    if(friendData != null) {
      try{
        document.getElementById("TestGift").remove();
      } catch (err) {}

      var userUid = friendData.uid;
      var friendName = friendData.name;
      var friendUserName = friendData.userName;
      var friendShareCode = friendData.shareCode;
      var liItem = document.createElement("LI");
      liItem.id = "user" + userUid;
      liItem.className = "gift";
      liItem.onclick = function () {
        var span = document.getElementsByClassName("close")[0];
        var friendSendMessage = document.getElementById('sendPrivateMessage');
        var friendInviteRemove = document.getElementById('userInviteRemove');
        var friendNameField = document.getElementById('userName');
        var friendUserNameField = document.getElementById('userUName');
        var friendShareCodeField = document.getElementById('userShareCode');

        if (friendShareCode == undefined || friendShareCode == "") {
          friendShareCode = "This User Does Not Have A Share Code";
        }

        friendNameField.innerHTML = friendName;
        friendUserNameField.innerHTML = "User Name: " + friendUserName;
        friendShareCodeField.innerHTML = "Share Code: " + friendShareCode;

        friendSendMessage.onclick = function() {
          generatePrivateMessageDialog(friendData);
        };

        friendInviteRemove.onclick = function () {
          modal.style.display = "none";
          deleteFriend(userUid);
        };

        //show modal
        modal.style.display = "block";

        //close on close
        span.onclick = function () {
          modal.style.display = "none";
        };

        //close on click
        window.onclick = function (event) {
          if (event.target == modal) {
            modal.style.display = "none";
          }
        };
      };
      var textNode = document.createTextNode(friendName);
      liItem.appendChild(textNode);

      userList.insertBefore(liItem, document.getElementById("userListContainer").childNodes[0]);

      friendCount++;
    }
  }


    //This function updates each friend element that appears on the page. Once a friend's element is clicked, their
    //respective user names/share codes will appear, as well as a couple helpful buttons/interactive text fields.
  function changeFriendElement(friendKey){
    var friendData;
    for (var i = 0; i < userArr.length; i++){
      if(friendKey == userArr[i].uid){
        friendData = userArr[i];
        break;
      }
    }

    if(friendData != null) {
      var userUid = friendData.uid;
      var friendName = friendData.name;
      var friendUserName = friendData.userName;
      var friendShareCode = friendData.shareCode;
      var liItemUpdate = document.getElementById("user" + userUid);
      liItemUpdate.innerHTML = friendName;
      liItemUpdate.className = "gift";
      liItemUpdate.onclick = function () {
        var span = document.getElementsByClassName("close")[0];
        var friendSendMessage = document.getElementById('sendPrivateMessage');
        var friendInviteRemove = document.getElementById('userInviteRemove');
        var friendNameField = document.getElementById('userName');
        var friendUserNameField = document.getElementById('userUName');
        var friendShareCodeField = document.getElementById('userShareCode');

        if (friendShareCode == undefined) {
          friendShareCode = "This User Does Not Have A Share Code";
        }

        friendNameField.innerHTML = friendName;
        friendUserNameField.innerHTML = "User Name: " + friendUserName;
        friendShareCodeField.innerHTML = "Share Code: " + friendShareCode;

        friendSendMessage.onclick = function() {
          generatePrivateMessageDialog(friendData);
        };

        friendInviteRemove.onclick = function () {
          modal.style.display = "none";
          deleteFriend(userUid);
        };

        //show modal
        modal.style.display = "block";

        //close on close
        span.onclick = function () {
          modal.style.display = "none";
        };

        //close on click
        window.onclick = function (event) {
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


  //This function deletes the friend from the user's data and updates the database with the updated list.
  function deleteFriend(uid) {
    //Delete on user's side
    var userFriendArrBackup = friendArr;
    var friendFriendArrBackup = [];
    var verifyDeleteBool = true;
    var toDelete = -1;

    for (var i = 0; i < friendArr.length; i++){
      if(friendArr[i] == uid) {
        toDelete = i;
        break;
      }
    }

    if(toDelete != -1) {
      friendArr.splice(toDelete, 1);

      for (var i = 0; i < friendArr.length; i++) {
        if (friendArr[i] == uid) {
          verifyDeleteBool = false;
          break;
        }
      }
    } else {
      verifyDeleteBool = false;
    }

    if(verifyDeleteBool){
      removeFriendElement(uid);
      user.friends = friendArr;
      generateAddUserBtn(); //Regenerate the button for new friendArr

      firebase.database().ref("users/" + user.uid).update({
        friends: friendArr
      });

      //alert("Friend Successfully removed from your list!");
    } else {
      friendArr = user.friends;
      firebase.database().ref("users/" + user.uid).update({
        friends: userFriendArrBackup
      });
      alert("Delete failed, please try again later! (user)");
      return;
    }



    //Delete on friend's side
    verifyDeleteBool = true;
    toDelete = -1;
    var friendFriendArr;//Weird name, I know, but it's the friend's friend Array...

    for (var i = 0; i < userArr.length; i++){
      if(userArr[i].uid == uid) {
        friendFriendArr = userArr[i].friends;
        friendFriendArrBackup = friendFriendArr;
        break;
      }
    }
    for (var i = 0; i < friendFriendArr.length; i++){
      if (friendFriendArr[i] == user.uid){
        toDelete = i;
        break;
      }
    }

    if(toDelete != -1) {
      friendFriendArr.splice(toDelete, 1);

      for (var i = 0; i < friendFriendArr.length; i++) {
        if (friendFriendArr[i] == user.uid) {
          verifyDeleteBool = false;
          break;
        }
      }
    } else {
      verifyDeleteBool = false;
    }

    if(verifyDeleteBool){
      firebase.database().ref("users/" + uid).update({
        friends: friendFriendArr
      });

      //alert("Friend Successfully removed from their list!");
    } else {
      firebase.database().ref("users/" + uid).update({
        friends: friendFriendArrBackup
      });
      alert("Delete failed, please try again later! (friend)");
    }
  }


  //This function generates the "Add User" button on the webpage as well as its functionality.
  function generateAddUserBtn(){
    var friendUserNameList = [];
    var upperCaseUserArr = [];
    if(user.friends != undefined || user.friends != null) {
      for (var i = 0; i < user.friends.length; i++) {
        for (var a = 0; a < userArr.length; a++) {
          if (userArr[a].uid == user.friends[i]) {
            friendUserNameList.push(userArr[a].userName.toUpperCase());
            break;
          }
        }
      }
    }
    for (var b = 0; b < userArr.length; b++){
      upperCaseUserArr.push(userArr[b].userName.toUpperCase());
    }

    addUserBtn.onclick = function() {
      var addSpan = document.getElementsByClassName("close")[1];
      var addBtn = document.getElementById('addInvite');
      var cancelBtn = document.getElementById('cancelInvite');
      var inviteInfo = document.getElementById('inviteInfo');
      userInput = document.getElementById('userNameInp');


      userInviteModal.style.display = "block";
      addBtn.innerHTML = "Send Invite";

      addBtn.onclick = function() {
        var userLocation = -1;
        for (var i = 0; i < upperCaseUserArr.length; i++) {
          if (upperCaseUserArr[i] == userInput.value.toUpperCase()) {
            userLocation = i;
            break;
          }
        }

        inviteInfo.innerHTML = "";
        if(userInput.value == ""){
          inviteInfo.innerHTML = "User Name Field Empty, Please Try Again!";
        } else if (friendUserNameList.includes(userInput.value.toUpperCase())) {
          inviteInfo.innerHTML = "That User Is Already Your Friend, Please Try Again!";
        } else if (user.userName.toUpperCase() == userInput.value.toUpperCase()){
          inviteInfo.innerHTML = "You Cannot Invite Yourself, Please Try Again!";
        } else if (userLocation != -1) {
          try {
            if (user.invites.includes(userArr[userLocation].uid)) {
              inviteInfo.innerHTML = "This User Already Sent You An Invite, Please Try Again!";
            } else if (userArr[userLocation].invites.includes(user.uid)) {
              inviteInfo.innerHTML = "You Already Sent This User An Invite, Please Try Again!";
            } else {
              generateConfirmDialog(userLocation);
            }
          } catch (err) {
            try {
              if (userArr[userLocation].invites.includes(user.uid)) {
                inviteInfo.innerHTML = "You Already Sent This User An Invite, Please Try Again!";
              } else {
                generateConfirmDialog(userLocation);
              }
            } catch (err) {
              generateConfirmDialog(userLocation);
            }
          }
        } else if (userInput.value.toUpperCase() == "USER NAME BELOW"){
          inviteInfo.innerHTML = "Very Funny, Please Enter A User Name";
        } else if (userInput.value.toUpperCase() == "A USER NAME"){
          inviteInfo.innerHTML = "Listen Here, Please Input Something Serious";
        } else if (userInput.value.toUpperCase() == "SOMETHING SERIOUS"){
          inviteInfo.innerHTML = "You're Just Mocking Me At This Point";
        } else {
          inviteInfo.innerHTML = "That User Name Does Not Exist, Please Try Again!";
        }
      };

      cancelBtn.onclick = function() {
        userInviteModal.style.display = "none";
        userInput.value = "";
        inviteInfo.innerHTML = "";
      };

      addSpan.onclick = function() {
        userInviteModal.style.display = "none";
        userInput.value = "";
        inviteInfo.innerHTML = "";
      };

      window.onclick = function(event) {
        if (event.target == userInviteModal) {
          userInviteModal.style.display = "none";
        }
      }
    };
    console.log("Add Button Generated");
  }


  //This function generates the confirm dialog to confirm a user's invitation to view their list
  function generateConfirmDialog(userLocation) {
    var confirmSpan = document.getElementsByClassName("close")[2];
    var inviteConfirm = document.getElementById('inviteConfirm');
    var inviteDeny = document.getElementById('inviteDeny');
    var confUserName = document.getElementById('confUserName');
    var inviteInfo = document.getElementById('inviteInfo');
    userInput = document.getElementById('userNameInp');

    //console.log(userLocation);
    //console.log(userArr[userLocation].userName);
    if (userLocation != -1) {
      confUserName.innerHTML = "Did you mean to add \"" + userArr[userLocation].name + "\"?";
      userInviteModal.style.display = "none";
      confirmUserModal.style.display = "block";

      inviteConfirm.onclick = function () {
        inviteUserDB(userArr[userLocation]);
        confirmUserModal.style.display = "none";
        userInput.value = "";
        inviteInfo.innerHTML = "";
      };

      inviteDeny.onclick = function () {
        confirmUserModal.style.display = "none";
        userInviteModal.style.display = "block";
        userInput.value = "";
        inviteInfo.innerHTML = "";
      };

      //close on close
      confirmSpan.onclick = function () {
        confirmUserModal.style.display = "none";
        userInput.value = "";
        inviteInfo.innerHTML = "";
      };

      //close on click
      window.onclick = function (event) {
        if (event.target == confirmUserModal) {
          confirmUserModal.style.display = "none";
          userInput.value = "";
          inviteInfo.innerHTML = "";
        }
      }
    } else {
      alert("Error finding user, please contact the developer for assistance!");
    }
  }


  //This function removes the friend's element from the webpage.
  function removeFriendElement(uid) {
    document.getElementById("user" + uid).remove();

    friendCount--;
    if(friendCount == 0){
      deployFriendListEmptyNotification();
    }
  }


  //This function invites a valid user to view the current user's friend list.
  function inviteUserDB(invitedUser) {
    var invitedUserInvites;
    if(invitedUser.invites == undefined || invitedUser.invites == null){
      invitedUserInvites = [];
    } else {
      invitedUserInvites = invitedUser.invites;
    }
    invitedUserInvites.push(user.uid);

    if(invitedUser.invites != undefined) {
      firebase.database().ref("users/" + invitedUser.uid).update({
        invites: invitedUserInvites
      });
    } else {
      //console.log("New Invite List");
      firebase.database().ref("users/" + invitedUser.uid).update({invites:{0:user.uid}});
    }

    var notificationString = generateNotificationString(user.name, "invites.html");
    var invitedUserNotificiations;
    if(invitedUser.notifications == undefined || invitedUser.notifications == null){
      invitedUserNotificiations = [];
    } else {
      invitedUserNotificiations = invitedUser.notifications;
    }
    invitedUserNotificiations.push(notificationString);

    if(invitedUser.notifications != undefined) {
      firebase.database().ref("users/" + invitedUser.uid).update({
        notifications: invitedUserNotificiations
      });
    } else {
      console.log("New Notifications List");
      firebase.database().ref("users/" + invitedUser.uid).update({notifications:{0:notificationString}});
    }
  }


  //This function generates the notification string for an invite
  function generateNotificationString(invitedName, pageName){
    return (invitedName + "," + pageName);
  }
};


//This function deploys a notification that the user's friend list is empty
function deployFriendListEmptyNotification(){
  try{
    if (invitesFound) {
      document.getElementById("TestGift").innerHTML = "No Friends Found, But You Have Some Pending Invites!";
    } else {
      document.getElementById("TestGift").innerHTML = "No Friends Found! Invite Some Friends With The Button Below!";
    }
  } catch(err){
    console.log("Loading Element Missing, Creating A New One");
    var liItem = document.createElement("LI");
    liItem.id = "TestGift";
    liItem.className = "gift";
    if (invitesFound) {
      var textNode = document.createTextNode("No Friends Found, But You Have Some Pending Invites!");
    } else {
      var textNode = document.createTextNode("No Friends Found! Invite Some Friends With The Button Below!");
    }
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
    default:
      break;
  }
}
