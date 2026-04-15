/* =========================================
   SUPABASE INTEGRATION (CLOUD MULTI-TENANCY)
   ========================================= */
const SUPABASE_URL = 'https://eaklrdnwodbyzagfitqb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2xyZG53b2RieXphZ2ZpdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc3NDUsImV4cCI6MjA5MTUzMzc0NX0.Utl5GGT4A9DdTc30WzaJZnrggBCuHTthmCdeXpOcD6Q';

let _supaClient = null;
let CLIENT_ID = 'demo-client';
let globalCloudData = null;
let _localWishesCache = null; // Cache lokal untuk wishes agar tidak baca dari override getter yang stale

document.addEventListener('DOMContentLoaded', async () => {

    // --- FASE 1: Coba hubungkan ke Supabase (jika SDK tersedia) ---
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            _supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const urlParams = new URLSearchParams(window.location.search);
            CLIENT_ID = urlParams.get('id') || 'demo-client';
            console.log(`[SUPABASE] Terhubung. Memuat data klien: ${CLIENT_ID}`);

            // Ambil data utama & ucapan secara PARALEL
            const [invRes, wishesRes] = await Promise.all([
                _supaClient.from('wedding_invitations').select('*').eq('client_id', CLIENT_ID).maybeSingle(),
                _supaClient.from('wishes').select('*').eq('client_id', CLIENT_ID).order('created_at', { ascending: false })
            ]);

            const data = invRes.data;
            const error = invRes.error;
            const wishesData = wishesRes.data;

            if (!error && data) {
                globalCloudData = data;
                console.log('[SUPABASE] Data klien berhasil dimuat.');

                // Pasang jembatan baca: localStorage.getItem -> Cloud Data
                const _origGet = localStorage.getItem.bind(localStorage);
                localStorage.getItem = function(k) {
                    if (k === 'wedding_settings' && globalCloudData.settings) return JSON.stringify(globalCloudData.settings);
                    if (k === 'wedding_guests' && globalCloudData.guests) return JSON.stringify(globalCloudData.guests);
                    if (k === 'wedding_gallery' && globalCloudData.gallery) return JSON.stringify(globalCloudData.gallery);
                    if (k === 'wedding_story' && globalCloudData.story) return JSON.stringify(globalCloudData.story);
                    
                    // Khusus Wishes: Gunakan cache lokal jika sudah ada, fallback ke cloud data
                    if (k === 'wedding_wishes') {
                        if (_localWishesCache !== null) {
                            return JSON.stringify(_localWishesCache);
                        }
                        if (wishesData) {
                            _localWishesCache = wishesData.map(w => ({
                                id: w.id,
                                name: w.name,
                                attendance: w.attendance,
                                guests: w.guest_count || 1,
                                message: w.message,
                                timestamp: w.created_at
                            }));
                            return JSON.stringify(_localWishesCache);
                        }
                    }
                    return _origGet(k);
                };
            } else {
                console.warn('[SUPABASE] Data klien tidak ditemukan. Mode default aktif.');
            }
        } else {
            console.warn('[MODE LOKAL] Supabase SDK tidak tersedia. Menggunakan data lokal.');
        }
    } catch (e) {
        console.warn('[SUPABASE] Gagal inisialisasi, lanjut mode lokal:', e.message);
    }

    // --- FASE 2: SELALU jalankan semua fungsi UI ---
    applyDynamicSettings();
    loadDynamicGallery();
    initLoveStory();
    initCover();
    initScrollReveal();
    initRSVP();
    loadWishes();
    initMusic();
    initGuestName();
    initCountdown();
    initLightbox();
    createRoyalSparkles();
});

async function pushWishToCloud(newWish) {
    if (!_supaClient) return;
    try {
        await _supaClient.from('wishes').insert({
            client_id: CLIENT_ID,
            name: newWish.name,
            attendance: newWish.attendance,
            guest_count: newWish.guests || 1,
            message: newWish.message
        });
        console.log('[SUPABASE] Ucapan berhasil dikirim.');
    } catch (e) {
        console.error('[SUPABASE] Gagal sync wish:', e);
    }
}


/* -----------------------------------------
   1. EXCLUSIVE COVER INTERACTION
   ----------------------------------------- */
function initCover() {
    const btn = document.getElementById('openInvitation');
    const cover = document.getElementById('cover');
    const mainContent = document.getElementById('mainContent');
    const musicBtn = document.getElementById('musicToggle');

    if (!btn || !cover) return;

    btn.addEventListener('click', () => {
        // Slow fade out for luxury feel
        cover.style.opacity = '0';
        document.body.classList.remove('no-scroll');

        // Show main content & music btn
        setTimeout(() => {
            cover.style.display = 'none';
            mainContent.classList.add('visible');
            musicBtn.classList.add('visible');
        }, 1500);

        playMusic();
        window.scrollTo(0, 0);
    });
}

