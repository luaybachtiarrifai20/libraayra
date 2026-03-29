document.addEventListener('DOMContentLoaded', function() {
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

    if (guestElement) {
        if (guestName) {
            const decodedName = decodeURIComponent(guestName.replace(/\+/g, ' ')).trim();
            // Check if name is in the list (case insensitive)
            const isAuthorized = dummyGuests.some(name => name.trim().toLowerCase() === decodedName.toLowerCase());
            
            if (isAuthorized) {
                guestElement.textContent = decodedName;
                generateQRCode(decodedName);
            } else {
                guestElement.textContent = ""; // Clear if not in list
                generateQRCode("");
                console.log("Unauthorized guest: " + decodedName);
            }
        } else {
            // Empty if no URL param
            guestElement.textContent = ""; 
            generateQRCode("");
            
            // Still log test URLs for the user
            console.log("No guest name in URL. Emptying guest name.");
            console.log("Try these links for testing:");
            dummyGuests.forEach(name => {
                const testUrl = window.location.origin + window.location.pathname + "?to=" + encodeURIComponent(name);
                console.log(testUrl);
            });
        }
    }

    // Helper for local development testing
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const testBtn = document.createElement('div');
        testBtn.innerHTML = "🧪 Test Guest Names";
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
        
        let dummyIndex = 0;
        testBtn.onclick = function() {
            const nextName = dummyGuests[dummyIndex % dummyGuests.length];
            if (guestElement) {
                guestElement.textContent = nextName;
                generateQRCode(nextName);
                console.log("Testing dummy name: " + nextName);
            }
            dummyIndex++;
        };
        
        document.body.appendChild(testBtn);
        console.log("Local Dev detected. Floating test button added to bottom-left.");
    }
});
