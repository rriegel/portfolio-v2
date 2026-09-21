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

    /* ---------- month labels + year group markers ---------- */
    // Each milestone carries data-date="YYYY-MM" (newest first). The date
    // span at each node shows the month only; a year marker is inserted on
    // the axis between each year's group of events (and at the far right
    // edge for the oldest year). Popover titles gain a "Month Year" stamp.
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function dateOf(m) {
        var v = (m.getAttribute('data-date') || '').split('-');
        return { y: v[0] || '', m: parseInt(v[1], 10) || 0 };
    }

    milestones.forEach(function (m) {
        var d = dateOf(m);
        var dateSpan = m.querySelector('.milestone-date');
        if (dateSpan) dateSpan.textContent = MONTHS[d.m - 1] || '';
        // stamp the popover with month + year
        var h4 = m.querySelector('.milestone-body h4');
        if (h4) {
            var stamp = document.createElement('span');
            stamp.className = 'milestone-stamp';
            stamp.textContent = MONTHS[d.m - 1] + ' ' + d.y;
            h4.parentNode.insertBefore(stamp, h4);
        }
    });

    // Year markers: inserted after the last milestone of each year EXCEPT the
    // oldest year's marker, which goes after the final li (far right edge).
    // Markers sit ON the axis (absolute, top:50%), alternating above/below.
    (function insertYearMarkers() {
        var ol = document.querySelector('.life-timeline');
        if (!ol) return;
        var yearsSeen = [];
        milestones.forEach(function (m, i) {
            var y = dateOf(m).y;
            if (yearsSeen.indexOf(y) === -1) yearsSeen.push(y);
        });
        yearsSeen.forEach(function (year, yi) {
            // find last li of this year
            var lastIdx = -1;
            milestones.forEach(function (m, i) {
                if (dateOf(m).y === year && i > lastIdx) lastIdx = i;
            });
            if (lastIdx === -1) return;
            var marker = document.createElement('li');
            marker.className = 'year-marker' + (yi % 2 === 1 ? ' year-marker-below' : '');
            marker.setAttribute('aria-hidden', 'true');
            marker.textContent = year;
            var ref = milestones[lastIdx].nextSibling;
            ol.insertBefore(marker, ref);
        });
    })();

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

    /* ---------- Projects carousel ---------- */
    // One card in focus at a time; prev/next buttons, dot navigation,
    // keyboard arrows, and nav-dropdown deep links (#projects anchor +
    // data-project index from the Projects dropdown).
    var track = document.querySelector('.project-track');
    var controls = document.querySelector('.project-controls');
    if (track && controls) {
        var cards = Array.prototype.slice.call(track.querySelectorAll('.project-card'));
        var dotsWrap = controls.querySelector('.carousel-dots');
        var current = 0;

        var dots = cards.map(function (card, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', 'Show project ' + (i + 1) + ': ' + card.querySelector('h3').textContent);
            card.id = card.id || 'project-' + (i + 1);
            dotsWrap.appendChild(dot);
            dot.addEventListener('click', function () { show(i); });
            return dot;
        });

        var show = function (idx) {
            current = (idx + cards.length) % cards.length;
            cards.forEach(function (card, i) {
                card.classList.toggle('is-active', i === current);
                card.setAttribute('aria-hidden', i === current ? 'false' : 'true');
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
            if (history.replaceState) history.replaceState(null, '', '#' + cards[current].id);
        };

        controls.querySelector('.carousel-prev').addEventListener('click', function () { show(current - 1); });
        controls.querySelector('.carousel-next').addEventListener('click', function () { show(current + 1); });

        document.addEventListener('keydown', function (e) {
            var carouselVisible = track.getBoundingClientRect().width > 0 &&
                track.getBoundingClientRect().bottom > 0;
            if (!carouselVisible) return;
            if (e.key === 'ArrowLeft') show(current - 1);
            if (e.key === 'ArrowRight') show(current + 1);
        });

        // Deep-link support: #project-3 focuses that card on load
        var m = window.location.hash.match(/^#project-(\d+)$/);
        if (m && cards[m[1] - 1]) show(parseInt(m[1], 10) - 1);
        else cards[0].classList.add('is-active'), cards[0].setAttribute('aria-hidden', 'false');
    }

    /* ---------- Projects nav dropdown ---------- */
    // Hover-open dropdown listing each project; clicking an item navigates
    // to #projects AND focuses that project's carousel card (deep link).
    var navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        var projectsAnchor = navLinks.querySelector('a[href="#projects"]');
        var projectsLi = projectsAnchor ? projectsAnchor.closest('li') : null;
        if (projectsLi && !projectsLi.classList.contains('has-dropdown')) {
            projectsLi.classList.add('has-dropdown');
            var dd = document.createElement('ul');
            dd.className = 'dropdown';
            dd.setAttribute('aria-label', 'Projects');
            cards.forEach(function (card, i) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = '#projects';
                a.textContent = card.querySelector('h3').textContent;
                a.addEventListener('click', function () { show(i); });
                li.appendChild(a);
                dd.appendChild(li);
            });
            projectsLi.appendChild(dd);
            projectsAnchor.setAttribute('aria-haspopup', 'true');
            projectsAnchor.setAttribute('aria-expanded', 'false');

            // Touch/keyboard: same first-tap-opens pattern as About
            projectsAnchor.addEventListener('click', function (e) {
                if (!projectsLi.classList.contains('is-open')) {
                    e.preventDefault();
                    projectsLi.classList.add('is-open');
                    projectsAnchor.setAttribute('aria-expanded', 'true');
                }
            });
            projectsLi.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && projectsLi.classList.contains('is-open')) {
                    projectsLi.classList.remove('is-open');
                    projectsAnchor.setAttribute('aria-expanded', 'false');
                    projectsAnchor.focus();
                }
            });
            document.addEventListener('click', function (e) {
                if (projectsLi.classList.contains('is-open') && !projectsLi.contains(e.target)) {
                    projectsLi.classList.remove('is-open');
                    projectsAnchor.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }
})();
