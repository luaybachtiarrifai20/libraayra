document.addEventListener('DOMContentLoaded', function() {
    window.isGuestAuthorized = false; // Default to unauthorized
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');
    const guestElement = document.getElementById('guest-name');
    
    const qrContainer = document.getElementById('guest-qr-code');
    let qrcode = null;

    function generateQRCode(text) {
        console.log("Generating QR Code for: [" + text + "]");
        if (!qrContainer) {
            console.error("QR Container #guest-qr-code not found!");
            return;
        }
        
        // Clear previous QR code
        qrContainer.innerHTML = "";
        
        if (text && text.trim() !== "") {
            try {
                qrcode = new QRCode(qrContainer, {
                    text: text,
                    width: 200,
                    height: 200,
                    colorDark : "#6B3A19",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
                document.getElementById('qr-instruction').style.display = 'block';
                console.log("QR Code generated successfully.");
            } catch (e) {
                console.error("Error generating QR Code:", e);
                // Fallback to static image on error
                qrContainer.innerHTML = '<img src="./assets/qr_code.png" style="width: 200px; height: 200px;" alt="QR Code">';
            }
        } else {
            // Show the user provided qr_code.png as fallback
            qrContainer.innerHTML = '<img src="./assets/qr_code.png" style="width: 200px; height: 200px;" alt="QR Code">';
            document.getElementById('qr-instruction').style.display = 'none';
            console.log("Empty text, showing fallback QR image.");
        }
    }

    async function checkGuestAuthorization(decodedName) {
        if (!decodedName) return false;
        
        try {
            // Case insensitive check using Firestore where()
            // Note: For true case-insensitivity in Firestore without third-party tools, 
            // we'd typically store a lowercase version. 
            // Here we'll try a simple match first.
            const querySnapshot = await db.collection('guests')
                .where('name', '==', decodedName)
                .get();
            
            if (!querySnapshot.empty) return true;
            
            // Fallback: search all (small list) for case insensitive match
            const allGuests = await db.collection('guests').get();
            let found = false;
            allGuests.forEach(doc => {
                if (doc.data().name.toLowerCase() === decodedName.toLowerCase()) found = true;
            });
            return found;
        } catch (error) {
            console.error("Firestore Auth Error: ", error);
            return false;
        }
    }

    if (guestElement) {
        if (guestName) {
            const decodedName = decodeURIComponent(guestName.replace(/\+/g, ' ')).trim();
            guestElement.textContent = "Checking...";
            
            checkGuestAuthorization(decodedName).then(isAuthorized => {
                window.isGuestAuthorized = isAuthorized;
                if (isAuthorized) {
                    guestElement.textContent = decodedName;
                    generateQRCode(decodedName);
                } else {
                    guestElement.textContent = ""; // Clear if not in list
                    generateQRCode("");
                    console.log("Unauthorized guest: " + decodedName);
                }
                // Trigger an event so other scripts know authorization is complete
                document.dispatchEvent(new CustomEvent('guestAuthCompleted', { detail: { authorized: isAuthorized } }));
            });
        } else {
            // Empty if no URL param
            guestElement.textContent = ""; 
            generateQRCode("");
        }
    }

    // Helper for local development testing
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const testBtn = document.createElement('div');
        testBtn.innerHTML = "🧪 Test Firebase Guests";
        testBtn.style.position = 'fixed';
        testBtn.style.bottom = '10px';
        testBtn.style.left = '10px';
        testBtn.style.background = '#6B3A19';
        testBtn.style.color = '#fff';
        testBtn.style.padding = '8px 12px';
        testBtn.style.borderRadius = '5px';
        testBtn.style.fontSize = '12px';
        testBtn.style.cursor = 'pointer';
        testBtn.style.zIndex = '100000';
        testBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        testBtn.onclick = async function() {
            try {
                const snapshot = await db.collection('guests').limit(10).get();
                if (snapshot.empty) {
                    alert("Firebase guest list is empty. Please run: seedGuestsToFirebase() in console.");
                    return;
                }
                const names = snapshot.docs.map(doc => doc.data().name);
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
        console.log("Local Dev detected. Floating test button updated for Firebase.");
    }
});
