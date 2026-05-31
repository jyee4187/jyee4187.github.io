document.addEventListener('DOMContentLoaded', () => {
    // Minimal script: Dream Map only

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

    // (No tabs or carousels on this page)
});
