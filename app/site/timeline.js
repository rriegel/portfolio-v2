// Life & Work Timeline — category chip filtering (ghost overlay).
// Non-matching milestones get data-dim (dimmed via CSS) but stay in place.
(function () {
    'use strict';

    var chips = document.querySelectorAll('.timeline-chips .chip');
    var milestones = document.querySelectorAll('.life-timeline .milestone');
    if (!chips.length || !milestones.length) return;

    function applyFilter(filter) {
        milestones.forEach(function (m) {
            var cats = (m.getAttribute('data-cat') || '').split(/\s+/);
            if (filter === 'all' || cats.indexOf(filter) !== -1) {
                m.removeAttribute('data-dim');
            } else {
                m.setAttribute('data-dim', '');
            }
        });
        chips.forEach(function (c) {
            c.setAttribute('aria-pressed', c.getAttribute('data-filter') === filter ? 'true' : 'false');
        });
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var filter = chip.getAttribute('data-filter');
            var isActive = chip.getAttribute('aria-pressed') === 'true';
            // Clicking the active chip resets to All (only "all" is a valid reset target)
            applyFilter(isActive && filter !== 'all' ? 'all' : filter);
        });
    });
})();
