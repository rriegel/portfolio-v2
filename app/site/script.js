// API endpoint - will be replaced during deployment
const API_ENDPOINT = 'https://api.ryanriegel.dev/contact';

// ---- Content pop-in ----
// Sections fade/slide in as they enter the viewport. JS is required for the
// hidden state: the <html> element ships with class="no-js" and gets it
// removed here, so the CSS fallback keeps content visible when JS is off.
document.documentElement.classList.remove('no-js');

(function initReveal() {
    const targets = document.querySelectorAll('.section > .container, #hero .hero-content');
    if (!targets.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
        targets.forEach((t) => t.classList.add('is-visible'));
        return;
    }

    targets.forEach((t) => t.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((t) => observer.observe(t));
})();

document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const status = document.getElementById('form-status');
    const button = form.querySelector('button');
    
    // Reset status
    status.className = '';
    status.textContent = '';
    
    // Disable button
    button.disabled = true;
    button.textContent = 'Sending...';
    
    const formData = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value
    };
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            status.className = 'success';
            status.textContent = 'Message sent successfully! I\'ll get back to you soon.';
            form.reset();
        } else {
            throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to send message');
        }
    } catch (error) {
        status.className = 'error';
        status.textContent = `Error: ${error.message}`;
    } finally {
        button.disabled = false;
        button.textContent = 'Send Message';
    }
});
