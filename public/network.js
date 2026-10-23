async function loadNumber() {
    let response = await fetch("/number");
    let data = await response.json();
    document.querySelector(".numberdisplay").textContent = data.number.toFixed(10);
}
loadNumber();