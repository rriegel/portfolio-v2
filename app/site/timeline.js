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
        // Anchor to the node; clamp horizontally inside the timeline.
        // Vertical side matches the date side (odd nth-child = below, even = above).
        var tl = document.querySelector('.life-timeline');
        if (!tl || !node || !body) return;
        var bw = body.offsetWidth || 240;
        var bh = body.offsetHeight || 120;

        var left = node.offsetLeft + node.offsetWidth / 2 - bw / 2;
        var maxLeft = tl.clientWidth - bw;
        if (left < 0) left = 0;
        if (left > maxLeft) left = maxLeft;
        body.style.left = left + 'px';

        var index = Array.prototype.indexOf.call(m.parentNode.children, m); // 0-based
        var isOddChild = (index % 2 === 0); // nth-child(odd) == 1st/3rd/... == index 0/2/...
        var nodeCenterY = node.offsetTop + node.offsetHeight / 2;
        if (isOddChild) {
            body.style.top = (nodeCenterY + 16) + 'px';
            body.style.bottom = 'auto';
        } else {
            body.style.top = (nodeCenterY - 16 - bh) + 'px';
            body.style.bottom = 'auto';
        }
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
})();
