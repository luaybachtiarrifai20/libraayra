document.addEventListener("DOMContentLoaded", function () {
  window.isGuestAuthorized = false; // Default to unauthorized
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get("to");
  const guestElement = document.getElementById("guest-name");

  const qrContainer = document.getElementById("guest-qr-code");
  let qrcode = null;

  function generateQRCode(text) {
    if (!qrContainer) {
      console.error("QR Container #guest-qr-code not found!");
      return;
    }

    // Clear previous QR code
    qrContainer.innerHTML = "";

    if (text && text.trim() !== "") {
      try {
        // Sanitize for QR library: remove non-ASCII characters that might cause overflow/encoding issues
        const cleanText = text.replace(/[^\x00-\x7F]/g, "").trim() || "Guest";
        console.log(
          "Generating QR Code for sanitized text: [" +
            cleanText +
            "] (Original: [" +
            text +
            "])",
        );

        // Use a fresh instance each time
        new QRCode(qrContainer, {
          text: cleanText,
          width: 200,
          height: 200,
          colorDark: "#6B3A19",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.L, // L has the highest data capacity
        });

        document.getElementById("qr-instruction").style.display = "block";
        console.log("QR Code generated successfully.");
      } catch (e) {
        console.error("Error generating QR Code:", e);
        // Fallback to static image on error
        qrContainer.innerHTML =
          '<img src="./assets/qr_code.png" style="width: 200px; height: 200px;" alt="QR Code">';
        document.getElementById("qr-instruction").style.display = "none";
      }
    } else {
      // Show the user provided qr_code.png as fallback
      qrContainer.innerHTML =
        '<img src="./assets/qr_code.png" style="width: 200px; height: 200px;" alt="QR Code">';
      document.getElementById("qr-instruction").style.display = "none";
      console.log("Empty text, showing fallback QR image.");
    }
  }

  function normalizeString(str) {
    if (!str) return "";
    // Replace curly quotes with straight quotes for consistent matching
    return str
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .toLowerCase()
      .trim();
  }

  async function getGuestData(idOrName) {
    if (!idOrName) return null;

    const normalizedInput = normalizeString(idOrName);
    console.log(
      "Looking up guest for: [" +
        idOrName +
        "] (Normalized: [" +
        normalizedInput +
        "])",
    );

    try {
      // 1. Try fetching by Document ID (Check if input looks like an ID)
      if (idOrName.length > 15) {
        // IDs are usually long
        const doc = await db.collection("guests").doc(idOrName).get();
        if (doc.exists) {
          console.log("Found guest by ID: " + idOrName);
          return doc.data();
        }
      }

      // 2. Try simple match on 'name' field
      const querySnapshot = await db
        .collection("guests")
        .where("name", "==", idOrName)
        .get();

      if (!querySnapshot.empty) {
        console.log("Found guest by exact name match: " + idOrName);
        return querySnapshot.docs[0].data();
      }

      // 3. Fallback: search all for normalized case insensitive match
      const allGuests = await db.collection("guests").get();
      let guestData = null;
      allGuests.forEach((doc) => {
        const data = doc.data();
        if (data.name && normalizeString(data.name) === normalizedInput) {
          guestData = data;
        }
      });

      if (guestData)
        console.log("Found guest by normalized name match: " + guestData.name);
      return guestData;
    } catch (error) {
      console.error("Firestore Auth Error: ", error);
      return null;
    }
  }

  if (guestElement) {
    if (guestName) {
      const decodedName = decodeURIComponent(
        guestName.replace(/\+/g, " "),
      ).trim();
      guestElement.textContent = "Checking...";

      getGuestData(decodedName).then((guestData) => {
        const isAuthorized = !!guestData;
        window.isGuestAuthorized = isAuthorized;
        if (isAuthorized) {
          const actualName = guestData.name || decodedName;
          guestElement.textContent = actualName;
          generateQRCode(actualName);
        } else {
          guestElement.textContent = ""; // Clear if not in list
          generateQRCode("");
          console.log("Unauthorized guest: " + decodedName);
        }
        // Trigger an event so other scripts know authorization is complete
        document.dispatchEvent(
          new CustomEvent("guestAuthCompleted", {
            detail: { authorized: isAuthorized },
          }),
        );
      });
    } else {
      // Empty if no URL param
      guestElement.textContent = "";
      generateQRCode("");
    }
  }

  // Helper for local development testing
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    const testBtn = document.createElement("div");
    testBtn.innerHTML = "🧪 Test Firebase Guests";
    testBtn.style.position = "fixed";
    testBtn.style.bottom = "10px";
    testBtn.style.left = "10px";
    testBtn.style.background = "#6B3A19";
    testBtn.style.color = "#fff";
    testBtn.style.padding = "8px 12px";
    testBtn.style.borderRadius = "5px";
    testBtn.style.fontSize = "12px";
    testBtn.style.cursor = "pointer";
    testBtn.style.zIndex = "100000";
    testBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";

    testBtn.onclick = async function () {
      try {
        const snapshot = await db.collection("guests").limit(10).get();
        if (snapshot.empty) {
          alert(
            "Firebase guest list is empty. Please run: seedGuestsToFirebase() in console.",
          );
          return;
        }
        const names = snapshot.docs.map((doc) => doc.data().name);
        const randomName = names[Math.floor(Math.random() * names.length)];

        if (guestElement) {
          guestElement.textContent = randomName;
          generateQRCode(randomName);
          console.log("Testing Firebase guest: " + randomName);
        }
      } catch (e) {
        console.error("Test Error:", e);
        alert("Error fetching test names. Check console.");
      }
    };

    document.body.appendChild(testBtn);
    console.log(
      "Local Dev detected. Floating test button updated for Firebase.",
    );
  }
});
