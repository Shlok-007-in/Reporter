// -------------------------
// Firebase Setup with Authentication
// -------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4QI3GXeapuGuT-5m3cYSxrmSWD1Inhig",
  authDomain: "reporter-6b298.firebaseapp.com",
  databaseURL: "https://reporter-6b298-default-rtdb.firebaseio.com",
  projectId: "reporter-6b298",
  storageBucket: "reporter-6b298.firebasestorage.app",
  messagingSenderId: "812204101681",
  appId: "1:812204101681:web:87231c8b45da8f97820510",
  measurementId: "G-38P5SBQDWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

// Check authentication - redirect to login if not authenticated
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if user is anonymous (guest)
    if (user.isAnonymous) {
      alert("Guest users cannot submit reports. Please sign up to report issues.");
      signOut(auth);
      window.location.href = 'auth.html';
      return;
    }
    
    currentUser = user;
    console.log("User authenticated:", user.email);
    // Update UI to show user info
    updateUserInfo(user);
  } else {
    // Not logged in - redirect to auth page
    window.location.href = 'auth.html';
  }
});

// -------------------------
// Map Setup - FIXED
// -------------------------
let map;
try {
  map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Fix map display issue
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
} catch (error) {
  console.error("Map initialization error:", error);
  alert("Map failed to load. Please refresh the page.");
}

// -------------------------
// Variables
// -------------------------
let placedMarker = null;
let selectedISP = null;
let selectedNetwork = null;

// Button groups
const statusButtons = ["btn-normal", "btn-slow", "btn-down"];
const networkRadios = Array.from(document.querySelectorAll('input[name="network-type"]'));
const ispRadios = Array.from(document.querySelectorAll('input[name="isp-type"]'));

// -------------------------
// Helper Functions
// -------------------------
function updateUserInfo(user) {
  const userInfoEl = document.querySelector('.header-left');
  if (userInfoEl && !document.getElementById('user-greeting')) {
    const greeting = document.createElement('div');
    greeting.id = 'user-greeting';
    greeting.style.cssText = 'font-size: 0.85rem; opacity: 0.8; margin-left: 12px;';
    greeting.textContent = `👤 ${user.displayName || user.email}`;
    
    userInfoEl.appendChild(greeting);
  }
}

function setElementsDisabled(elements, disabled) {
  elements.forEach(el => {
    if (el) el.disabled = disabled;
  });
}

function setStatusButtonsDisabled(disabled) {
  statusButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = disabled;
  });
}

// Reset state - FIXED
function resetReportingState() {
  console.log("Resetting report state...");
  
  // Remove marker
  if (placedMarker && map) {
    map.removeLayer(placedMarker);
    placedMarker = null;
  }
  
  // Clear selections
  selectedISP = null;
  selectedNetwork = null;

  // Reset all radio buttons
  ispRadios.forEach(r => {
    r.checked = false;
  });
  networkRadios.forEach(r => {
    r.checked = false;
  });

  // Enable ISP selection, disable rest
  setElementsDisabled(ispRadios, false);
  setElementsDisabled(networkRadios, true);
  setStatusButtonsDisabled(true);
  
  console.log("Reset complete!");
}

// Initialize on load
window.addEventListener('load', () => {
  resetReportingState();
});

// -------------------------
// Event Listeners
// -------------------------

// 1. ISP Selection
ispRadios.forEach(radio => {
  radio.addEventListener("change", function () {
    if (this.checked) {
      selectedISP = this.value;
      console.log("ISP selected:", selectedISP);
      
      // Disable ISP radios, enable network radios
      setElementsDisabled(ispRadios, true);
      setElementsDisabled(networkRadios, false);
    }
  });
});

// 2. Network Type Selection
networkRadios.forEach(radio => {
  radio.addEventListener("change", function () {
    if (this.checked) {
      selectedNetwork = this.value;
      console.log("Network selected:", selectedNetwork);
      
      // Disable network radios
      setElementsDisabled(networkRadios, true);
      
      // Enable status buttons if marker is placed
      if (placedMarker) {
        setStatusButtonsDisabled(false);
      }
      
      alert("Now click on the map to place your report location!");
    }
  });
});

