/*
Welcome to the userAddUpdate page! This is the page that does all the leg work for creating, updating, and deleting
user data. As such, this has to be used for BOTH new users and old users, and is programmed to do just that. At some
point, I would like to be able to update all of the pages to have more than just one function, but that's something for
another day.

As always, all the necessary declarations are as follows!
 */

var listeningFirebaseRefs = [];         //An array that stores locations in the database that need to be listened to
var userNameArr = [];                   //An array that stores userNames for use in the checkUserNames() function
var userArr = [];                       //An array that stores all the user data that is fetched from the database

var userNameBool = true;                //A global boolean used to verify whether a userName is taken or not
var areYouStillThereBool = false;       //A global boolean used to verify whether the user is active or inactive

var pinClearedInt = 0;                  //An integer used to tell whether the pin field has been cleared
var logoutReminder = 300;               //The maximum limit to remind the user about being inactive
var logoutLimit = 900;                  //The maximum limit to logout the user after being inactive for too long

var offlineSpan;                        //Stores the "X" object on the "Offline" window
var offlineModal;                       //Stores the "Offline" window object on the webpage
var confirmSpan;                        //Stores the "X" object on the "Confirmation" window
var confirmModal;                       //Stores the "Confirmation" window object on the webpage
var deleteConfirm;                      //Stores the "Confirm" button on the "Confirmation" window object
var deleteDeny;                         //Stores the "Deny" button on the "Confirmation" window object
var nameField;                          //Stores the "Name" input field on the webpage
var userNameField;                      //Stores the "UserName" input field on the webpage
var pinField;                           //Stores the "Pin" input field on the webpage
var pinconfField;                       //Stores the "Confirm Pin" input field on the webpage
var btnUpdate;                          //Stores the "Update" object on the webpage
var btnDelete;                          //Stores the "Delete" object on the webpage
var userInitial;                        //Tells the webpage where to look in the database for data
var user;                               //Stores an authenticated user's data
var noteModal;                          //Stores the "Notification" window object on the webpage
var noteInfoField;                      //Stores the "Info" field on the "Notification" window object
var noteTitleField;                     //Stores the "Title" field on the "Notification" window object
var noteSpan;                           //Stores the "X" object on the "Notification" window


//If a user accesses this page from the settings, this will load their data from local storage.
//This function also updates the necessary objects on the webpage as well as the login timer
function getCurrentUser(){
  try {
    user = JSON.parse(sessionStorage.validUser);
  } catch (err) {
    console.log("Welcome new user!");
  }
  if(user == null){//newUser
    btnUpdate.innerHTML = "Create User Profile";
    alert("Alert! Make sure that you use pins that you have never used before! The pins will be stored securely," +
      "but in the case of an unforseen attack, this will be additional protection for your personal accounts.");
  } else {//returningUser
    btnUpdate.innerHTML = "Loading...";
    btnDelete.style.display = "block";
    btnDelete.style.position = "fixed";
    btnDelete.style.left = "50%";
    btnDelete.style.transform = "translate(-50%)";
    btnDelete.innerHTML = "Loading...";
    userArr = JSON.parse(sessionStorage.userArr);

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
    alert("Please note that you will be required to input your confirmation pin to continue. If you would like to " +
      "cancel, please click the back button on the browser.");
  }
}


