setInterval(async () => {
  if (pendingChange !== 0) {
    let response = await fetch("/number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change: pendingChange })
    });
    pendingChange = 0;
    let data = await response.json();
    document.querySelector(".numberdisplay").textContent = data.number.toFixed(10);
  }
}, 1000);
setInterval(async () => {
  let response = await fetch("/number");
  let data = await response.json();
  document.querySelector(".numberdisplay").textContent = data.number.toFixed(10);
}, 1000);
