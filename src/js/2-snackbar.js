import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

iziToast.settings({
  timeout: 5000,
  resetOnHover: true,
  animateInside: false,
  transitionIn: 'bounceInLeft',
  transitionOut: 'fadeOutRight',
  position: 'topRight',
});

function showNotification(message, backgroundColor, textColor) {
  iziToast.show({
    backgroundColor,
    messageColor: textColor,
    message,
  });
}

function createPromise(delay, value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value === 'fulfilled') resolve();
      else reject();
    }, delay);
  });
}

function onFormSubmitted(ev) {
  ev.preventDefault();

  const form = ev.target;
  const formData = new FormData(form);

  const delay = formData.get('delay');
  const state = formData.get('state');

  createPromise(delay, state)
    .then(() =>
      showNotification(
        `✅ Fulfilled promise in ${delay}ms`,
        'var(--toast-ok-bg-color)',
        'var(--toast-ok-text-color)'
      )
    )
    .catch(() =>
      showNotification(
        `❌ Rejected promise in ${delay}ms`,
        'var(--toast-error-bg-color)',
        'var(--toast-error-text-color)'
      )
    );
}

document.querySelector('.form').addEventListener('submit', onFormSubmitted);
