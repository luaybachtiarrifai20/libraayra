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
    // Modal Style for Popups to keep them centered and fixed
    const style = document.createElement('style');
    style.innerHTML = `
        #popup-ucapan, #popup-gift, #popup-data-mempelai, #popup-data-acara, #popup-love-story, #popup-galeri, #popup-dresscode {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: rgba(0,0,0,0) !important;
            display: none;
            align-items: center;
            justify-content: center;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            transition: opacity 0.5s ease;
        }
        #popup-ucapan.popup-show, #popup-gift.popup-show, #popup-data-mempelai.popup-show, #popup-data-acara.popup-show, #popup-love-story.popup-show, #popup-galeri.popup-show, #popup-dresscode.popup-show {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        #inner-popup-ucapan, #inner-popup-gift, #inner-popup-data-mempelai, #inner-popup-data-acara, #inner-popup-love-story, #inner-popup-galeri, #inner-popup-dresscode {
            width: 90% !important;
            max-width: 350px !important;
            height: auto !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 20px !important;
            position: relative !important;
            padding: 0 !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
            border: 2px solid #ddd;
        }

        /* Interactive Menu Relocated Buttons */
        .elementor-element-light-toggle, .elementor-element-music-toggle {
            position: fixed !important;
            bottom: 30px !important;
            z-index: 10000 !important;
            width: auto !important;
        }

        .elementor-element-light-toggle {
            right: 20px !important;
            bottom: 85px !important;
        }

        .elementor-element-music-toggle {
            right: 20px !important;
            bottom: 25px !important;
        }
        
        #neonbtnon, #neonbtnoff, #unmute-sound, #mute-sound {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            width: 45px !important;
            height: 45px !important;
            border-radius: 50% !important;
            background: rgba(255, 255, 255, 0.95) !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 10001 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            border: 2px solid #BC140B !important;
            display: none; /* JS will toggle flex/none */
        }

        #neonbtnon .elementor-icon, #neonbtnoff .elementor-icon, #unmute-sound .elementor-icon, #mute-sound .elementor-icon {
            font-size: 20px !important;
            color: #BC140B !important;
            line-height: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        #unmute-sound .elementor-icon, #mute-sound .elementor-icon {
            width: 100% !important;
            height: 100% !important;
            background: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
        }
        .btnclose {
            cursor: pointer !important;
        }
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
        /* Lock background scroll */
        body.popup-active {
            overflow: hidden !important;
            height: 100vh !important;
        }
    `;
    document.head.appendChild(style);

    const openPopup = (popupId) => {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'flex';
            popup.classList.remove('popup-hide');
            popup.classList.add('popup-show');
            document.body.classList.add('popup-active');
        }
    };

    const closePopup = (popup) => {
        if (popup) {
            popup.classList.remove('popup-show');
            popup.classList.add('popup-hide');
            setTimeout(() => {
                popup.style.display = 'none';
                if (!document.querySelector('.popup-show')) {
                    document.body.classList.remove('popup-active');
                }
            }, 500);
        }
    };

    // Handle all Close Buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btnclose')) {
            const popup = e.target.closest('#popup-ucapan') || 
                          e.target.closest('#popup-gift') || 
                          e.target.closest('#popup-info') || 
                          e.target.closest('#popup-data-mempelai') || 
                          e.target.closest('#popup-data-acara') || 
                          e.target.closest('#popup-love-story') || 
                          e.target.closest('#popup-galeri') || 
                          e.target.closest('#popup-dresscode');
            if (popup) {
                closePopup(popup);
            }
        }
    });

    const btnLihatInMenu = document.getElementById('btnucapan');
    if (btnLihatInMenu) {
        btnLihatInMenu.addEventListener('click', (e) => {
             e.preventDefault();
             openPopup('popup-ucapan');
             loadWishes();
        });
    }

    const btnGiftInMenu = document.getElementById('btngift');
    const btnGiftOnPage = document.getElementById('btn_gift');
    if (btnGiftInMenu) {
        btnGiftInMenu.addEventListener('click', (e) => {
            e.preventDefault();
            openPopup('popup-gift');
        });
    }
    if (btnGiftOnPage) {
        btnGiftOnPage.addEventListener('click', (e) => {
            e.preventDefault();
            const secGift = document.getElementById('sec_gift');
            if (secGift) {
                secGift.scrollIntoView({ behavior: 'smooth' });
                // If it's hidden by CSS, we might need to show it
                secGift.style.display = 'block';
            }
        });
    }

    const btnLihatOnPage = document.getElementById('btn-lihat-ucapan');
    if (btnLihatOnPage) {
        btnLihatOnPage.addEventListener('click', (e) => {
            e.preventDefault();
            openPopup('popup-ucapan');
            loadWishes();
        });
    }

    // Interactive Section Triggers (Using data-id from Elementor)
    const interactiveTriggers = {
        '2338873a': 'popup-data-mempelai',
        '6ff53af3': 'popup-data-acara',
        '12c13d7e': 'popup-dresscode',
        '23a230b2': 'popup-love-story',
        '2395e1e2': 'popup-galeri',
        '5de7e69e': 'popup-gift',
        '6c616cfa': 'popup-ucapan'
    };

    Object.keys(interactiveTriggers).forEach(id => {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const popupId = interactiveTriggers[id];
                openPopup(popupId);
                if (popupId === 'popup-ucapan') loadWishes();
            });
        }
    });

    // Light Toggle Logic
    const neonOn = document.getElementById('neonbtnon');
    const neonOff = document.getElementById('neonbtnoff');
    if (neonOn && neonOff) {
        neonOn.style.display = 'flex';
        neonOff.style.display = 'none';

        neonOn.addEventListener('click', () => {
            neonOn.style.setProperty('display', 'none', 'important');
            neonOff.style.setProperty('display', 'flex', 'important');
        });
        neonOff.addEventListener('click', () => {
            neonOff.style.setProperty('display', 'none', 'important');
            neonOn.style.setProperty('display', 'flex', 'important');
        });
    }

    // Music Toggle logic is already handled by existing script using these IDs
    // but we ensure they are displayed correctly
    // Music Toggle logic
    const unmuteBtn = document.getElementById('unmute-sound');
    const muteBtn = document.getElementById('mute-sound');
    const song = document.getElementById('song');

    // Initial State: LIGHT ON, MUSIC ON
    if (neonOn && neonOff) {
        neonOn.style.setProperty('display', 'flex', 'important');
        neonOff.style.setProperty('display', 'none', 'important');
    }

    const updateMusicUI = () => {
        if (!song || !unmuteBtn || !muteBtn) return;
        // The user wants it to look "ON" (playing) by default
        // We show muteBtn (disc) by default if it's not explicitly paused
        if (song.paused) {
            unmuteBtn.style.setProperty('display', 'flex', 'important');
            muteBtn.style.setProperty('display', 'none', 'important');
        } else {
            unmuteBtn.style.setProperty('display', 'none', 'important');
            muteBtn.style.setProperty('display', 'flex', 'important');
        }
    };

    // Force initial "ON" appearance for music if song exists
    if (unmuteBtn && muteBtn) {
        unmuteBtn.style.setProperty('display', 'none', 'important');
        muteBtn.style.setProperty('display', 'flex', 'important');
    }

    const forceMusicUI = (isPlaying) => {
        if (!unmuteBtn || !muteBtn) return;
        if (isPlaying) {
            unmuteBtn.style.setProperty('display', 'none', 'important');
            muteBtn.style.setProperty('display', 'flex', 'important');
        } else {
            unmuteBtn.style.setProperty('display', 'flex', 'important');
            muteBtn.style.setProperty('display', 'none', 'important');
        }
    };

    if (unmuteBtn && muteBtn && song) {
        unmuteBtn.addEventListener('click', () => {
            isMutedByUser = false; 
            if (typeof playAudio === 'function') {
                playAudio(); // This handles play() AND volume fade-in
            } else {
                song.play();
            }
            forceMusicUI(true);
        });
        muteBtn.addEventListener('click', () => {
            isMutedByUser = true;
            song.pause();
            if (typeof pauseAudio === 'function') pauseAudio(); // This handles volume fade-out
            forceMusicUI(false);
        });

        // Initialize UI based on actual state
        updateMusicUI();
    }

    loadWishes();
    setInterval(loadWishes, 10000); // Auto-refresh every 10 seconds

    // Listen for auth completion to refresh wishes
    document.addEventListener('guestAuthCompleted', function(e) {
        loadWishes();
    });

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
    setTimeout(findAndHideBusted, 2000);
});
