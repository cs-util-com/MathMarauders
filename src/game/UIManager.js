/**
 * Handles DOM updates and user interactions.
 */
export default class UIManager {
  constructor() {
    this.root = document.getElementById('game');
    this.startBtn = document.getElementById('startBtn');
    this.leftBtn = document.getElementById('leftChoice');
    this.rightBtn = document.getElementById('rightChoice');
    this.playerCountEl = document.getElementById('playerCount');
    this.enemyCountEl = document.getElementById('enemyCount');
    this.popup = document.getElementById('popup');
    this.popupText = document.getElementById('popupText');
    this.nextBtn = document.getElementById('nextBtn');
    this.retryBtn = document.getElementById('retryBtn');
  }

  onStart(cb) {
    this.startBtn.addEventListener('click', cb);
  }
  onLeft(cb) {
    this.leftBtn.addEventListener('click', cb);
  }
  onRight(cb) {
    this.rightBtn.addEventListener('click', cb);
  }
  onNext(cb) {
    this.nextBtn.addEventListener('click', cb);
  }
  onRetry(cb) {
    this.retryBtn.addEventListener('click', cb);
  }

  updateGateLabels(a, b) {
    this.leftBtn.textContent = a;
    this.rightBtn.textContent = b;
  }

  updateCounts(player, enemy = 0) {
    this.playerCountEl.textContent = player;
    this.enemyCountEl.textContent = enemy;
  }

  showPopup(text, stars) {
    this.popupText.textContent = `${text}\n${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`;
    this.popup.style.display = 'block';
  }

  hidePopup() {
    this.popup.style.display = 'none';
  }
}
