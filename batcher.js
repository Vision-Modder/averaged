setInterval(() => {
  if (pendingChange !== 0) {
    console.log("Sending batch:", pendingChange);
    pendingChange = 0;
  }
}, 10000);
