let workers = [];
let numWorkers = navigator.hardwareConcurrency || 4; // Number of logical cores available
let activeWorkers = 0;

document
  .getElementById("startTestButton")
  .addEventListener("click", function () {
    // prevent starting the test multiple times
    document.getElementById("startTestButton").disabled = true;
    document.getElementById("status").textContent = "";
    document.getElementById("cpuUsage").textContent = "cpu test starting...";

    activeWorkers = 0;
    workers = [];

    // multiple workers for CPU stress
    for (let i = 0; i < numWorkers; i++) {
      let worker = new Worker("cpuWorker.js");

      worker.onmessage = (e) => {
        if (e.data === "done") {
          activeWorkers++;
          if (activeWorkers === numWorkers) {
            document.getElementById("status").textContent =
              "Stress test completed!";
            document.getElementById("cpuUsage").textContent = "Test finished.";
            document.getElementById("startTestButton").disabled = false; // Re-enable button
          }
        }
      };

      worker.onerror = (error) => {
        console.error("Error in worker:", error);
        document.getElementById("status").textContent = "Test failed!";
        document.getElementById("cpuUsage").textContent = "";
        document.getElementById("startTestButton").disabled = false; // Re-enable button
      };

      workers.push(worker);
    }
  });
