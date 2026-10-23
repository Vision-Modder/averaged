let pendingChange = 0;
let totalClicks = 0;
let overlay = document.querySelector(".overlay");

document.querySelector(".shop").addEventListener("click", () => {
    overlay.style.display = "flex";
});
overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
        overlay.style.display = "none";
  }
});

document.querySelector(".add").addEventListener("click", () => {
    pendingChange += 1;
    document.querySelector(".pendingchange").textContent = pendingChange.toFixed(0);
});
document.querySelector(".sub").addEventListener("click", () => {
    pendingChange -= 1;
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