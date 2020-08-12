/*
Welcome to the index! This is the first webpage that will be pulled up when you open Gifty. If you try to access other
webpages without the proper credentials, you will be redirected here instead. (We will find out more about how that works
later)

The following section includes all of the necessary initializations for the entire webpage. I did my best to organize
them in a way that makes sense and are easily readable by other people.

Out of the objects listed below, only a small portion are used universally between all the webpages. Every webpage on
Gifty has some basic data structures that are integral to the operation of the webpage. On this page, those data
structures are listeningFirebaseRefs, validUser, and userArr. Once logged in, there are other data structures that become more
important to help keep everything organized and efficient, but that will be brought up later. For now, continue on for
more details about each function below!
 */

var listeningFirebaseRefs = [];     //An array that stores locations in the database that need to be listened to
var userArr = [];                   //An array that stores all the user data that is fetched from the database

var configObj = {};                 //An object used to store the config from "txt/config.txt"

var loginBool = false;              //A boolean used in login() to verify that a user is authenticated

var userInitial;                    //Tells the webpage where to look in the database for data
var username;                       //Stores the "UserName" input field on the webpage
var pin;                            //Stores the "Pin" input field on the webpage
var offlineSpan;                    //Stores the "X" object on the "Offline" window
var offlineModal;                   //Stores the "Offline" window object on the webpage
var validUser;                      //Stores an authenticated user into local memeory
var loginBtn;                       //Stores the "Login" object on the webpage
var signUpFld;                      //Stores the "Sign Up" object on the webpage


//This function is triggered once the webpage has finished loading all the necessary content
//This is where all the necessary buttons and fields are declared. Once complete, the config file is fetched.
window.onload = function instantiate() {

  username = document.getElementById("username");
  pin = document.getElementById("pin");
  offlineModal = document.getElementById("offlineModal");
  offlineSpan = document.getElementById("closeOffline");
  loginBtn = document.getElementById('loginBtn');
  signUpFld = document.getElementById("signUpFld");

  loginBtn.innerHTML = "Please Wait...";

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

  fetchConfigFile();
};


