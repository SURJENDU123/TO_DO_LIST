// Load tasks from localStorage or initialize an empty list
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Track the selected filter value
let currentFilter = "all";

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("taskDate");
  if (dateInput) {
    dateInput.setAttribute("min", today); // Disallow past dates for new task
  }

  renderTasks(); // Initial render

  // On page load, ensure light mode is default
window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("dark-mode"); // Remove dark mode
  const icon = document.getElementById("themeIcon");
  icon.classList.remove("fa-moon");
  icon.classList.add("fa-sun");
  document.getElementById("themeToggle").checked = false;
});

  // Close filter dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("filterDropdown");
    const filterBtn = document.querySelector(".btn.btn-light");
    if (!dropdown.contains(event.target) && !filterBtn.contains(event.target)) {
      dropdown.classList.add("d-none");
    }
  });

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const toggle = document.getElementById("themeToggle");
    if (toggle) toggle.checked = true;
  }
});

// Toggle custom filter dropdown menu
function toggleFilter() {
  const dropdown = document.getElementById("filterDropdown");
  dropdown.classList.toggle("d-none");
}

// Set filter and re-render tasks
function setFilter(value) {
  currentFilter = value;
  renderTasks();
  toggleFilter(); // Close dropdown after selection
}

// Render tasks to the UI based on current filter
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const noTaskMsg = document.getElementById("noTaskMsg");
  const today = new Date().toISOString().split("T")[0];

  taskList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    const taskDate = task.date;
    const isToday = taskDate === today;
    const isUpcoming = taskDate > today;
    const isPast = taskDate < today;
    switch (currentFilter) {
      case "today": return isToday;
      case "upcoming": return isUpcoming;
      case "past": return isPast;
      case "completed": return task.completed === true;
      case "incomplete": return task.completed === false;
      case "priority-high": return task.priority === "high";
      case "priority-normal": return task.priority === "normal";
      case "priority-low": return task.priority === "low";
      default: return true;
    }
  });

  noTaskMsg.style.display = filteredTasks.length === 0 ? "block" : "none";

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");

    if (task.editing) {
      li.className = "editing";
      li.innerHTML = `
  <input type="text" value="${task.text}" id="edit-text-${index}" placeholder="Task name" class="edit-input">
  <input type="date" id="edit-date-${index}" class="edit-input">
  <input type="time" id="edit-time-${index}" class="edit-input">
  <select id="edit-priority-${index}" class="edit-input">
    <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
    <option value="normal" ${task.priority === "normal" ? "selected" : ""}>Normal</option>
    <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
  </select>

${!task.hasReminder ? `
  <div class="edit-input">
    <label>
      <input type="checkbox" id="edit-reminder-${index}" onchange="toggleEditAlarmOptions(${index})">
      Enable Alarm
    </label>
    <div id="edit-alarm-options-${index}" class="d-none mt-1">
      <select id="edit-alarm-sound-${index}" class="form-select form-select-sm">
      <option value="">Select a sound</option>
      <option value="songs/alarm.mp3">Default Alarm</option>
      <option value="songs/Ram_shiya_ram.mp3">Ram Shiya Ram</option>
      <option value="songs/tum_prem_ho.mp3">Tum Prem Ho</option>
      <option value="songs/Felix_cartal_clock.mp3">Felix_cartal_clock</option>
      <option value="songs/Hunkar_Bhara.mp3">Hunkar_Bhara</option>
      <option value="songs/Get_Ready_To_Fight.mp3">Get_Ready_To_Fight</option>
      </select>
    </div>
  </div>
` : `
  <div class="edit-input">
    <span class="reminder-label text-success">🔒 Alarm is already set and cannot be changed.</span>
  </div>
`}


  <div class="edit-actions">
    <button onclick="updateTask(${index})">Save Changes</button>
    <button onclick="cancelEdit(${index})">Cancel</button>
  </div>
  `;

      setTimeout(() => {
        const dateInput = document.getElementById(`edit-date-${index}`);
        const timeInput = document.getElementById(`edit-time-${index}`);
        const today = new Date().toISOString().split("T")[0];
        if (dateInput) {
          dateInput.setAttribute("min", today);
          dateInput.value = task.date;
        }
        if (timeInput) {
          timeInput.value = task.time;
        }
      }, 0);
    } else {
      li.innerHTML = `
  <div class="task-content" onclick="toggleComplete(${index})">
    <div class="task-title">
      ${task.text}
      <span class="priority-badge ${task.priority || "normal"}">${task.priority || "normal"}</span>
    </div>
    <div class="task-datetime">
      ${formatDate(task.date)} • ${formatTime12Hour(task.time)}
      ${task.hasReminder ? '<span class="reminder-label">⏰ Reminder Set</span>' : ""}
    </div>
  </div>
  <div class="actions">
    <button onclick="editTask(${index})" class="edit-btn">Edit</button>
    <button onclick="confirmDelete(${index})" class="delete-btn">Delete</button>
  </div>
  `;
      if (task.completed) li.classList.add("completed");
    }

    taskList.appendChild(li);
  });
}

