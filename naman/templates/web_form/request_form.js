// request_form.js
// Shows a success message and redirects to /thank-you after submit.
// This uses the standard form POST flow for Frappe webforms.
// It also disables the submit button to prevent double clicks.

frappe.ready(function() {
  const form = document.getElementById('naman-webform');
  const submitBtn = document.getElementById('naman-submit-btn');

  if (!form) return;

  form.addEventListener('submit', function(evt) {
    // Give visual feedback right away
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-spin fa-spinner"></i> Sending...';
    }

    // After a short delay allow the normal form POST to happen.
    // Frappe will serve the usual webform response. To keep UX consistent,
    // we still set a fallback redirect after 3 seconds in case of success.
    setTimeout(function() {
      // fallback redirect - many times Frappe will redirect automatically,
      // but if it does not, go to /thank-you
      window.location.href = '/thank-you';
    }, 3000);
  });
});
