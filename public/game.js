let pendingChange = 0;
let totalClicks = 0;
let overlay = document.querySelector(".overlay");

function showAppSection(side, targetId) {
    const panel = document.querySelector(`.${side}sidepanel`);
    panel.querySelectorAll('.app-section').forEach(sec => {
        sec.style.display = "none";
    });
    const activeSection = panel.querySelector(`#${targetId}`);
    if (activeSection) {
        activeSection.style.display = "flex";
    }
}
document.querySelector(".shop").addEventListener("click", () => {
    overlay.style.display = "flex";
    document.querySelector(".shop-popup").style.display = "flex";
    document.querySelector(".teams-popup").style.display = "none";
    document.querySelector(".home-popup").style.display = "none";
    document.querySelector(".settings-popup").style.display = "none";
});
document.querySelector(".teams").addEventListener("click", () => {
    overlay.style.display = "flex";
    document.querySelector(".teams-popup").style.display = "flex";
    document.querySelector(".shop-popup").style.display = "none";
    document.querySelector(".home-popup").style.display = "none";
    document.querySelector(".settings-popup").style.display = "none";
});
document.querySelector(".home").addEventListener("click", () => {
    overlay.style.display = "flex";
    document.querySelector(".teams-popup").style.display = "none";
    document.querySelector(".shop-popup").style.display = "none";
    document.querySelector(".home-popup").style.display = "flex";
    document.querySelector(".settings-popup").style.display = "none";
});
document.querySelector(".settings").addEventListener("click", () => {
    overlay.style.display = "flex";
    document.querySelector(".teams-popup").style.display = "none";
    document.querySelector(".shop-popup").style.display = "none";
    document.querySelector(".home-popup").style.display = "none";
    document.querySelector(".settings-popup").style.display = "flex";
});
overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
        overlay.style.display = "none";
  }
});

function openApp(side) {
    if (side === "left") {
        const panel = document.querySelector(".leftsidepanel");
        panel.style.flex = "0 0 300px";
        panel.style.marginRight = "0px";
        panel.style.borderRadius = "var(--radius-l)";
    }
    if (side === "right") {
        const panel = document.querySelector(".rightsidepanel");
        panel.style.flex = "0 0 300px";
        panel.style.marginLeft = "0px";
        panel.style.borderRadius = "var(--radius-l)";
    }
}
function closeApp(side) {
    if (side === "left") {
        const panel = document.querySelector(".leftsidepanel");
        panel.style.flex = "0 0 0px";
        panel.style.marginRight = "-10px";
        panel.style.borderRadius = "0px";
    }
    if (side === "right") {
        const panel = document.querySelector(".rightsidepanel");
        panel.style.flex = "0 0 0px";
        panel.style.marginLeft = "-10px";
        panel.style.borderRadius = "0px";
    }
}

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

const shopItems = [
    {name: "Click Boost", price: 2, description: "Your clicks count by a multiplier", filters: ["personal", "boost"] },
    {name: "Offline Auto-Click", price: 3, description: "Keeps clicking while you're away", filters: ["personal", "offline"] },
    {name: "Gravitate", price: 10, description: "Number drifts toward your target", filters: ["personal", "boost"] },
    {name: "Team Boost", price: 10, description: "Whole team clicks count double", filters: ["team", "boost"] },
    {name: "Team Offline", price: 8, description: "Whole team auto-clicks for 24 hours", filters: ["team", "offline"] },
    {name: "Team Flag", price: 2, description: "Custom flag for your team", filters: ["team", "cosmetic"] },
    {name: "Team Name", price: 0.60, description: "Register an official team name", filters: ["team", "cosmetic"] },
    {name: "Global Surge", price: 50, description: "Everyone gets double clicks for 1 hour", filters: ["global", "boost"] },
    {name: "Ad-Free Blessing", price: 50, description: "No ads for everyone for 3 days", filters: ["global", "power"] },
    {name: "News Message", price: 1, description: "Your message on the news bar for 1 hour", filters: ["global", "cosmetic"] }
];
let toggleFilter = {
    personal: false,
    global: false,
    team: false,
    boost: false,
    cosmetic: false,
    offline: false
};
function buildShop() {
    const container = document.querySelector(".shopmain");
    container.innerHTML = "";
    let trueFilters = [];
    for (const item of shopItems) {
        let showThisItem = false;
        for (const key in toggleFilter) {
            if (toggleFilter[key] === true && item.filters.includes(key)) {
                showThisItem = true;
            }
        }
        if (showThisItem === true) {
            trueFilters.push(item);
        }
    }
    if (trueFilters.length === 0) {
        trueFilters = shopItems;
    }
    for (const item of trueFilters) {
        const card = document.createElement("div");
        card.className = "shopcard";

        const name = document.createElement("div");
        name.className = "shopcard-name";
        name.textContent = item.name;

        const desc = document.createElement("div");
        desc.className = "shopcard-desc";
        desc.textContent = item.description;

        const price = document.createElement("div");
        price.className = "shopcard-price";
        price.textContent = "£" + item.price.toFixed(2);

        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(price);
        container.appendChild(card);
    }
  }
