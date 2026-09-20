// Life & Work Timeline - category chip filtering + horizontal timeline popovers.
// - Chips: ghost overlay. Non-matching milestones get data-dim (dimmed via CSS)
//   but stay in place. Clicking the active chip resets to All.
// - Popovers: milestone bodies are position-anchored to their node button.
//   Hover shows on desktop (CSS), click toggles for touch, focus for keyboard.
//   JS clamps horizontal position so popovers never overflow the timeline.
(function () {
    'use strict';

    var chips = document.querySelectorAll('.timeline-chips .chip');
    var milestones = document.querySelectorAll('.life-timeline .milestone');
    if (!chips.length || !milestones.length) return;

    /* ---------- chip filtering ---------- */

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
            applyFilter(isActive && filter !== 'all' ? 'all' : filter);
        });
    });

    /* ---------- popovers ---------- */

    function closePopover(m) {
        m.classList.remove('is-open');
        var node = m.querySelector('.milestone-node');
        if (node) node.setAttribute('aria-expanded', 'false');
    }

    function openPopover(m) {
        milestones.forEach(function (other) {
            if (other !== m && other.classList.contains('is-open')) closePopover(other);
        });
        m.classList.add('is-open');
        var node = m.querySelector('.milestone-node');
        var body = m.querySelector('.milestone-body');
        if (node) node.setAttribute('aria-expanded', 'true');
        if (body) positionPopover(m, node, body);
    }

    function positionPopover(m, node, body) {
        // CSS centers the popover on the node column (left:50%) and anchors it
        // to the spine. JS's only job: clamp so the box stays within the
        // timeline bounds, by shifting via --pop-shift (the caret follows
        // because it uses the same variable). Viewport rects avoid
        // offsetParent ambiguity entirely.
        var tl = document.querySelector('.life-timeline');
        if (!tl || !node || !body) return;
        var bw = body.offsetWidth || 240;

        var nr = node.getBoundingClientRect();
        var tlr = tl.getBoundingClientRect();
        var centerX = nr.left + nr.width / 2;
        var desiredLeft = centerX - bw / 2;
        var clampedLeft = Math.max(tlr.left, Math.min(desiredLeft, tlr.right - bw));
        body.style.setProperty('--pop-shift', (clampedLeft - desiredLeft).toFixed(1) + 'px');
    }

    milestones.forEach(function (m) {
        var node = m.querySelector('.milestone-node');
        if (!node) return;

        node.addEventListener('click', function (e) {
            e.stopPropagation();
            if (m.classList.contains('is-open')) {
                closePopover(m);
            } else {
                openPopover(m);
            }
        });

        node.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && m.classList.contains('is-open')) {
                closePopover(m);
                node.focus();
            }
        });
    });

    document.addEventListener('click', function (e) {
        milestones.forEach(function (m) {
            if (m.classList.contains('is-open') && !m.contains(e.target)) closePopover(m);
        });
    });

    var repositionTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(repositionTimer);
        repositionTimer = setTimeout(function () {
            milestones.forEach(function (m) {
                if (m.classList.contains('is-open')) {
                    positionPopover(m, m.querySelector('.milestone-node'), m.querySelector('.milestone-body'));
                }
            });
        }, 150);
    });

    /* ---------- About dropdown (touch + keyboard) ---------- */
    // Desktop opens on hover via CSS. Touch devices and keyboard users get
    // this tap/click toggle on the li (the About link itself still navigates;
    // users pick a subsection from the dropdown). Escape closes.
    var dropdownLi = document.querySelector('.nav-links .has-dropdown');
    if (dropdownLi) {
        var aboutLink = dropdownLi.querySelector(':scope > a');
        aboutLink.addEventListener('click', function (e) {
            // First tap opens the menu; second tap follows the #about link.
            if (!dropdownLi.classList.contains('is-open')) {
                e.preventDefault();
                dropdownLi.classList.add('is-open');
                aboutLink.setAttribute('aria-expanded', 'true');
            }
        });

        dropdownLi.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && dropdownLi.classList.contains('is-open')) {
                dropdownLi.classList.remove('is-open');
                aboutLink.setAttribute('aria-expanded', 'false');
                aboutLink.focus();
            }
        });

        document.addEventListener('click', function (e) {
            if (dropdownLi.classList.contains('is-open') && !dropdownLi.contains(e.target)) {
                dropdownLi.classList.remove('is-open');
                aboutLink.setAttribute('aria-expanded', 'false');
            }
        });
    }
})();