//The following function makes use of AJAX to access a local file called "txt/config.txt"
//Once the necessary data has been retrieved from the config file, the database is initialized.
function fetchConfigFile(){
    console.log("Fetching Config");
    var file = "txt/config.txt";

    $.ajax({
        url: file,
        success: function(data){
            var configInitializeInt = 0;
            var configFileInput = data.split('\n');
            var isComment;
            var apiKeyString = "";
            var authDomainString = "";
            var databaseURLString = "";
            var projectIdString = "";
            var storageBucketString = "";
            var messagingSenderIdString = "";
            var appIdString = "";
            var measurementIdString = "";

            for(var i = 0; i < configFileInput.length; i++){
                isComment = false;
                if (configFileInput[i].charAt(0) == "#" || configFileInput[i].charAt(0) == "") {
                    isComment = true;
                }
                if (!isComment) {
                    if (configFileInput[i].includes("apiKey:")){
                        configInitializeInt++;
                        apiKeyString = configFileInput[i].substr(7, configFileInput[i].length);
                        apiKeyString = apiKeyString.replace(/"/g, '');
                        apiKeyString = apiKeyString.replace(/,/g, '');
                        apiKeyString = apiKeyString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("authDomain:")){
                        configInitializeInt++;
                        authDomainString = configFileInput[i].substr(11, configFileInput[i].length);
                        authDomainString = authDomainString.replace(/"/g, '');
                        authDomainString = authDomainString.replace(/,/g, '');
                        authDomainString = authDomainString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("databaseURL:")){
                        configInitializeInt++;
                        databaseURLString = configFileInput[i].substr(12, configFileInput[i].length);
                        databaseURLString = databaseURLString.replace(/"/g, '');
                        databaseURLString = databaseURLString.replace(/,/g, '');
                        databaseURLString = databaseURLString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("projectId:")){
                        configInitializeInt++;
                        projectIdString = configFileInput[i].substr(10, configFileInput[i].length);
                        projectIdString = projectIdString.replace(/"/g, '');
                        projectIdString = projectIdString.replace(/,/g, '');
                        projectIdString = projectIdString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("storageBucket:")){
                        configInitializeInt++;
                        storageBucketString = configFileInput[i].substr(14, configFileInput[i].length);
                        storageBucketString = storageBucketString.replace(/"/g, '');
                        storageBucketString = storageBucketString.replace(/,/g, '');
                        storageBucketString = storageBucketString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("messagingSenderId:")){
                        configInitializeInt++;
                        messagingSenderIdString = configFileInput[i].substr(18, configFileInput[i].length);
                        messagingSenderIdString = messagingSenderIdString.replace(/"/g, '');
                        messagingSenderIdString = messagingSenderIdString.replace(/,/g, '');
                        messagingSenderIdString = messagingSenderIdString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("appId:")){
                        configInitializeInt++;
                        appIdString = configFileInput[i].substr(6, configFileInput[i].length);
                        appIdString = appIdString.replace(/"/g, '');
                        appIdString = appIdString.replace(/,/g, '');
                        appIdString = appIdString.replace(/ /g, '');
                    } else if (configFileInput[i].includes("measurementId:")){
                        configInitializeInt++;
                        measurementIdString = configFileInput[i].substr(14, configFileInput[i].length);
                        measurementIdString = measurementIdString.replace(/"/g, '');
                        measurementIdString = measurementIdString.replace(/,/g, '');
                        measurementIdString = measurementIdString.replace(/ /g, '');
                    } else {
                        //console.log("Unknown Config String, Please Advise:");
                        //console.log(configFileInput[i]);
                    }
                } else {
                    //console.log("Comment Found!");
                }
            }

            if(configInitializeInt == 8){     //Checks to see if any of the previous data was missed
                if (apiKeyString == "" || authDomainString == "" || databaseURLString == "" || projectIdString == "" ||
                    storageBucketString == "" || messagingSenderIdString == "" || appIdString == "" || measurementIdString == "") {
                    alert("Config not properly initialized! Please contact an administrator!");
                    console.log("Config Not Initialized! Are You Using The Default Config File?");
                } else {
                    configObj = {
                        apiKey: apiKeyString,
                        authDomain: authDomainString,
                        databaseURL: databaseURLString,
                        projectId: projectIdString,
                        storageBucket: storageBucketString,
                        messagingSenderId: messagingSenderIdString,
                        appId: appIdString,
                        measurementId: measurementIdString
                    };
                    console.log("Config Successfully Initialized!");

                    sessionStorage.setItem("config", JSON.stringify(configObj));
                    initializeDatabase();
                }
            }
        }
    });
}


//This is where all the necessary data to access the database is declared. Once complete, the database will be accessed
//and the buttons will become operational.
function initializeDatabase(){

  console.log("Initializing Database");

  firebase.initializeApp(configObj);
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

  console.log("Database Successfully Initialized!");
  databaseQuery();
  loginBtn.innerHTML = "Log In";
  loginBtn.onclick = function(){
    login();
  }
  signUpFld.onclick = function(){
    signUp();
  }
}


//This is the function where all the data is accessed and put into arrays. Those arrays are also updated and removed
//as new data is received. New data is checked through the "listeningFirebaseRefs" array, as this is where database
//locations are stored and checked on regularly.
function databaseQuery() {

  console.log("Fetching Users From Database");
  userInitial = firebase.database().ref("users/");

  var fetchPosts = function (postRef) {
    postRef.on('child_added', function (data) {
      userArr.push(data.val());
    });

    postRef.on('child_changed', function (data) {
      var i = findUIDItemInArr(data.key, userArr);
      if(userArr[i] != data.val() && i != -1){
        //console.log("Updating " + userArr[i].userName + " to most updated version: " + data.val().userName);
        userArr[i] = data;
      }
    });

    postRef.on('child_removed', function (data) {
      var i = findUIDItemInArr(data.key, userArr);
      if(userArr[i] != data.val() && i != -1){
        //console.log("Removing " + userArr[i].userName + " / " + data.val().userName);
        userArr.splice(i, 1);
      }
    });
  };

  fetchPosts(userInitial);

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


//This function is called once the "Login" button is pressed. It first checks all the user names in the userArr array.
//If the correct user name is found, the pin is decoded in passOp.js and checked. Depending on the user's input, the
//user will be told "User (USER NAME) Authenticated" or "Username or Password Incorrect".
function login() {
  var validUserInt = 0;
  for(var i = 0; i < userArr.length; i++){
      //This prevents "case sensitive" usernames from being mis-interpreted
    if(userArr[i].userName.toLowerCase() == username.value.toLowerCase()){
      try {
        if(decode(userArr[i].encodeStr) == pin.value){
          loginBool = true;
          validUserInt = i;
          break;
        } else {

        }
      } catch (err) {
        if(userArr[i].pin == pin.value){
          loginBool = true;
          validUserInt = i;
          break;
        } else {

        }
      }
    }
  }
  if (loginBool === true){
    document.getElementById("loginInfo").innerHTML = "User " + userArr[validUserInt].userName + " Authenticated";
    validUser = userArr[validUserInt];
    sessionStorage.setItem("validUser", JSON.stringify(validUser));
    sessionStorage.setItem("userArr", JSON.stringify(userArr));
    window.location.href = "home.html";
  } else if (loginBool === false) {
    document.getElementById("loginInfo").innerHTML = "Username or Password Incorrect";
  }
}


//This function is called once the "Sign Up" field is pressed. It simply redirects the user to the "userAddUpdate.html" page.
function signUp(){
  window.location.href = "userAddUpdate.html";
}
