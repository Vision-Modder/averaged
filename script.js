let currentNumber = 0;
let batchedNumber = 0;
const numberDisplay = document.querySelector('.number-display');
const addButton = document.querySelector('.add');
const subButton = document.querySelector('.sub');
addButton.addEventListener('click', () => {
    currentNumber++;
    batchedNumber++;
    updateScreen();
});
subButton.addEventListener('click', () => {
    currentNumber--;
    batchedNumber--;
    updateScreen();
});
function updateScreen() {
    numberDisplay.textContent = currentNumber.toFixed(5);
}
