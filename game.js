let number = 0;
let pendingChange = 0;
let totalClicks = 0;

document.querySelector(".add").addEventListener("click", () => {
    number += 1;
    pendingChange += 1;
    document.querySelector(".numberdisplay").textContent = number.toFixed(5);
    console.log("Pending:", pendingChange);
    document.querySelector(".pendingchange").textContent = pendingChange.toFixed(0);
});
document.querySelector(".sub").addEventListener("click", () => {
    number -= 1;
    pendingChange -= 1;
    document.querySelector(".numberdisplay").textContent = number.toFixed(5);
    console.log("Pending:", pendingChange);
    document.querySelector(".pendingchange").textContent = pendingChange.toFixed(0);
});

document.querySelector(".add").addEventListener("click", () => {
    totalClicks += 1;
    document.querySelector(".totalclicks").textContent = totalClicks.toFixed(0);
});
document.querySelector(".sub").addEventListener("click", () => {
    totalClicks += 1;
    document.querySelector(".totalclicks").textContent = totalClicks.toFixed(0);
});