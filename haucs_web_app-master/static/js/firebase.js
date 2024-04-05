// Your web app's Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Define the drone ID (replace this with the actual ID or a method to retrieve it)
const drone_id = 'SPLASHY_2';

// Reference to your specific database path
const ref = database.ref('LH_Farm/drone/' + drone_id);

function updateData(){

  
  // Fetch the data
  ref.on('value', (snapshot) => {
    const data = snapshot.val();
    
    // Assuming your data structure includes `type` and `properties` with `number` and `day`
    if (data && data.properties) {
      document.getElementById('msg').textContent = data.msg;
      document.getElementById('flight_mode').textContent = data.flight_mode;
      document.getElementById('flight_status').textContent = data.flight_status;
      document.getElementById('on_water').textContent = data.on_water;
    }
  }, (error) => {
    console.error(error);
  });
}