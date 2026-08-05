// API endpoint - will be replaced during deployment
const API_ENDPOINT = 'https://api.ryanriegel.dev/contact';

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