/* -----------------------------------------
   2. ELEGANT SCROLL REVEAL
   ----------------------------------------- */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Reveal only once for clean experience
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach((el) => observer.observe(el));
}

/* -----------------------------------------
   3. GUEST NAME PREFILL
   ----------------------------------------- */
function initGuestName() {
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to');
    
    if (guestName) {
        const decoded = decodeURIComponent(guestName.replace(/\+/g, ' '));
        const el = document.getElementById('guestName');
        const rsvpInput = document.getElementById('rsvpName');
        
        if (el) el.textContent = decoded;
        if (rsvpInput) rsvpInput.value = decoded;
    }
}

/* -----------------------------------------
   4. RSVP & WISHES (NO SPARKLES, JUST CLEAN UI)
   ----------------------------------------- */
function initRSVP() {
    const form = document.getElementById('rsvpForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('rsvpName').value.trim();
        const attendance = document.getElementById('rsvpAttendance').value;
        const message = document.getElementById('rsvpMessage').value.trim();

        if (!name || !attendance) {
            showToast('Silakan lengkapi formulir terlebih dahulu.');
            return;
        }

        // Disable tombol supaya tidak double-submit
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span style="opacity:0.7">Mengirim...</span>';
        }

        const wish = { id: Date.now(), name, attendance, guests: 1, message, timestamp: new Date().toISOString() };

        // Update cache lokal LANGSUNG (instant UI feedback)
        if (_localWishesCache === null) {
            try { _localWishesCache = JSON.parse(localStorage.getItem('wedding_wishes')) || []; }
            catch { _localWishesCache = []; }
        }
        _localWishesCache.unshift(wish);

        // Reset form segera agar user tahu input diterima
        form.reset();

        // Update UI wishes wall segera (tidak menunggu cloud)
        const wall = document.getElementById('wishesWall');
        if (wall) {
            wall.style.opacity = '0';
            setTimeout(() => {
                loadWishes();
                wall.style.transition = 'opacity 0.8s ease';
                wall.style.opacity = '1';
            }, 300);
        }

        showToast('Terima kasih. Pesan Anda telah kami terima.');

        // Push ke cloud di background (tidak blocking UI)
        try {
            await pushWishToCloud(wish);
        } catch (err) {
            console.warn('[RSVP] Cloud push gagal, data tetap tersimpan lokal:', err);
        }

        // Restore tombol
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

function loadWishes() {
    const wall = document.getElementById('wishesWall');
    if (!wall) return;

    // Prioritas: cache lokal > localStorage (yang sudah di-override ke cloud)
    let wishes;
    if (_localWishesCache !== null) {
        wishes = _localWishesCache;
    } else {
        try { wishes = JSON.parse(localStorage.getItem('wedding_wishes')) || []; }
        catch { wishes = []; }
    }
    
    if (wishes.length === 0) {
        wall.innerHTML = '';
        return;
    }

    // Batasi render ke 50 wishes terbaru untuk performa
    const displayWishes = wishes.slice(0, 50);

    wall.innerHTML = displayWishes.map(w => `
        <div class="wish-card">
            <div class="wish-header">
                <span class="wish-name">${escapeHtml(w.name)}</span>
                <span class="wish-badge">${w.attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</span>
            </div>
            <p class="wish-msg">${escapeHtml(w.message || '')}</p>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* -----------------------------------------
   5. MUSIC PLAYER
   ----------------------------------------- */
let isPlaying = false;
function playMusic() {
    const audio = document.getElementById('bgMusic');
    if (!audio) return;
    
    audio.play().then(() => {
        isPlaying = true;
    }).catch(() => { isPlaying = false; });
}

function initMusic() {
    const btn = document.getElementById('musicToggle');
    const audio = document.getElementById('bgMusic');
    
    if (!btn || !audio) return;

    btn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            // Stop rotation if there was any (omitted for clean luxury UI)
        } else {
            audio.play().then(() => {
                isPlaying = true;
            }).catch(()=>{});
        }
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

/* -----------------------------------------
   6. DYNAMIC DASHBOARD INTEGRATION
   ----------------------------------------- */
function applyDynamicSettings() {
    let settings;
    try { settings = JSON.parse(localStorage.getItem('wedding_settings')); }
    catch { settings = null; }
    if (!settings) return;

    const groomFirst = (settings.groomName || '').split(/[,\s]/)[0] || 'Arya';
    const brideFirst = (settings.brideName || '').split(/[,\s]/)[0] || 'Kiara';
    const coupleShort = `${groomFirst} & ${brideFirst}`;
    const groomInit = groomFirst.charAt(0);
    const brideInit = brideFirst.charAt(0);

    // Cover & Footer
    document.querySelectorAll('.monogram-crest').forEach(el => {
        el.innerHTML = `<h1 class="cover-names">${groomInit}<span class="mono-amp">&amp;</span>${brideInit}</h1><div class="crest-ring"></div>`;
    });
    document.querySelectorAll('.footer-names').forEach(el => el.textContent = coupleShort);

    // Hero
    const heroFullName = document.querySelector('.hero-full-names');
    if (heroFullName) {
        heroFullName.innerHTML = `${groomFirst}<br><span class="hero-ampersand">&amp;</span><br>${brideFirst}`;
    }

    // Dates
    if (settings.akadDate) {
        const d = new Date(settings.akadDate);
        const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        document.querySelectorAll('.hero-date').forEach(el => el.textContent = dateStr);
        document.querySelectorAll('.event-day').forEach(el => el.textContent = dateStr);
    }

    // Couple Section
    const coupleCards = document.querySelectorAll('.couple-card');
    if (coupleCards[0] && settings.groomName) {
        coupleCards[0].querySelector('h3').textContent = settings.groomName;
        coupleCards[0].querySelector('.couple-desc').innerHTML = `${settings.groomOrder || 'Putra dari'}<br>${settings.groomFather || ''} & ${settings.groomMother || ''}`;
        const photo = coupleCards[0].querySelector('.couple-photo-frame img');
        if (photo && settings.groomPhoto) photo.src = settings.groomPhoto;
    }
    if (coupleCards[1] && settings.brideName) {
        coupleCards[1].querySelector('h3').textContent = settings.brideName;
        coupleCards[1].querySelector('.couple-desc').innerHTML = `${settings.brideOrder || 'Putri dari'}<br>${settings.brideFather || ''} & ${settings.brideMother || ''}`;
        const photo = coupleCards[1].querySelector('.couple-photo-frame img');
        if (photo && settings.bridePhoto) photo.src = settings.bridePhoto;
    }

    // Event Section
    const eventBoxes = document.querySelectorAll('.event-box');
    if (eventBoxes[0]) {
        if (settings.akadTime) eventBoxes[0].querySelector('.event-time').textContent = settings.akadTime;
        if (settings.akadVenue) eventBoxes[0].querySelector('.event-location').innerHTML = `${settings.akadVenue}<br>${settings.akadAddress ? settings.akadAddress.replace(/, /g, '<br>') : ''}`;
        if (settings.akadMap) eventBoxes[0].querySelector('.btn-luxury-outline').href = settings.akadMap;
    }
    if (eventBoxes[1]) {
        if (settings.resepsiTime) eventBoxes[1].querySelector('.event-time').textContent = settings.resepsiTime;
        if (settings.resepsiVenue) eventBoxes[1].querySelector('.event-location').innerHTML = `${settings.resepsiVenue}<br>${settings.resepsiAddress ? settings.resepsiAddress.replace(/, /g, '<br>') : ''}`;
        if (settings.resepsiMap) eventBoxes[1].querySelector('.btn-luxury-outline').href = settings.resepsiMap;
    }

    // Background Music
    if (settings.musicUrl && settings.musicUrl.trim() !== '') {
        const audioEl = document.getElementById('bgMusic');
        if (audioEl) {
            let finalUrl = settings.musicUrl.trim();
            
            // Auto Converter: Google Drive Raw Link to Direct Stream Link
            if (finalUrl.includes('drive.google.com/file/d/')) {
                const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    finalUrl = `https://docs.google.com/uc?export=download&id=${match[1]}`;
                }
            } 
            // Auto Converter: Dropbox Link to Direct Stream Link
            else if (finalUrl.includes('dropbox.com')) {
                // Hapus dl=0 dan ganti ke raw=1 (Force Streamable File)
                finalUrl = finalUrl.replace('dl=0', 'raw=1');
                // Alternatif aman: replace domain utama ke content server
                finalUrl = finalUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
            }

            // Fix HTML5 Audio Bug: Set src directly to parent instead of <source>
            audioEl.src = finalUrl;
            audioEl.load();
        }
    }

    // Couple IG
    const coupleIGs = document.querySelectorAll('.couple-ig');
    if (coupleIGs[0] && settings.groomIg) coupleIGs[0].textContent = settings.groomIg;
    if (coupleIGs[1] && settings.brideIg) coupleIGs[1].textContent = settings.brideIg;

    // Quote
    const blockquote = document.querySelector('.luxury-quote');
    if (blockquote && settings.quoteText) blockquote.textContent = `"${settings.quoteText}"`;
    const cite = document.querySelector('.luxury-cite');
    if (cite && settings.quoteSource) cite.textContent = `— ${settings.quoteSource}`;

    // Hashtag
    const hashtag = document.querySelector('.footer-hashtag');
    if (hashtag && settings.hashtag) hashtag.textContent = settings.hashtag;

    // Gifts
    const giftBoxes = document.querySelectorAll('.gift-box');
    if (giftBoxes[0]) {
        if (settings.bank1Name) giftBoxes[0].querySelector('.gift-bank').textContent = settings.bank1Name;
        if (settings.bank1Number) {
            giftBoxes[0].querySelector('.gift-number').textContent = settings.bank1Number;
            giftBoxes[0].querySelector('.copy-btn').setAttribute('data-copy', settings.bank1Number);
        }
        if (settings.bank1Holder) giftBoxes[0].querySelector('.gift-name').textContent = `a.n. ${settings.bank1Holder}`;
    }
    if (giftBoxes[1]) {
        if (settings.bank2Name) giftBoxes[1].querySelector('.gift-bank').textContent = settings.bank2Name;
        if (settings.bank2Number) {
            giftBoxes[1].querySelector('.gift-number').textContent = settings.bank2Number;
            giftBoxes[1].querySelector('.copy-btn').setAttribute('data-copy', settings.bank2Number);
        }
        if (settings.bank2Holder) giftBoxes[1].querySelector('.gift-name').textContent = `a.n. ${settings.bank2Holder}`;
    }

    // Gallery Sync
    let galleryData;
    try { galleryData = JSON.parse(localStorage.getItem('wedding_gallery')); } catch { galleryData = null; }
    if (galleryData && galleryData.length > 0) {
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            galleryGrid.innerHTML = galleryData.map(photo => 
                `<div class="gallery-cell"><img src="${photo.url}" alt="${photo.alt || 'Galeri'}" loading="lazy"></div>`
            ).join('');
        }
    }

    initCopyButtons();
}