//This function instantiates all necessary data after the webpage has finished loading. The config data that was stored
//from the indexAlg is fetched here to reconnect to the database. The database is also queried in the same function.
window.onload = function instantiate() {

  nameField = document.getElementById('name');
  userNameField = document.getElementById('username');
  pinField = document.getElementById('pin');
  pinconfField = document.getElementById('pinconf');
  btnUpdate = document.getElementById('updateUser');
  btnDelete = document.getElementById('deleteUser');
  offlineModal = document.getElementById('offlineModal');
  offlineSpan = document.getElementById('closeOffline');
  confirmModal = document.getElementById('confirmModal');
  confirmSpan = document.getElementsByClassName('closeConfirm');
  deleteConfirm = document.getElementById('deleteConfirm');
  deleteDeny = document.getElementById('deleteDeny');
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

  pinField.onclick = function() {
    if(pinClearedInt == 0) {
      pinField.value = "";
      pinconfField.value = "";
      pinClearedInt++;
    }
  };

  databaseQuery();


//This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
//as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
//locations are stored and checked on regularly.
  function databaseQuery() {

    userInitial = firebase.database().ref("users/");

    var fetchData = function (postRef) {
      postRef.on('child_added', function (data) {
        userArr.push(data.val());
        userNameArr.push(data.val().userName);

        if(user != null) {
          if (data.key == user.uid) {
            user = data.val();
            nameField.value = user.name;
            userNameField.value = user.userName;
            pinField.value = user.pin;
            pinconfField.placeholder = "Please Confirm Pin To Continue";
            btnUpdate.innerHTML = "Update User Profile";
            btnDelete.innerHTML = "Delete User Profile";
            console.log("User Updated: 1");
          }
        }
      });

      postRef.on('child_changed', function (data) {
        var i = findUIDItemInArr(data.key, userArr);
        if(userArr[i] != data.val() && i != -1){
          console.log("Updating " + userArr[i].userName + " to most updated version: " + data.val().userName);
          userArr[i] = data.val();

          userNameArr[i] = data.val().userName;
        }

        if(user != null) {
          if (data.key == user.uid) {
            user = data.val();
            console.log("User Updated: 2");
          }
        }
      });

      postRef.on('child_removed', function (data) {
        var i = findUIDItemInArr(data.key, userArr);
        userArr.splice(i, 1);
        userNameArr.splice(i, 1);
      });
    };

    fetchData(userInitial);

    listeningFirebaseRefs.push(userInitial);
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
};


//This function is called once the "Delete" button is clicked. It double checks the user's decision to delete their
//user account. If so, the user will be removed from the database. If not, the window will close with no further action.
function deleteCheck(){

  console.log(user.uid + " will be deleted. Are you sure?");
  confirmModal.style.display = "block";

  deleteConfirm.onclick = function () {
    console.log("Confirmed to delete user " + user.uid);
    firebase.database().ref("users/").child(user.uid).remove();
    confirmModal.style.display = "none";

    btnDelete.innerHTML = "Please Wait...";
    btnUpdate.onclick = function(){};//forces the update button to do nothing
    btnDelete.onclick = function(){};//forces the delete button to do nothing
    window.location.href = "index.html";
  };

  deleteDeny.onclick = function () {
    console.log("Denied to delete user " + user.uid);
    confirmModal.style.display = "none";
  };

  //close on close
  confirmSpan.onclick = function () {
    console.log("Closed window, user " + user.uid + " not deleted");
    confirmModal.style.display = "none";
  };

  //close on click
  window.onclick = function (event) {
    if (event.target == confirmModal) {
      console.log("Clicked outside window, user " + user.uid + " not deleted");
      confirmModal.style.display = "none";
    }
  }
}


//This function is called once the "Update" button is clicked. It first double checks all user names to ensure that the
//chosen user name has not been taken. It then checks for empty fields and proper pin syntax. Once complete, the user
//data is updated into the database and the user is redirected back to the settings page.
function updateUserToDB(){

  checkUserNames(userNameField.value);

  if (nameField.value === "" || userNameField.value === "" || pinField.value === "" || pinconfField.value === ""){
    alert("It looks like you left some fields blank. Make sure you have your full name, username, a pin, and " +
      "a confirmed pin below.");
  } else if (pinconfField.value !== pinField.value){
    alert("It looks like the pins you entered are not the same");
  } else if (!isNaN(pinField.value) == false) {
    alert("It looks like the pins you entered are not numeric, please make sure that they are numbers only");
  } else if (userNameBool == false && user == null){
    alert("It looks like the User Name you chose is already taken, please choose another.");
    userNameBool = true;
  } else {
    var newPin = parseInt(pinField.value);
    injectUserArr(userArr);
    var encodeKey = encode(pinField.value);
    firebase.database().ref("users/" + user.uid).update({
      name: nameField.value,
      pin: newPin,
      encodeStr: encodeKey,
      userName: userNameField.value,
      ban: user.ban,
      firstLogin: user.firstLogin,
      moderatorInt: user.moderatorInt,
      organize: user.organize,
      strike: user.strike,
      theme: user.theme,
      uid: user.uid,
      warn: user.warn,
    });
    if(user.giftList != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        giftList: user.giftList
      });
    }
    if(user.support != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        support: user.support
      });
    }
    if(user.invites != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        invites: user.invites
      });
    }
    if(user.friends != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        friends: user.friends
      });
    }
    if(user.shareCode != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        shareCode: user.shareCode
      });
    }
    if(user.notifications != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        notifications: user.notifications
      });
    }
    if (user.readNotifications != undefined) {
      firebase.database().ref("users/" + user.uid).update({
        readNotifications: user.readNotifications
      });
    }

    btnUpdate.innerHTML = "Please Wait...";
    btnUpdate.onclick = function(){};//forces the update button to do nothing
    btnDelete.onclick = function(){};//forces the delete button to do nothing
    sessionStorage.setItem("validUser", JSON.stringify(user));
    sessionStorage.setItem("userArr", JSON.stringify(userArr));
    window.location.href = "settings.html";
  }

}