function showSuccessToast(message = "Task added successfully!") {
  const toastElement = document.getElementById("taskToast");
  const toastBody = toastElement.querySelector(".toast-body");
  toastBody.textContent = message;
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

function showToast() {
  const toast = new bootstrap.Toast(document.getElementById("taskToast"));
  toast.show();
}

function addTask() {
  const input = document.getElementById("taskInput");
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;
  const priority = document.getElementById("taskPriority").value || "normal";
  const text = input.value.trim();
  const hasReminder = document.getElementById("enableAlarm").checked;
  const selectedSound = document.getElementById("alarmSoundSelect").value;

  if (text && date && time) {
    tasks.push({
      text,
      date,
      time,
      priority,
      editing: false,
      completed: false,
      hasReminder: hasReminder,
      alarmSound: hasReminder ? selectedSound : "",
      reminded: false
    });

    saveTasks();

    input.value = "";
    document.getElementById("taskDate").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("taskPriority").value = "normal";
    document.getElementById("alarmSoundSelect").value = "";
    document.getElementById("enableAlarm").checked = false;
    document.getElementById("alarmOptions").classList.add("d-none");

    if (hasReminder && selectedSound) {
      playAlarm(selectedSound);
    }

    // Save toast message to show after reload
    sessionStorage.setItem("showSuccessToast", "Task added successfully!");
    window.location.href = window.location.href;

  } else {
    alert("Please fill in all fields (task name, date, time, and priority).");
  }
}

// Show toast if saved in sessionStorage after reload
document.addEventListener("DOMContentLoaded", () => {
  const toastMessage = sessionStorage.getItem("showSuccessToast");
  if (toastMessage) {
    showSuccessToast(toastMessage);
    sessionStorage.removeItem("showSuccessToast"); // clear after showing
  }
});

function scheduleReminder(task, index) {
  // Normalize time input to avoid timezone mismatches
  const [hours, minutes] = task.time.split(':').map(Number);
  const [year, month, day] = task.date.split('-').map(Number);
  const taskTime = new Date(year, month - 1, day, hours, minutes, 0); // Local time

  const now = new Date();
  const delay = taskTime.getTime() - now.getTime();

  if (delay > 0) {
    // Schedule in future
    setTimeout(() => {
      playAlarm(task);
    }, delay);
  } else {
    // Time is now or passed
    playAlarm(task);
  }
}

function playAlarm(task) {
  if (task.hasReminder) {
    const song = new Audio(task.alarmSound || "default.mp3");
    song.loop = true;
    song.play();

    alert(`🔔 Reminder: ${task.text}`);
    song.pause();
  }
}


function editTask(index) {
  tasks[index].editing = true;
  renderTasks();
}

function cancelEdit(index) {
  tasks[index].editing = false;
  renderTasks();
}

function updateTask(index) {
  const updatedText = document.getElementById(`edit-text-${index}`).value.trim();
  const updatedDate = document.getElementById(`edit-date-${index}`).value;
  const updatedTime = document.getElementById(`edit-time-${index}`).value;
  const updatedPriority = document.getElementById(`edit-priority-${index}`).value;

  if (!updatedText || !updatedDate || !updatedTime) {
    alert("Please fill in all fields.");
    return;
  }

  const task = tasks[index];
  task.text = updatedText;
  task.date = updatedDate;
  task.time = updatedTime;
  task.priority = updatedPriority;
  task.editing = false;

  // If alarm hasn't been set before, allow setting it now
  if (!task.hasReminder) {
    const enableReminder = document.getElementById(`edit-reminder-${index}`)?.checked;
    const selectedSound = document.getElementById(`edit-alarm-sound-${index}`)?.value;

    task.hasReminder = enableReminder;
    task.alarmSound = enableReminder ? selectedSound : "";
  }

  // Reset reminded flag to allow future alerts
  task.reminded = false;

  saveTasks();

  // 🔔 Check if alarm should trigger immediately after edit
  const taskTime = new Date(`${task.date}T${task.time}`);
  const now = new Date();
  if (
    task.hasReminder &&
    now.getFullYear() === taskTime.getFullYear() &&
    now.getMonth() === taskTime.getMonth() &&
    now.getDate() === taskTime.getDate() &&
    now.getHours() === taskTime.getHours() &&
    now.getMinutes() === taskTime.getMinutes()
  ) {
    // Play alarm immediately
    playAlarm(task);
    task.reminded = true;
    saveTasks(); // update reminded flag
  }

  alert("Task updated successfully.");
}


function confirmDelete(index) {
  if (confirm("Are you sure you want to delete this task?")) {
    deleteTask(index);
  }
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

function formatDate(dateStr) {
  const options = { weekday: "short", month: "short", day: "numeric" };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

function formatTime12Hour(timeStr) {
  const [hours, minutes] = timeStr.split(":");
  let hour = parseInt(hours);
  let ampm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
}

// Toggle function
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  const icon = document.getElementById('themeIcon');
  if (isDark) {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  } else {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
}

function toggleAlarmOptions() {
  const enableAlarm = document.getElementById("enableAlarm");
  const alarmOptions = document.getElementById("alarmOptions");
  alarmOptions.classList.toggle("d-none", !document.getElementById("enableAlarm").checked);
}

const alarmSound = document.getElementById("alarmSound");
const alarmSource = document.getElementById("alarmSource");
const soundSelect = document.getElementById("alarmSoundSelect");

let currentSound = "";

// 🔁 Auto-play when sound is changed
soundSelect.addEventListener("change", () => {
  const selectedSound = soundSelect.value;

  if (!selectedSound) {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    return;
  }

  if (selectedSound !== currentSound) {
    alarmSource.src = selectedSound;
    alarmSound.load();
    alarmSound.play();
    currentSound = selectedSound;
  }
  
});

function toggleEditAlarmOptions(index) {
  const checkbox = document.getElementById(`edit-reminder-${index}`);
  const optionsDiv = document.getElementById(`edit-alarm-options-${index}`);
  if (checkbox.checked) {
    optionsDiv.classList.remove("d-none");
  } else {
    optionsDiv.classList.add("d-none");
  }
}

setInterval(checkTaskReminders, 30000);

function checkTaskReminders() {
  const now = new Date();

  tasks.forEach((task) => {
    if (
      task.date === now.toISOString().split("T")[0] &&
      !task.completed &&
      task.hasReminder &&
      !task.reminded
    ) {
      const taskTime = new Date(`${task.date}T${task.time}`);

      if (
        now.getFullYear() === taskTime.getFullYear() &&
        now.getMonth() === taskTime.getMonth() &&
        now.getDate() === taskTime.getDate() &&
        now.getHours() === taskTime.getHours() &&
        now.getMinutes() === taskTime.getMinutes()
      ) {
        task.reminded = true;
        saveTasks();

        let alarm;
        let isCustom = false;

        if (task.alarmSound) {
          alarm = new Audio(task.alarmSound); // Create new Audio object for custom sound
          isCustom = true;
        } else {
          alarm = document.getElementById("alarmSound"); // Default audio element
        }

        if (alarm) {
          // Ensure loop
          if (isCustom) {
            // Custom alarm (new Audio object)
            alarm.loop = true;
          } else {
            alarm.loop = true;
            alarm.currentTime = 0;
          }

          // Start playing the alarm in a loop
          const playPromise = alarm.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Wait for user to dismiss
                const stopAlarm = () => {
                  alert(`⏰ Reminder: "${task.text}" is scheduled for now!`);
                  alarm.pause();
                  alarm.currentTime = 0;
                  alarm.loop = false;
                };
                stopAlarm();
              })
              .catch((error) => {
                console.error("Alarm play error:", error);
                alert(`⏰ Reminder: "${task.text}" is scheduled for now!`);
              });
          }
        } else {
          alert(`⏰ Reminder: "${task.text}" is scheduled for now!`);
        }
      }
    }
  });
}


