// Handle RSVP Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('commentform-504761');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!window.isGuestAuthorized) {
                alert('Minta maaf, fitur RSVP dan Ucapan hanya tersedia untuk tamu undangan yang terdaftar.');
                return;
            }
            const name = document.getElementById('author').value;
            const wish = document.getElementById('saic-textarea-504761').value;
            const attendance = document.getElementById('attendance').value;
            
            if (!name || !wish) {
                alert('Nama dan Ucapan harus diisi!');
                return;
            }

            try {
                await db.collection('responses').add({
                    name: name,
                    wish: wish,
                    attendance: attendance,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                alert('Terima kasih! Ucapan Anda telah terkirim.');
                form.reset();
                loadWishes(); // Refresh the list
            } catch (error) {
                console.error("Firebase Error: ", error);
                alert('Gagal mengirim ucapan: ' + error.message + '\n\nPastikan Firestore Rules Anda di Firebase Console sudah di-set ke Test Mode atau mengizinkan Read/Write.');
            }
        });
    }

    // Handle Attendance Buttons (Sync with hidden input)
    const btnPresent = document.getElementById('optPresent');
    const btnNotPresent = document.getElementById('optNotpresent');
    const inputAttendance = document.getElementById('attendance');

    if (btnPresent && btnNotPresent && inputAttendance) {
        btnPresent.addEventListener('click', () => {
            inputAttendance.value = 'present';
            btnPresent.classList.add('active');
            btnNotPresent.classList.remove('active');
        });
        btnNotPresent.addEventListener('click', () => {
            inputAttendance.value = 'notpresent';
            btnNotPresent.classList.add('active');
            btnPresent.classList.remove('active');
        });
    }

    // Load Wishes from Firestore
    async function loadWishes() {
        const container = document.getElementById('saic-container-comment-504761');
        if (!container) return;

        if (!window.isGuestAuthorized) {
            container.innerHTML = '<li class="saic-item-comment" style="text-align:center; color:#6B3A19;"><strong>Khusus Undangan</strong><br>Fitur ini hanya dapat diakses oleh tamu yang terdaftar.</li>';
            // Also hide the form if unauthorized
            const formContainer = document.getElementById('commentform-504761');
            if (formContainer) {
                formContainer.style.opacity = '0.5';
                formContainer.style.pointerEvents = 'none'; // Disable interaction
                const submitBtn = formContainer.querySelector('input[type="submit"]');
                if (submitBtn) submitBtn.style.display = 'none';
            }
            return;
        }

        try {
            const querySnapshot = await db.collection('responses')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            
            container.innerHTML = '';
            if (querySnapshot.empty) {
                container.innerHTML = '<li class="saic-item-comment" style="text-align:center;">Belum ada ucapan. Jadilah yang pertama!</li>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                li.className = 'saic-item-comment';
                li.innerHTML = `
                    <div class="saic-comment-content">
                        <strong>${data.name}</strong> (${data.attendance === 'present' ? 'Hadir' : 'Tidak Hadir'})
                        <p>${data.wish}</p>
                    </div>
                `;
                container.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading wishes: ", error);
        }
    }

    // Make wishes list always visible inside the popup
    const wishesContainer = document.getElementById('saic-container-comment-504761');
    if (wishesContainer) {
        wishesContainer.style.display = 'block';
        wishesContainer.style.maxHeight = '400px';
        wishesContainer.style.overflowY = 'auto';
        wishesContainer.style.padding = '15px';
        wishesContainer.style.background = '#fff';
        wishesContainer.style.border = '1px solid #eee';
        wishesContainer.style.borderRadius = '12px';
        wishesContainer.style.marginTop = '20px';
        wishesContainer.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
        
        // Ensure parent container can scroll
        const innerPopup = document.getElementById('inner-popup-ucapan');
        if (innerPopup) {
            innerPopup.style.maxHeight = '90vh';
            innerPopup.style.overflowY = 'auto';
            innerPopup.style.paddingBottom = '50px';
        }
    }

    // Ensure buttons correctly trigger the popup (custom override if needed)
    // Most templates use an ID or data-attribute for popup triggers.
    // If the "Lihat Ucapan" button doesn't open the popup naturally, we can help it.
    const openPopup = () => {
        const popup = document.getElementById('popup-ucapan');
        if (popup) {
            popup.style.display = 'block'; // Or whatever class/style the template uses
            popup.classList.add('active'); // Example
        }
    };

    const btnLihatInPopup = document.getElementById('btn-lihat-ucapan');
    if (btnLihatInPopup) {
        // Since it's already in the popup, we can just make it hidden or use it for "Refresh"
        btnLihatInPopup.style.display = 'none'; 
    }

    const btnLihatInMenu = document.getElementById('btnucapan');
    if (btnLihatInMenu) {
        btnLihatInMenu.addEventListener('click', () => {
             loadWishes();
        });
    }

    // Add some basic styling for the wishes items via JS to avoid CSS file edits
    const style = document.createElement('style');
    style.innerHTML = `
        .saic-item-comment {
            list-style: none;
            margin-bottom: 15px;
            padding: 10px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
            color: #333;
        }
        .saic-item-comment strong {
            color: #6B3A19;
            display: block;
            margin-bottom: 4px;
        }
        .saic-item-comment p {
            margin: 0;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);

    loadWishes();
    setInterval(loadWishes, 10000); // Auto-refresh every 10 seconds (optimized)

    // Listen for auth completion to refresh wishes
    document.addEventListener('guestAuthCompleted', function(e) {
        loadWishes();
    });

    // --- Guest Migration & Seeding ---
    
    // Function to seed guests from the old guests.js to Firestore
    window.seedGuestsToFirebase = async function() {
        if (typeof dummyGuests === 'undefined') {
            alert('Gagal: guests.js tidak ditemukan atau sudah dihapus.');
            return;
        }
        
        console.log("Seeding guests...");
        const batch = db.batch();
        
        for (const guestName of dummyGuests) {
            const docRef = db.collection('guests').doc(guestName.toLowerCase().replace(/\s+/g, '-'));
            batch.set(docRef, { name: guestName });
        }
        
        try {
            await batch.commit();
            alert('Sukses! Semua nama dari guests.js telah dipindah ke Firebase.');
            seedBtn.style.display = 'none'; // Hide after success
        } catch (error) {
            console.error("Error seeding guests: ", error);
            alert('Gagal memindah nama: ' + error.message);
        }
    };

    // Add a temporary seeding button to the UI
    const seedBtn = document.createElement('div');
    seedBtn.innerHTML = "🚀 Pindah Nama Guest ke Firebase";
    seedBtn.style.position = 'fixed';
    seedBtn.style.bottom = '50px';
    seedBtn.style.left = '10px';
    seedBtn.style.background = '#01928B';
    seedBtn.style.color = '#fff';
    seedBtn.style.padding = '8px 12px';
    seedBtn.style.borderRadius = '5px';
    seedBtn.style.fontSize = '12px';
    seedBtn.style.cursor = 'pointer';
    seedBtn.style.zIndex = '100000';
    seedBtn.onclick = seedGuestsToFirebase;
    document.body.appendChild(seedBtn);

    // Final fix: Hide the unwanted "Busted!" text if it appears
    const findAndHideBusted = () => {
        const walkers = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while(node = walkers.nextNode()) {
            if (node.textContent.includes('Busted!')) {
                node.parentElement.style.display = 'none';
            }
        }
    };
    findAndHideBusted();
    setTimeout(findAndHideBusted, 2000); // Run again after a delay to catch late-loading scripts
});
