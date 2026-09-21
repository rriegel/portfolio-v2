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
    var ol = document.querySelector('.life-timeline');
    var bars = []; // duration bars, synced with popover visibility
    if (!chips.length || !milestones.length || !ol) return;

    /* ---------- month labels + year group markers ---------- */
    // Each milestone carries data-date="YYYY-MM", oldest first in the DOM
    // (the axis renders left->right, so 2021 sits at the left edge). The date
    // span at each node shows the month only; a year marker is inserted after
    // each year's last event. Popover titles gain a "Month Year" stamp.
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
        // stamp the popover with month/year (+ duration when data-end exists)
        var h4 = m.querySelector('.milestone-body h4');
        if (h4) {
            var start = m.getAttribute('data-date');
            var end = m.getAttribute('data-end');
            var text = MONTHS[d.m - 1] + ' ' + d.y;
            if (end) {
                var v = end.split('-');
                var endText = end === 'present' ? 'present' : (MONTHS[parseInt(v[1], 10) - 1] || '') + ' ' + v[0];
                text = text + ' - ' + endText;
                if (end !== 'present') {
                    var s = (d.y | 0) * 12 + d.m - 1;
                    var e2 = (parseInt(v[0], 10) | 0) * 12 + (parseInt(v[1], 10) | 0) - 1;
                    var mos = e2 - s;
                    var yrs = Math.floor(mos / 12), rem = mos % 12;
                    var dur = yrs === 0 ? rem + ' mo' : (rem ? yrs + ' yr ' + rem + ' mo' : yrs + ' yr' + (yrs > 1 ? 's' : ''));
                    text = text + ' (' + dur + ')';
                }
            }
            var stamp = document.createElement('span');
            stamp.className = 'milestone-stamp';
            stamp.textContent = text;
            h4.parentNode.insertBefore(stamp, h4);
        }
    });

    /* ---------- time-proportional axis + duration bars ---------- */
    // Axis spans [earliest start .. latest end]. Each li is absolutely
    // positioned at its month offset (X% = (start-first)/(last-first)).
    // Items with data-end render as rounded bars in the .timeline-bars
    // overlay, lane-staggered where they'd overlap. Year labels sit at
    // real year boundaries; open-ended items get an arrow to the axis end.
    (function proportionalLayout() {
        if (!ol) return;
        var monthsOf = function (ym) {
            var v = (ym || '').split('-');
            return (parseInt(v[0], 10) || 0) * 12 + (parseInt(v[1], 10) || 1) - 1;
        };

        var events = [];
        milestones.forEach(function (m) {
            var endAttr = m.getAttribute('data-end');
            events.push({
                el: m,
                start: monthsOf(m.getAttribute('data-date')),
                end: !endAttr ? null : (endAttr === 'present' ? null : monthsOf(endAttr)),
                open: endAttr === 'present'
            });
        });

        var axisStart = Infinity, axisEnd = -Infinity;
        events.forEach(function (e) {
            axisStart = Math.min(axisStart, e.start);
            var eEnd = e.end !== null ? e.end : e.start;
            axisEnd = Math.max(axisEnd, eEnd);
        });
        if (!isFinite(axisStart) || !isFinite(axisEnd)) return;
        var span = Math.max(1, axisEnd - axisStart);
        // Map into an inset range so the first/last nodes never sit exactly
        // on the container edge (unhoverable dead zone + clipped labels).
        var EDGE = 1.5; // percent
        var pct = function (months) {
            return EDGE + (months - axisStart) / span * (100 - 2 * EDGE);
        };

        // 1. place each milestone li at its date (--x so mobile can reset)
        events.forEach(function (e) {
            e.el.style.setProperty('--x', pct(e.start).toFixed(2) + '%');
        });

        // 2. year labels at Jan of each year in span (plain text, above axis)
        var firstYear = Math.floor(axisStart / 12);
        var lastYear = Math.floor(axisEnd / 12);
        for (var y = firstYear; y <= lastYear; y++) {
            var boundary = y * 12; // Jan of y
            if (boundary < axisStart || boundary > axisEnd) continue;
            var marker = document.createElement('li');
            marker.className = 'year-marker';
            marker.setAttribute('aria-hidden', 'true');
            marker.textContent = String(y);
            marker.style.setProperty('--x', pct(boundary).toFixed(2) + '%');
            ol.appendChild(marker);
        }

        // 3. duration bars: hidden until the event's details open; then the
        // bar appears ON the axis as a thicker highlighted line. Each bar
        // carries data-for=<event index> for syncing with popover state.
        var barsWrap = document.createElement('div');
        barsWrap.className = 'timeline-bars';
        barsWrap.setAttribute('aria-hidden', 'true');
        ol.appendChild(barsWrap);

        events.forEach(function (e, ei) {
            if (e.end === null && !e.open) return; // point event: dot only
            var endMonth = e.end !== null ? e.end : axisEnd;
            var bar = document.createElement('div');
            bar.className = 'timeline-bar timeline-bar-' + (e.el.getAttribute('data-cat') || 'work') +
                            (e.open ? ' timeline-bar-open' : '');
            bar.style.left = pct(e.start).toFixed(2) + '%';
            bar.style.width = (pct(endMonth) - pct(e.start)).toFixed(2) + '%';
            bar.setAttribute('data-for', String(ei));
            barsWrap.appendChild(bar);
            bars.push(bar);
        });

        // 4. reposition popovers after layout shifts (dates/nodes moved)
        var reposition = function () {
            milestones.forEach(function (m) {
                if (m.classList.contains('is-open')) {
                    positionPopover(m, m.querySelector('.milestone-node'), m.querySelector('.milestone-body'));
                }
            });
        };
        window.addEventListener('resize', reposition);
        window.addEventListener('load', reposition);
    })();

    /* ---------- chip filtering (multi-select) ---------- */
    // Categories toggle independently: a selected category adds its nodes to
    // the view; deselecting removes them. Professional starts selected (set
    // in the markup). Empty selection shows nothing.
    var selected = ['work'];

    function applyFilter() {
        milestones.forEach(function (m) {
            var cats = (m.getAttribute('data-cat') || '').split(/\s+/);
            var matches = cats.some(function (c) { return selected.indexOf(c) !== -1; });
            if (matches) {
                m.removeAttribute('data-dim');
            } else {
                m.setAttribute('data-dim', '');
                if (m.classList.contains('is-open')) closePopover(m);
            }
        });
        chips.forEach(function (c) {
            c.setAttribute('aria-pressed', selected.indexOf(c.getAttribute('data-filter')) !== -1 ? 'true' : 'false');
        });
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var filter = chip.getAttribute('data-filter');
            var idx = selected.indexOf(filter);
            if (idx === -1) {
                selected.push(filter);
            } else {
                selected.splice(idx, 1);
            }
            applyFilter();
        });
    });

    applyFilter();

    /* ---------- popovers ---------- */

    function closePopover(m) {
        m.classList.remove('is-open');
        var node = m.querySelector('.milestone-node');
        if (node) node.setAttribute('aria-expanded', 'false');
        // hide the event's duration bar (if it has one)
        var idx = Array.prototype.indexOf.call(milestones, m);
        var bar = bars.filter(function (b) { return b.getAttribute('data-for') === String(idx); })[0];
        if (bar) bar.classList.remove('is-visible');
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
        // show the event's duration bar (if it has one)
        var idx = Array.prototype.indexOf.call(milestones, m);
        var bar = bars.filter(function (b) { return b.getAttribute('data-for') === String(idx); })[0];
        if (bar) bar.classList.add('is-visible');
    }

    function positionPopover(m, node, body) {
        // CSS centers the popover on the node column (left:50%) and anchors it
        // to the spine. JS's only job: clamp so the box stays within the
        // timeline bounds, by shifting via --pop-shift (the caret follows
        // because it uses the same variable). Viewport rects avoid
        // offsetParent ambiguity entirely.
        var tl = document.querySelector('.life-timeline');
        if (!tl || !node || !body) return;
        var bw = body.offsetWidth || 340;

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
            if (m.hasAttribute('data-dim')) return; // filtered out
            if (m.classList.contains('is-open')) {
                closePopover(m);
            } else {
                openPopover(m);
            }
        });

        node.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && m.classList.contains('is-open')) {
                closePopover(m);
                // release focus: after a press-then-Escape sequence Chromium
                // keeps :focus-visible on the node, and the CSS rule
                // .milestone-node:focus-visible ... would reopen the popover
                node.blur();
            }
        });

        // Hover mirrors the CSS hover-popover: entering shows the bar,
        // leaving hides it — unless the popover is click-pinned (is-open),
        // in which case the bar stays until the popover closes. Dimmed
        // nodes ignore pointer events, but guard anyway.
        m.addEventListener('mouseenter', function () {
            if (m.hasAttribute('data-dim')) return;
            var idx = Array.prototype.indexOf.call(milestones, m);
            var bar = bars.filter(function (b) { return b.getAttribute('data-for') === String(idx); })[0];
            if (bar) bar.classList.add('is-visible');
        });
        m.addEventListener('mouseleave', function () {
            if (m.classList.contains('is-open')) return; // click-pinned stays
            var idx = Array.prototype.indexOf.call(milestones, m);
            var bar = bars.filter(function (b) { return b.getAttribute('data-for') === String(idx); })[0];
            if (bar) bar.classList.remove('is-visible');
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
