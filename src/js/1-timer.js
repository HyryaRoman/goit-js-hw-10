import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import '../css/timer.css';

function addLeadingZero(value) {
  return String(value).padStart(2, '0');
}

function convertMs(ms) {
  // Number of milliseconds per unit of time
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  // Remaining days
  const days = Math.floor(ms / day);
  // Remaining hours
  const hours = Math.floor((ms % day) / hour);
  // Remaining minutes
  const minutes = Math.floor(((ms % day) % hour) / minute);
  // Remaining seconds
  const seconds = Math.floor((((ms % day) % hour) % minute) / second);

  return { days, hours, minutes, seconds };
}

function convertUnits(raw) {
  return {
    days: addLeadingZero(raw.days),
    hours: addLeadingZero(raw.hours),
    minutes: addLeadingZero(raw.minutes),
    seconds: addLeadingZero(raw.seconds),
  };
}

class CountdownClock {
  #onUpdateCallback = null;
  #onFinishedCallback = null;

  #targetTime = null;
  #intervalID = null;

  constructor(onUpdateCallback = null, onFinishedCallback = null) {
    this.#onUpdateCallback = onUpdateCallback;
    this.#onFinishedCallback = onFinishedCallback;
  }

  canCountdownTo(time) {
    return time && Date.now() < time;
  }

  startCountdown(until) {
    if (!this.canCountdownTo(until)) return;
    if (this.#intervalID !== null) this.stopCountdown();
    this.#targetTime = until;
    this.#intervalID = window.setInterval(() => this.#update(), 1000);
    this.#update();
  }

  stopCountdown() {
    window.clearInterval(this.#intervalID);
    this.#intervalID = null;
    this.#targetTime = null;
  }

  #update() {
    const timeRemainingMS = Math.max(this.#targetTime - Date.now(), 0);
    if (this.#onUpdateCallback) this.#onUpdateCallback(timeRemainingMS);
    if (timeRemainingMS <= 0) {
      this.stopCountdown();
      if (this.#onFinishedCallback) this.#onFinishedCallback();
    }
  }
}

class CountdownDisplay {
  #daysDisplay;
  #hoursDisplay;
  #minutesDisplay;
  #secondsDisplay;

  constructor(displaySelector) {
    const displayElement = document.querySelector(displaySelector);
    this.#daysDisplay = displayElement.querySelector('[data-days]');
    this.#hoursDisplay = displayElement.querySelector('[data-hours]');
    this.#minutesDisplay = displayElement.querySelector('[data-minutes]');
    this.#secondsDisplay = displayElement.querySelector('[data-seconds]');
  }

  setTime(timeMS) {
    const timeUnits = convertMs(timeMS);
    const timeStrings = convertUnits(timeUnits);

    this.#daysDisplay.textContent = timeStrings.days;
    this.#hoursDisplay.textContent = timeStrings.hours;
    this.#minutesDisplay.textContent = timeStrings.minutes;
    this.#secondsDisplay.textContent = timeStrings.seconds;
  }
}

class CountdownInput {
  #clock;
  #notifier;
  #startButton;
  #inputField;
  #targetDate;

  constructor(inputSelector, clock, notifier) {
    const inputContainer = document.querySelector(inputSelector);
    this.#inputField = inputContainer.querySelector('input[type="text"]');
    this.#startButton = inputContainer.querySelector('[data-start]');
    this.#clock = clock;
    this.#notifier = notifier;

    const onClose = selectedDates => this.#onDatePicked(selectedDates[0]);

    flatpickr(this.#inputField, {
      enableTime: true,
      time_24hr: true,
      defaultDate: new Date(),
      minuteIncrement: 1,
      onClose,
    });

    this.#startButton.addEventListener(
      'click',
      this.#onStartButtonClicked.bind(this)
    );

    this.#startButton.disabled = true;
  }

  disable() {
    this.#inputField.disabled = true;
    this.#startButton.disabled = true;
  }

  enable() {
    this.#inputField.disabled = false;
    this.#startButton.disabled = !this.#clock.canCountdownTo(this.#targetDate);
  }

  #onDatePicked(date) {
    if (!this.#clock.canCountdownTo(date)) {
      this.#startButton.disabled = true;
      this.#notifier.error('Please choose a date in the future');
      return;
    }
    this.#startButton.disabled = false;
    this.#targetDate = date;
  }

  #onStartButtonClicked(e) {
    if (!this.#clock.canCountdownTo(this.#targetDate)) {
      this.#startButton.disabled = true;
      this.#notifier.error('Please choose a date in the future');
      return;
    }
    this.disable();
    this.#clock.startCountdown(this.#targetDate);
  }
}

class Notifier {
  constructor() {
    iziToast.settings({
      timeout: 5000,
      resetOnHover: true,
      animateInside: false,
      transitionIn: 'bounceInLeft',
      transitionOut: 'fadeOutRight',
      position: 'topRight',
    });
  }

  error(message) {
    iziToast.error({
      class: 'toast toast--error',
      message,
    });
  }

  ok(message) {
    iziToast.success({
      class: 'toast toast--ok',
      message,
    });
  }
}

const notifier = new Notifier();

const display = new CountdownDisplay('.timer');
const clock = new CountdownClock(
  time => display.setTime(time),
  () => {
    input.enable();
    notifier.ok('Countdown Finished');
  }
);
const input = new CountdownInput('.timer-input', clock, notifier);
