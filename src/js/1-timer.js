import flatpickr from 'flatpickr';

import 'flatpickr/dist/flatpickr.min.css';

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

  #targetTime = null;
  #intervalID = null;

  constructor(onUpdateCallback) {
    this.#onUpdateCallback = onUpdateCallback;
  }

  canCountdownTo(time) {
    return time && Date.now() < time;
  }

  startCountdown(until) {
    if (!this.canCountdownTo(until)) return;
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
    this.#onUpdateCallback(timeRemainingMS);
    if (timeRemainingMS <= 0) {
      this.stopCountdown();
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
  #startButton;
  #inputField;
  #targetDate;

  constructor(inputSelector, clock) {
    const inputContainer = document.querySelector(inputSelector);
    this.#inputField = inputContainer.querySelector('input[type="text"]');
    this.#startButton = inputContainer.querySelector('[data-start]');
    this.#clock = clock;

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

  #onDatePicked(date) {
    if (!this.#clock.canCountdownTo(date)) {
      this.#startButton.disabled = true;
      window.alert('Please choose a date in the future');
      return;
    }
    this.#startButton.disabled = false;
    this.#targetDate = date;
  }

  #onStartButtonClicked(e) {
    if (!this.#clock.canCountdownTo(this.#targetDate)) {
      this.#startButton.disabled = true;
      window.alert('Please choose a date in the future');
      return;
    }
    this.#clock.startCountdown(this.#targetDate);
  }
}

const display = new CountdownDisplay('.timer');
const clock = new CountdownClock(time => display.setTime(time));
const input = new CountdownInput('.timer-input', clock);