// 3. Map Click - Place Marker
map.on("click", function (e) {
  // Check if marker already placed
  if (placedMarker) {
    alert("Marker already placed! Drag it to adjust or click Reset to start over.");
    return;
  }

  // Check selections
  if (!selectedISP) {
    alert("Please select an ISP first!");
    return;
  }
  if (!selectedNetwork) {
    alert("Please select a Network type first!");
    return;
  }

  // Place marker
  placedMarker = L.marker(e.latlng, { 
    draggable: true,
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map);
  
  placedMarker.bindPopup(`<b>${selectedISP} - ${selectedNetwork}</b><br>Drag to adjust, then select status below!`).openPopup();
  
  placedMarker.on("dragend", () => {
    placedMarker.openPopup();
  });
  
  // Enable status buttons
  setStatusButtonsDisabled(false);
  
  console.log("Marker placed at:", e.latlng);
});

// 4. Submit Report - FIXED
function submitStatus(status) {
  if (!placedMarker || !selectedISP || !selectedNetwork) {
    alert("Please complete all steps:\n1. Select ISP\n2. Select Network\n3. Place marker on map");
    return;
  }

  const coords = placedMarker.getLatLng();
  const report = {
    lat: coords.lat,
    lon: coords.lng,
    status: status,
    isp: selectedISP,
    network: selectedNetwork,
    timestamp: Date.now(),
  };

  console.log("Submitting report:", report);

  // Push data to Firebase
  try {
    push(ref(db, "reports"), report)
      .then(() => {
        alert(`✅ Report submitted!\n\nISP: ${selectedISP}\nNetwork: ${selectedNetwork}\nStatus: ${status}`);
        resetReportingState();
      })
      .catch(error => {
        console.error("Firebase error:", error);
        alert("Failed to submit report. Please check your internet connection and try again.");
      });
  } catch (error) {
    console.error("Submit error:", error);
    alert("Error submitting report. Please try again.");
  }
}

// Attach event listeners to buttons
const btnNormal = document.getElementById("btn-normal");
const btnSlow = document.getElementById("btn-slow");
const btnDown = document.getElementById("btn-down");
const btnReset = document.getElementById("btn-reset");

if (btnNormal) btnNormal.onclick = () => submitStatus("Normal");
if (btnSlow) btnSlow.onclick = () => submitStatus("Slow");
if (btnDown) btnDown.onclick = () => submitStatus("Down");
if (btnReset) btnReset.onclick = () => {
  if (confirm("Reset your current report?")) {
    resetReportingState();
  }
};

// Logout button - Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      if (confirm("Are you sure you want to logout?")) {
        try {
          await signOut(auth);
          console.log("Logged out successfully");
          window.location.href = 'auth.html';
        } catch (error) {
          console.error("Logout error:", error);
          alert("Failed to logout. Please try again.");
        }
      }
    };
    console.log("Logout button attached");
  } else {
    console.error("Logout button not found");
  }
});

// -------------------------
// Live Overview Panel - FIXED
// -------------------------
onValue(ref(db, "reports"), snapshot => {
  const data = snapshot.val();
  console.log("Firebase data received:", data);
  
  // Clear old markers (keep user's placed marker)
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer);
    }
  });

  let count = { Normal: 0, Slow: 0, Down: 0 };

  if (data) {
    // Filter reports from last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (let key in data) {
      const r = data[key];
      
      // Skip old reports
      if (r.timestamp < oneDayAgo) continue;
      
      const color = r.status === "Down" ? "red" : 
                    r.status === "Slow" ? "orange" : "green";
      const isp = r.isp ?? "N/A";
      const network = r.network ? `(${r.network})` : "";

      L.circleMarker([r.lat, r.lon], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2
      })
        .bindPopup(
          `<b>ISP:</b> ${isp} ${network}<br>
           <b>Status:</b> ${r.status}<br>
           <b>Time:</b> ${new Date(r.timestamp).toLocaleString()}`
        )
        .addTo(map);

      count[r.status]++;
    }
  }

  // Update stats
  const statNormal = document.getElementById("stat-normal");
  const statSlow = document.getElementById("stat-slow");
  const statDown = document.getElementById("stat-down");
  const statUpdated = document.getElementById("stat-updated");
  
  if (statNormal) statNormal.textContent = count.Normal;
  if (statSlow) statSlow.textContent = count.Slow;
  if (statDown) statDown.textContent = count.Down;
  if (statUpdated) statUpdated.textContent = new Date().toLocaleTimeString();
}, error => {
  console.error("Firebase read error:", error);
});

console.log("Shutdown Watch initialized successfully!");