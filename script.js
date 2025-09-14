let processCounter = 0;

function addRow() {
  // table , data add karne ke liye
  let table = document.getElementById("inputTable");
  let row = table.insertRow(-1);
  row.insertCell(
    0
  ).innerHTML = `<input type="text" value="P${processCounter++}">`;
  row.insertCell(
    1
  ).innerHTML = `<input type="number" min="0" placeholder="AT">`;
  row.insertCell(
    2
  ).innerHTML = `<input type="number" min="1" placeholder="BT">`;
  row.insertCell(
    3
  ).innerHTML = `<button class="delete" onclick="removeRow(this)">Delete</button>`;
}

window.onload = function () {
  for (let i = 0; i < 5; i++) {
    addRow();
  }
};

function removeRow(btn) {
  let row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
}

function getInputData() {
  let table = document.getElementById("inputTable");
  let data = [];
  for (let i = 1; i < table.rows.length; i++) {
    let name = table.rows[i].cells[0].querySelector("input").value.trim();
    let at = parseInt(table.rows[i].cells[1].querySelector("input").value);
    let bt = parseInt(table.rows[i].cells[2].querySelector("input").value);
    if (name && !isNaN(at) && !isNaN(bt)) {
      data.push({ name, at, bt });
    }
  }
  return data;
}

function toggleQuantum() {
  let algo = document.getElementById("algorithm").value;
  let quantumInput = document.getElementById("quantum");
  quantumInput.style.display = algo === "rr" ? "inline-block" : "none";
}

function runScheduling() {
  let processes = getInputData(); // data stored in processes named array
  if (processes.length === 0) {
    alert(
      "Please enter at least one process with valid Arrival and Burst times!"
    );
    return;
  }

  let algo = document.getElementById("algorithm").value;
  let result = [];

  if (algo === "fcfs") {
    processes.sort((a, b) => a.at - b.at);
    let time = 0;
    processes.forEach((p) => {
      time = Math.max(time, p.at) + p.bt;
      let tat = time - p.at;
      let wt = tat - p.bt;
      result.push({ ...p, ct: time, tat, wt });
    });
  } else if (algo === "sjf") {
    let time = 0,
      remaining = [...processes];
    while (remaining.length > 0) {
      let available = remaining.filter((p) => p.at <= time);
      if (available.length === 0) {
        time++;
        continue;
      }
      available.sort((a, b) => a.bt - b.bt);
      let p = available[0];
      time += p.bt;
      let tat = time - p.at;
      let wt = tat - p.bt;
      result.push({ ...p, ct: time, tat, wt });
      remaining = remaining.filter((x) => x !== p);
    }
  } else if (algo === "srjf") {
    let time = 0,
      done = 0;
    let remaining = processes.map((p) => ({ ...p, rt: p.bt }));
    while (done < processes.length) {
      let available = remaining.filter((p) => p.at <= time && p.rt > 0);
      if (available.length === 0) {
        time++;
        continue;
      }
      available.sort((a, b) => a.rt - b.rt);
      let p = available[0];
      p.rt--;
      time++;
      if (p.rt === 0) {
        done++;
        let tat = time - p.at;
        let wt = tat - p.bt;
        result.push({ ...p, ct: time, tat, wt });
      }
    }
  } else if (algo === "rr") {
    let quantum = parseInt(document.getElementById("quantum").value);
    if (isNaN(quantum) || quantum <= 0) {
      alert("Please enter a valid Time Quantum");
      return;
    }

    let time = 0;
    let queue = [];
    let completed = 0;
    let remaining = processes.map((p) => ({ ...p, rt: p.bt, inQueue: false }));

    // Sort by arrival time
    remaining.sort((a, b) => a.at - b.at);

    while (completed < processes.length) {
      // Add all processes that have arrived by current time to queue
      remaining.forEach((p) => {
        if (p.at <= time && !p.inQueue && p.rt > 0) {
          queue.push(p);
          p.inQueue = true;
        }
      });

      if (queue.length === 0) {
        // No process in queue, advance time to next arrival
        let nextArrival = remaining.filter((p) => p.rt > 0).map((p) => p.at);
        if (nextArrival.length > 0) {
          time = Math.min(...nextArrival);
        }
        continue;
      }

      // Get next process from queue
      let currentProcess = queue.shift();
      currentProcess.inQueue = false;

      // Execute for quantum time or remaining time, whichever is smaller
      let execTime = Math.min(quantum, currentProcess.rt);
      currentProcess.rt -= execTime;
      time += execTime;

      // Check for newly arrived processes during execution
      remaining.forEach((p) => {
        if (p.at <= time && !p.inQueue && p.rt > 0 && p !== currentProcess) {
          queue.push(p);
          p.inQueue = true;
        }
      });

      // If process is not finished, put it back in queue
      if (currentProcess.rt > 0) {
        queue.push(currentProcess);
        currentProcess.inQueue = true;
      } else {
        // Process completed
        completed++;
        let tat = time - currentProcess.at;
        let wt = tat - currentProcess.bt;
        result.push({
          name: currentProcess.name,
          at: currentProcess.at,
          bt: currentProcess.bt,
          ct: time,
          tat,
          wt,
        });
      }
    }
  }
  displayOutput(result, processes.length);
}

function displayOutput(result, totalProcesses) {
  let avgtat = 0,
    avgwt = 0;
  let outTable = document.getElementById("outputTable");
  outTable.innerHTML = `
        <tr>
            <th>Process</th>
            <th>Arrival Time</th>
            <th>Burst Time</th>
            <th>Completion Time</th>
            <th>Turnaround Time</th>
            <th>Waiting Time</th>
        </tr>`;
  result.forEach((r) => {
    let row = outTable.insertRow(-1);
    row.insertCell(0).innerText = r.name;
    row.insertCell(1).innerText = r.at;
    row.insertCell(2).innerText = r.bt;
    row.insertCell(3).innerText = r.ct;
    row.insertCell(4).innerText = r.tat;
    avgtat += r.tat;
    avgwt += r.wt;
    row.insertCell(5).innerText = r.wt;
  });

  let totalTime = Math.max(...result.map((r) => r.ct));
  document.getElementById("throughput").innerText =
    "Throughput =  " +
    `${totalProcesses} / ${totalTime}` +
    " = " +
    (totalProcesses / totalTime).toFixed(2);
  document.getElementById("avgvalues").innerText =
    "Average Turnaround Time = " +
    avgtat / totalProcesses +
    ", Average Waiting Time = " +
    (avgwt / totalProcesses).toFixed(2);
}
