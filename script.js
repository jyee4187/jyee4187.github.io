document.addEventListener('DOMContentLoaded', () => {
    // Minimal script: Dream Map + Music carousel

    const grid = document.getElementById('grid');
    const notes = document.getElementById('notes');
    const diaryText = document.getElementById('diaryText');

    if (diaryText) diaryText.value = "Dream Journal\n\n";

    // 12 short tiles: 1-word place or item, Yume Nikki-inspired
    const scenes = [
        { title: 'Knife', note: 'Cold glint in the dark.' },
        { title: 'Flute', note: 'A single hollow note.' },
        { title: 'Lamp', note: 'Circle of safety.' },
        { title: 'Neon', note: 'Purple buzz, no source.' },
        { title: 'Snow', note: 'Footsteps vanish.' },
        { title: 'Mall', note: 'Shops with no clerks.' },
        { title: 'Forest', note: 'Leaves don\'t rustle.' },
        { title: 'Train', note: 'It never arrives.' },
        { title: 'School', note: 'Desks face the wall.' },
        { title: 'Door', note: 'Locked from inside.' },
        { title: 'Cat', note: 'Tail sways, eyes still.' },
        { title: 'Uboa', note: 'Do not flip the switch.' }
    ];

    // Cloud mask pattern: 12 cells, only some are tiles
    const cloudPattern = [
        false, true, true, false, true, false, // row 1 (6)
        true, true, true, true, true, true   // row 2 (6)
    ];

    if (grid) {
        let tileIndex = 0;
        for (let i = 0; i < cloudPattern.length; i++) {
            if (cloudPattern[i] && tileIndex < scenes.length) {
                const s = scenes[tileIndex++];
                const t = document.createElement('div');
                t.className = 'tile';
                t.dataset.title = s.title;
                t.dataset.note = s.note;
                t.textContent = s.title; // one word label
                t.addEventListener('click', onTile);
                grid.appendChild(t);
            } else {
                const empty = document.createElement('div');
                empty.className = 'tile-empty';
                grid.appendChild(empty);
            }
        }
    }

    function onTile(e) {
        const { title, note } = e.currentTarget.dataset;
        if (diaryText) {
            diaryText.value = `${title} — ${note}\n` + (diaryText.value || '');
        }
    }

    // Tabs for the Showcase section
    const showcase = document.getElementById('showcase');
    if (showcase) {
        showcase.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            const targetSel = btn.getAttribute('data-target');
            const target = showcase.querySelector(targetSel);
            if (!target) return;

            // toggle active button
            showcase.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // toggle panels
            showcase.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            target.classList.add('active');
        });
    }

    // Generic carousel controller (images and music)
    const carousels = Array.from(document.querySelectorAll('.carousel'));
    carousels.forEach(initCarousel);

    function initCarousel(root) {
        const track = root.querySelector('.caro-track');
        const slides = Array.from(root.querySelectorAll('.caro-slide'));
        const prev = root.querySelector('.prev');
        const next = root.querySelector('.next');
        if (!track || !slides.length) return;

        let i = 0;
        const clamp = (n) => Math.max(0, Math.min(n, slides.length - 1));
        const width = () => slides[0].getBoundingClientRect().width;
        const update = () => { track.style.transform = `translateX(${-i * width()}px)`; };

        prev && prev.addEventListener('click', () => { i = clamp(i - 1); update(); });
        next && next.addEventListener('click', () => { i = clamp(i + 1); update(); });

        new ResizeObserver(update).observe(slides[0]);
        update();
    }
});
