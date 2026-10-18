import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const status = document.getElementById("fb-status");

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  await getDoc(doc(db, "test", "ping"));
  status.textContent = "Firebase konekte ✅";
} catch (e) {
  if (e.code === "permission-denied") {
    status.textContent = "Firebase konekte ✅ (règ sekirite aktif)";
  } else {
    status.textContent = "Erè Firebase: " + (e.code || e.message);
  }
      }