document.querySelector(".shopfilterpersonal").addEventListener("click", () => {
    toggleFilter["personal"] = !toggleFilter["personal"];
    buildShop();
});
document.querySelector(".shopfilterteam").addEventListener("click", () => {
    toggleFilter["team"] = !toggleFilter["team"];
    buildShop();
});
document.querySelector(".shopfilterglobal").addEventListener("click", () => {
    toggleFilter["global"] = !toggleFilter["global"];
    buildShop();
});
document.querySelector(".shopfilterboost").addEventListener("click", () => {
    toggleFilter["boost"] = !toggleFilter["boost"];
    buildShop();
});
document.querySelector(".shopfilteroffline").addEventListener("click", () => {
    toggleFilter["offline"] = !toggleFilter["offline"];
    buildShop();
});
document.querySelector(".shopfiltercosmetic").addEventListener("click", () => {
    toggleFilter["cosmetic"] = !toggleFilter["cosmetic"];
    buildShop();
});
buildShop();

let openApps = {
    left: null,
    right: null
};
document.querySelectorAll(".leftside button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (openApps.right == btn.className) {
            return;
        }
        if (openApps.left !== null) {
            openApps.left = null;
            closeApp("left");
        } else {
            openApps.left = btn.className;
            openApp("left");
            showAppSection('left', btn.className);
        }
    });
});
document.querySelectorAll(".rightside button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (openApps.left == btn.className) {
            return;
        }
        if (openApps.right !== null) {
            openApps.right = null;
            closeApp("right");
        } else {
            openApps.right = btn.className;
            openApp("right");
            showAppSection('right', btn.className);
        }
    });
});

const numberDisplayEl = document.querySelector(".numberdisplay");
const pendingChangeEl = document.querySelector(".pendingchange");

const smooth = 25;
let startNumber = 0;
let targetNumber = 0;
let currentNumber = 0;
let step = 0;
let hasReceivedServerValue = false;
let isInterpolating = false;

function setServerTarget(nextServerNumber) {
  const numeric = Number(nextServerNumber);
  if (Number.isNaN(numeric)) return;

  if (!hasReceivedServerValue) {
    hasReceivedServerValue = true;
    startNumber = numeric;
    targetNumber = numeric;
    currentNumber = numeric;
    step = smooth;
    isInterpolating = false;
    if (numberDisplayEl) {
      numberDisplayEl.textContent = currentNumber.toFixed(5);
    }
    return;
  }

  if (numeric === targetNumber) return;

  // Start smoothing from wherever the display currently is so there's no snap
  startNumber = currentNumber;
  targetNumber = numeric;
  step = 0;
  isInterpolating = true;
}

async function fetchSharedNumber() {
  try {
    const res = await fetch("/number", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setServerTarget(data.number);
  } catch (err) {
    console.error("Failed to fetch /number:", err);
  }
}

async function flushPendingChange() {
  if (pendingChange === 0) return;
  const deltaToSend = pendingChange;
  pendingChange = 0;
  if (pendingChangeEl) {
    pendingChangeEl.textContent = pendingChange.toFixed(0);
  }

  try {
    const res = await fetch("/number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change: deltaToSend })
    });
    if (!res.ok) return;
    const data = await res.json();
    setServerTarget(data.number);
  } catch (err) {
    console.error("Failed to post change:", err);
  }
}

// 100-step client-side smoothing loop
setInterval(() => {
  if (!isInterpolating || !numberDisplayEl) return;

  step += 1;
  const value = startNumber + ((targetNumber - startNumber) / smooth) * step;
  currentNumber = step >= smooth ? targetNumber : value;
  numberDisplayEl.textContent = currentNumber.toFixed(5);

  if (step >= smooth) {
    isInterpolating = false;
  }
}, 15);

// Poll the shared server number every 2 seconds
fetchSharedNumber();
setInterval(fetchSharedNumber, 2000);

// Flush queued clicks to the server every 20 seconds
setInterval(flushPendingChange, 20000);