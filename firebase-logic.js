// Handle RSVP Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('commentform-504761');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
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
    setInterval(loadWishes, 5000); // Auto-refresh every 5 seconds

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