//This function is called once the "Add" button is clicked. This function is (in essence) exactly the same as the update
//function, with the small difference of needing to add a new user to the database and redirect to the login page.
function addUserToDB(){

  checkUserNames(userNameField.value);

  if (nameField.value === "" || userNameField.value === "" || pinField.value === "" || pinconfField.value === ""){
    alert("It looks like you left some fields blank. Make sure you have your full name, username, a pin, and " +
      "a confirmed pin below.");
  } else if (pinconfField.value !== pinField.value){
    alert("It looks like the pins you entered are not the same");
  } else if (!isNaN(pinField.value) == false) {
    alert("It looks like the pins you entered are not numeric, please make sure that they are numbers only");
  } else if (userNameBool == false){
    alert("It looks like the User Name you chose is already taken, please choose another.");
    userNameBool = true;
  } else {
    var newUid = firebase.database().ref("users").push();
    var newPin = parseInt(pinField.value);
    injectUserArr(userArr);
    var encodeKey = encode(pinField.value);
    var shareCodeNew = genShareCode();
    console.log(shareCodeNew);
    newUid = newUid.toString();
    newUid = newUid.substr(45, 64);
    firebase.database().ref("users/" + newUid).set({
      name: nameField.value,
      pin: newPin,
      encodeStr: encodeKey,
      userName: userNameField.value,
      ban: 0,
      firstLogin: 0,
      moderatorInt: 0,
      organize: 0,
      strike: 0,
      theme: 0,
      uid: newUid,
      warn: 0,
      shareCode: shareCodeNew
    });

    btnUpdate.innerHTML = "Please Wait...";
    btnUpdate.onclick = function(){};//forces the update button to do nothing
    btnDelete.onclick = function(){};//forces the delete button to do nothing
    window.location.href = "index.html";
  }
}


//This function generates a "Share Code" for the new user. This was originally an idea that was meant to take the place
//of userNames if the user wished to invite someone to see their list, but was eventually scrapped. It is still here in
//the case that I want to revive the idea for another purpose.
function genShareCode(){
  var tempShareCode = "";
  for(var i = 1; i < 17; i++){
    tempShareCode = tempShareCode + getRandomAlphabet();
    if((i % 4) == 0 && i < 16){
      tempShareCode = tempShareCode + "-";
    }
  }
  return tempShareCode;
}


//This function is called from the genShareCode() function and returns a random number or letter
function getRandomAlphabet(){
  var alphabet = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
  var selector = Math.floor((Math.random() * alphabet.length));
  var charSelect = alphabet.charAt(selector);
  return charSelect;
}


//This function is called from the add and update functions. It checks to see if the chosen username already exists.
function checkUserNames(userName){
  for(var i = 0; i < userNameArr.length; i++){
    if(userName == userNameArr[i]){
      userNameBool = false;
    }
  }
}


//This function is called when the "Update" button is clicked. It checks to see if the user object is empty, in which
//case it updates or adds a new user to the database.
function updateSuppressCheck(){
  if(user != null){
    updateUserToDB();
  } else {
    addUserToDB();
  }
}