function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.getAttribute('data-copy');
            if(num) {
                navigator.clipboard.writeText(num)
                    .then(() => {
                        const originalText = btn.innerText;
                        btn.innerText = 'Tersalin!';
                        setTimeout(() => btn.innerText = originalText, 2000);
                        showToast('Nomor rekening berhasil disalin!');
                    })
                    .catch(() => { showToast('Gagal menyalin nomor.'); });
            }
        });
    });
}

function loadDynamicGallery() {
    let gallery;
    try { gallery = JSON.parse(localStorage.getItem('wedding_gallery')); }
    catch { gallery = null; }
    if (!gallery || gallery.length === 0) return;

    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = gallery.map(photo => `
        <div class="gallery-cell"><img src="${photo.url}" alt="${photo.alt || 'Galeri Mempelai'}" loading="lazy"></div>
    `).join('');
}

function initLoveStory() {
    let story;
    try { story = JSON.parse(localStorage.getItem('wedding_story')); }
    catch { story = null; }
    
    if (!story || story.length === 0) return;

    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    timeline.innerHTML = story.map(item => `
        <div class="timeline-row">
            <div class="timeline-year">${item.year}</div>
            <div class="timeline-info">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

/* -----------------------------------------
   7. COUNTDOWN TIMER
   ----------------------------------------- */
function initCountdown() {
    let settings;
    try { settings = JSON.parse(localStorage.getItem('wedding_settings')); }
    catch { settings = null; }
    
    // Default fallback date if setting is missing
    const targetDateStr = settings?.akadDate || '2026-06-20T08:00:00+07:00';
    const countdownDate = new Date(targetDateStr).getTime();

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-minutes');
    const sEl = document.getElementById('cd-seconds');

    if (!dEl) return;

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        if (distance < 0) {
            clearInterval(timer);
            dEl.innerText = "00"; hEl.innerText = "00"; mEl.innerText = "00"; sEl.innerText = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        dEl.innerText = days.toString().padStart(2, '0');
        hEl.innerText = hours.toString().padStart(2, '0');
        mEl.innerText = minutes.toString().padStart(2, '0');
        sEl.innerText = seconds.toString().padStart(2, '0');
    }, 1000);
}

/* -----------------------------------------
   8. GALLERY LIGHTBOX
   ----------------------------------------- */
function initLightbox() {
    const galleryGrid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');

    if (!galleryGrid || !lightbox) return;

    galleryGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            lightboxImg.src = e.target.src;
            lightbox.classList.add('show');
            document.body.classList.add('no-scroll');
        }
    });

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('show');
        document.body.classList.remove('no-scroll');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
    });
}

/* -----------------------------------------
   9. ROYAL SPARKLES (FOOTER ANIMATION)
   ----------------------------------------- */
function createRoyalSparkles() {
    const footer = document.querySelector('.luxury-footer');
    if (!footer) return;

    // Create 15 floating gold dusts in the footer area
    for (let i = 0; i < 15; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'royal-sparkle';
        
        // Random placement
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        
        // Random animation delay and duration to look organic
        sparkle.style.animationDelay = `${Math.random() * 5}s`;
        sparkle.style.animationDuration = `${4 + Math.random() * 4}s`;
        
        footer.appendChild(sparkle);
    }
}
