// =============================================
// LOCAL STORAGE MANAGER
// =============================================
const StorageManager = {
  saveTasks(tasks) {
    localStorage.setItem("devDeskTasks", JSON.stringify(tasks));
  },

  loadTasks() {
    const tasks = localStorage.getItem("devDeskTasks");
    return tasks ? JSON.parse(tasks) : [];
  },

  saveTimerSessions(sessions) {
    localStorage.setItem("devDeskTimerSessions", JSON.stringify(sessions));
  },

  loadTimerSessions() {
    const sessions = localStorage.getItem("devDeskTimerSessions");
    return sessions ? JSON.parse(sessions) : [];
  },

  saveSettings(settings) {
    localStorage.setItem("devDeskSettings", JSON.stringify(settings));
  },

  loadSettings() {
    const settings = localStorage.getItem("devDeskSettings");
    return settings
      ? JSON.parse(settings)
      : { sortBy: "date", notifications: true };
  },
};

// =============================================
// TASK MANAGER
// =============================================
const TaskManager = {
  tasks: [],
  currentEditId: null,
  currentSort: "date",

  init() {
    this.loadTasks();
    this.setupEventListeners();
    this.initializeButtonValidation();
    this.checkScheduledTasks();
    // Check for due tasks every minute
    setInterval(() => this.checkScheduledTasks(), 60000);
  },

  loadTasks() {
    this.tasks = StorageManager.loadTasks();
    this.applySorting();
    this.renderTasks();
  },

  saveTasks() {
    StorageManager.saveTasks(this.tasks);
  },

  addTask(title, content, category, dueDateTime) {
    const task = {
      id: Date.now().toString(),
      title,
      content,
      category,
      dueDateTime,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasTimer: false,
      scheduled: dueDateTime ? true : false,
      notified: false,
    };

    this.tasks.push(task);
    this.saveTasks();
    this.applySorting();
    this.renderTasks();
    return task.id;
  },

  updateTask(id, title, content, category, dueDateTime) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.title = title;
      task.content = content;
      task.category = category;
      task.dueDateTime = dueDateTime;
      task.updatedAt = new Date().toISOString();
      task.scheduled = dueDateTime ? true : false;
      task.notified = false;
      this.saveTasks();
      this.applySorting();
      this.renderTasks();
      return true;
    }
    return false;
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.saveTasks();
    this.renderTasks();
  },

  applySorting() {
    if (this.currentSort === "date") {
      this.tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (this.currentSort === "priority") {
      const priorityOrder = {
        Urgent: 0,
        Freelancing: 1,
        "Code Ideas": 2,
        General: 3,
      };
      this.tasks.sort(
        (a, b) => priorityOrder[a.category] - priorityOrder[b.category]
      );
    }
  },

  checkScheduledTasks() {
    const now = new Date();
    this.tasks.forEach((task) => {
      if (task.dueDateTime && !task.completed && !task.notified) {
        const dueDate = new Date(task.dueDateTime);
        const timeDiff = dueDate - now;
        const minutesUntilDue = timeDiff / (1000 * 60);

        // Notify if due within 15 minutes
        if (minutesUntilDue > 0 && minutesUntilDue <= 15) {
          this.showNotification(
            `🔔 Task "${task.title}" is due in ${Math.round(
              minutesUntilDue
            )} minutes!`,
            "alarm"
          );
          task.notified = true;
          this.saveTasks();
        }

        // Notify if overdue
        if (timeDiff < 0 && !task.overdueNotified) {
          this.showNotification(`⚠️ Task "${task.title}" is overdue!`, "error");
          task.overdueNotified = true;
          this.saveTasks();
        }
      }
    });
  },

  renderTasks() {
    const container = document.getElementById("notes-container");
    if (!container) return;

    if (this.tasks.length === 0) {
      container.innerHTML =
        '<p class="col-span-full text-center text-gray-500 italic">No tasks yet. Create your first task above!</p>';
      return;
    }

    container.innerHTML = this.tasks
      .map((task) => {
        const dueDateTime = task.dueDateTime
          ? new Date(task.dueDateTime)
          : null;
        const now = new Date();
        const isOverdue = dueDateTime && dueDateTime < now;
        const isDueSoon = dueDateTime && dueDateTime - now <= 30 * 60 * 1000; // 30 minutes

        let contentHtml = "";
        try {
          contentHtml = marked.parse(task.content || "");
        } catch (e) {
          contentHtml = task.content || "";
        }

        const taskClass = isOverdue
          ? "overdue-task"
          : isDueSoon
          ? "due-soon-task"
          : "";

        return `
                        <div class="dev-panel p-5 flex flex-col h-full ${taskClass}" data-task-id="${
          task.id
        }">
                            <div class="flex justify-between items-start mb-3">
                                <h3 class="text-lg font-bold text-gray-800 truncate">${
                                  task.title
                                }</h3>
                                <span class="text-xs font-medium px-2 py-1 rounded-full ${this.getCategoryColor(
                                  task.category
                                )}">
                                    ${task.category}
                                </span>
                            </div>
                            <div class="markdown-content flex-grow mb-4 overflow-y-auto max-h-40">${contentHtml}</div>
                            <div class="mt-auto pt-4 border-t border-gray-100">
                                ${
                                  dueDateTime
                                    ? `
                                    <p class="text-sm ${
                                      isOverdue
                                        ? "text-red-600 font-bold"
                                        : isDueSoon
                                        ? "text-orange-600 font-medium"
                                        : "text-gray-500"
                                    }">
                                        ⏰ ${dueDateTime.toLocaleString()}
                                        ${
                                          isOverdue
                                            ? " (Overdue)"
                                            : isDueSoon
                                            ? " (Due Soon)"
                                            : ""
                                        }
                                    </p>
                                `
                                    : ""
                                }
                                <div class="flex justify-between mt-3">
                                    <button class="edit-btn px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition" data-id="${
                                      task.id
                                    }">Edit</button>
                                    <button class="start-timer-btn px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition" data-id="${
                                      task.id
                                    }" data-title="${
          task.title
        }">Start Timer</button>
                                    <button class="delete-btn px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition" data-id="${
                                      task.id
                                    }">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
      })
      .join("");

    this.attachTaskEventListeners();
  },

  getCategoryColor(category) {
    const colors = {
      Freelancing: "bg-purple-100 text-purple-800",
      "Code Ideas": "bg-blue-100 text-blue-800",
      General: "bg-gray-100 text-gray-800",
      Urgent: "bg-red-100 text-red-800",
    };
    return colors[category] || colors.General;
  },

  attachTaskEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        this.openEditModal(taskId);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        this.openDeleteModal(taskId);
      });
    });

    document.querySelectorAll(".start-timer-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        const taskTitle = e.target.dataset.title;
        ProfessionalTimer.setActiveTask(taskId, taskTitle);
        this.showNotification(`Timer ready for: ${taskTitle}`, "info");
      });
    });
  },

  openEditModal(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      document.getElementById("edit-note-id").value = task.id;
      document.getElementById("edit-note-title").value = task.title;
      document.getElementById("edit-note-content").value = task.content;
      document.getElementById("edit-note-category").value = task.category;
      document.getElementById("edit-note-datetime").value =
        task.dueDateTime || "";
      document.getElementById("edit-modal").classList.remove("hidden");
      this.currentEditId = taskId;
    }
  },

  openDeleteModal(taskId) {
    this.currentEditId = taskId;
    document.getElementById("confirmation-modal").classList.remove("hidden");
  },

  closeEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");
    this.currentEditId = null;
  },

  closeDeleteModal() {
    document.getElementById("confirmation-modal").classList.add("hidden");
    this.currentEditId = null;
  },

  setupEventListeners() {
    // Add task form
    document.getElementById("note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("note-title").value.trim();
      const content = document.getElementById("note-content").value;
      const category = document.getElementById("note-category").value;
      const dueDateTime =
        document.getElementById("note-datetime").value || null;

      if (!title) {
        this.showNotification("Please enter a task title", "error");
        return;
      }

      this.addTask(title, content, category, dueDateTime);
      e.target.reset();
      this.showNotification("Task added successfully!", "success");
      this.checkButtonState();

      // Hide timer options
      document.getElementById("task-timer-options").classList.add("hidden");
    });

    // Edit task form
    document
      .getElementById("edit-note-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("edit-note-title").value;
        const content = document.getElementById("edit-note-content").value;
        const category = document.getElementById("edit-note-category").value;
        const dueDateTime =
          document.getElementById("edit-note-datetime").value || null;

        if (this.currentEditId) {
          this.updateTask(
            this.currentEditId,
            title,
            content,
            category,
            dueDateTime
          );
          this.closeEditModal();
          this.showNotification("Task updated successfully!", "success");
        }
      });

    // Sort buttons
    document.getElementById("sort-by-date").addEventListener("click", () => {
      this.currentSort = "date";
      this.applySorting();
      this.renderTasks();
      this.showNotification("Sorted by date", "info");
    });

    document
      .getElementById("sort-by-priority")
      .addEventListener("click", () => {
        this.currentSort = "priority";
        this.applySorting();
        this.renderTasks();
        this.showNotification("Sorted by priority", "info");
      });

    // Modal controls
    document
      .getElementById("cancel-edit")
      .addEventListener("click", () => this.closeEditModal());
    document
      .getElementById("cancel-confirm")
      .addEventListener("click", () => this.closeDeleteModal());
    document.getElementById("execute-confirm").addEventListener("click", () => {
      if (this.currentEditId) {
        this.deleteTask(this.currentEditId);
        this.closeDeleteModal();
        this.showNotification("Task deleted successfully!", "success");
      }
    });

    // Close modals on backdrop click
    document.getElementById("edit-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeEditModal();
    });
    document
      .getElementById("confirmation-modal")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) this.closeDeleteModal();
      });

    // DateTime input change handler
    document
      .getElementById("note-datetime")
      .addEventListener("change", function () {
        const timerOptions = document.getElementById("task-timer-options");
        if (this.value) {
          timerOptions.classList.remove("hidden");
        } else {
          timerOptions.classList.add("hidden");
        }
      });
  },

  initializeButtonValidation() {
    const titleInput = document.getElementById("note-title");
    const addButton = document.getElementById("add-task-btn");

    if (!titleInput || !addButton) return;

    addButton.disabled = true;

    titleInput.addEventListener("input", () => {
      this.checkButtonState();
    });

    this.checkButtonState();
  },

  checkButtonState() {
    const titleInput = document.getElementById("note-title");
    const addButton = document.getElementById("add-task-btn");

    if (titleInput && addButton) {
      const hasContent = titleInput.value.trim().length > 0;
      addButton.disabled = !hasContent;
    }
  },

  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    const bgColor =
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : type === "warning"
        ? "bg-yellow-500"
        : type === "alarm"
        ? "bg-orange-500"
        : "bg-blue-500";

    toast.className = `${bgColor} px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    toast.textContent = message;

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove("translate-x-full"), 10);

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },
};

// =============================================
// PROFESSIONAL TIMER
// =============================================
const ProfessionalTimer = {
  timerInterval: null,
  currentDuration: 0,
  totalDuration: 0,
  isRunning: false,
  isPaused: false,
  currentMode: "custom",
  sessions: [],
  currentSession: 1,
  totalSessions: 4,
  activeTask: null,
  activeTaskTitle: null,

  modes: {
    pomodoro: { minutes: 25, label: "Pomodoro" },
    "deep-work": { minutes: 90, label: "Deep Work" },
    custom: { minutes: 60, label: "Custom" },
  },

  init() {
    this.loadSessions();
    this.setupEventListeners();
    this.setMode("pomodoro");
    this.updateDisplay();
  },

  setupEventListeners() {
    document
      .getElementById("timer-start")
      .addEventListener("click", () => this.start());
    document
      .getElementById("timer-pause")
      .addEventListener("click", () => this.pause());
    document
      .getElementById("timer-reset")
      .addEventListener("click", () => this.reset());

    // Mode buttons
    document
      .getElementById("pomodoro-mode")
      .addEventListener("click", () => this.setMode("pomodoro"));
    document
      .getElementById("deep-work-mode")
      .addEventListener("click", () => this.setMode("deep-work"));
    document
      .getElementById("custom-mode")
      .addEventListener("click", () => this.setMode("custom"));

    // Quick timer buttons for tasks
    document.querySelectorAll(".quick-timer-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const minutes = parseInt(e.target.dataset.minutes);
        this.setTimerForTask(minutes);
        TaskManager.showNotification(
          `Timer set for ${minutes} minutes for this task!`,
          "success"
        );
      });
    });

    // Custom time inputs
    ["timer-hours", "timer-minutes", "timer-seconds"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("change", () => {
          if (this.currentMode === "custom") {
            this.updateCustomDuration();
          }
        });
      }
    });
  },

  setMode(mode) {
    this.currentMode = mode;
    this.reset();

    // Update UI
    document
      .getElementById("pomodoro-mode")
      .classList.toggle("bg-green-700", mode === "pomodoro");
    document
      .getElementById("deep-work-mode")
      .classList.toggle("bg-blue-700", mode === "deep-work");
    document
      .getElementById("custom-mode")
      .classList.toggle("bg-purple-700", mode === "custom");

    document
      .getElementById("custom-time-input")
      .classList.toggle("hidden", mode !== "custom");
    document
      .getElementById("session-info")
      .classList.toggle("hidden", mode !== "pomodoro");

    if (mode === "pomodoro") {
      this.totalDuration = this.modes.pomodoro.minutes * 60;
    } else if (mode === "deep-work") {
      this.totalDuration = this.modes["deep-work"].minutes * 60;
    } else {
      this.updateCustomDuration();
    }

    this.currentDuration = this.totalDuration;
    this.updateDisplay();
    document.getElementById("timer-mode").textContent = this.modes[mode].label;
  },

  setTimerForTask(minutes) {
    this.setMode("custom");
    document.getElementById("timer-hours").value = Math.floor(minutes / 60);
    document.getElementById("timer-minutes").value = minutes % 60;
    document.getElementById("timer-seconds").value = 0;
    this.updateCustomDuration();
    this.start();
  },

  setActiveTask(taskId, taskTitle) {
    this.activeTask = taskId;
    this.activeTaskTitle = taskTitle;
    const taskInfo = document.getElementById("active-task-info");
    taskInfo.textContent = `Working on: ${taskTitle}`;
    taskInfo.classList.remove("hidden");

    // Highlight the active task
    document.querySelectorAll("[data-task-id]").forEach((el) => {
      el.classList.remove("task-with-timer");
    });
    const activeTaskEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (activeTaskEl) {
      activeTaskEl.classList.add("task-with-timer");
    }
  },

  updateCustomDuration() {
    const hours = parseInt(document.getElementById("timer-hours").value) || 0;
    const minutes =
      parseInt(document.getElementById("timer-minutes").value) || 0;
    const seconds =
      parseInt(document.getElementById("timer-seconds").value) || 0;

    this.totalDuration = hours * 3600 + minutes * 60 + seconds;
    this.currentDuration = this.totalDuration;
    this.updateDisplay();
  },

  start() {
    if (this.isRunning) return;

    if (this.currentDuration <= 0) {
      this.currentDuration = this.totalDuration;
    }

    Tone.start();
    this.isRunning = true;
    this.isPaused = false;

    const startTime = Date.now();
    const targetTime = startTime + this.currentDuration * 1000;

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const remaining = Math.max(
        0,
        Math.round((targetTime - currentTime) / 1000)
      );
      this.currentDuration = remaining;

      this.updateDisplay();
      this.updateProgress();

      if (remaining <= 0) {
        this.complete();
      }
    }, 100);

    this.updateButtons();
    TaskManager.showNotification("Timer started! Focus on your task.", "info");
  },

  pause() {
    if (!this.isRunning) return;

    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isPaused = true;
    this.updateButtons();
    TaskManager.showNotification("Timer paused", "warning");
  },

  reset() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isPaused = false;

    if (this.currentMode === "custom") {
      this.updateCustomDuration();
    } else {
      this.currentDuration = this.totalDuration;
    }

    this.updateDisplay();
    this.updateProgress();
    this.updateButtons();
    document.getElementById("timer-box").classList.remove("alarm-on");
  },

  complete() {
    clearInterval(this.timerInterval);
    this.isRunning = false;

    this.saveSession();
    this.playAlarm();

    document.getElementById("timer-box").classList.add("alarm-on");

    let message = "🚨 Timer Complete! Great work!";
    if (this.activeTaskTitle) {
      message = `🚨 Timer Complete! Great work on "${this.activeTaskTitle}"!`;
    }

    // Pomodoro session handling
    if (this.currentMode === "pomodoro") {
      this.currentSession++;
      if (this.currentSession > this.totalSessions) {
        this.currentSession = 1;
        message = "🎉 All sessions complete! Take a longer break.";
      } else {
        message = "Session complete! Take a short break.";
      }
      document.getElementById("current-session").textContent =
        this.currentSession;
    }

    TaskManager.showNotification(message, "success");
    this.updateButtons();

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("DevDesk Timer Complete!", {
        body: message,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⏰</text></svg>",
      });
    }

    // Reset active task highlighting
    this.activeTask = null;
    this.activeTaskTitle = null;
    document.getElementById("active-task-info").classList.add("hidden");
    document.querySelectorAll(".task-with-timer").forEach((el) => {
      el.classList.remove("task-with-timer");
    });
  },

  playAlarm() {
    const synth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.5 },
    }).toDestination();

    synth.triggerAttackRelease("C5", "8n");
    setTimeout(() => synth.triggerAttackRelease("E5", "8n"), 300);
    setTimeout(() => synth.triggerAttackRelease("G5", "4n"), 600);
  },

  updateDisplay() {
    const hours = Math.floor(this.currentDuration / 3600);
    const minutes = Math.floor((this.currentDuration % 3600) / 60);
    const seconds = this.currentDuration % 60;

    const format = (num) => String(num).padStart(2, "0");
    document.getElementById("timer-display").textContent = `${format(
      hours
    )}:${format(minutes)}:${format(seconds)}`;
  },

  updateProgress() {
    const progressBar = document.getElementById("timer-progress");
    if (!progressBar) return;

    const progress =
      this.totalDuration > 0
        ? ((this.totalDuration - this.currentDuration) / this.totalDuration) *
          100
        : 0;

    progressBar.style.width = `${progress}%`;

    // Color changes based on progress
    if (progress < 25) {
      progressBar.style.background =
        "linear-gradient(90deg, #10b981 0%, #10b981 100%)";
    } else if (progress < 50) {
      progressBar.style.background =
        "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)";
    } else if (progress < 75) {
      progressBar.style.background =
        "linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #f59e0b 100%)";
    } else {
      progressBar.style.background =
        "linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #ef4444 100%)";
    }
  },

  updateButtons() {
    document.getElementById("timer-start").disabled = this.isRunning;
    document.getElementById("timer-pause").disabled = !this.isRunning;
    document.getElementById("timer-start").textContent = this.isPaused
      ? "▶ Resume"
      : "▶ Start";
  },

  saveSession() {
    const session = {
      mode: this.currentMode,
      duration: this.totalDuration,
      completedAt: new Date().toISOString(),
      task: this.activeTaskTitle,
    };

    this.sessions.push(session);
    StorageManager.saveTimerSessions(this.sessions);
  },

  loadSessions() {
    this.sessions = StorageManager.loadTimerSessions();
  },
};

// =============================================
// MARKDOWN TOOLBAR
// =============================================
function createMarkdownToolbar(toolbarId, textareaId) {
  const toolbar = document.getElementById(toolbarId);
  const textarea = document.getElementById(textareaId);

  if (!toolbar || !textarea) return;

  const tools = [
    {
      icon: "B",
      syntax: "**",
      placeholder: "bold text",
      type: "wrap",
      title: "Bold",
    },
    {
      icon: "I",
      syntax: "_",
      placeholder: "italic text",
      type: "wrap",
      title: "Italic",
    },
    {
      icon: "{}",
      syntax: "`",
      placeholder: "code",
      type: "wrap",
      title: "Inline Code",
    },
    {
      icon: "```",
      syntax: "```\n",
      suffix: "\n```",
      placeholder: "code block",
      type: "wrap",
      title: "Code Block",
    },
    {
      icon: "-",
      syntax: "- ",
      placeholder: "list item",
      type: "line",
      title: "Bullet List",
    },
    {
      icon: ">",
      syntax: "> ",
      placeholder: "quote",
      type: "line",
      title: "Blockquote",
    },
  ];

  tools.forEach((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = tool.icon;
    button.title = tool.title;
    button.className =
      "px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold";

    button.addEventListener("click", () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);

      if (tool.type === "wrap") {
        const suffix = tool.suffix || tool.syntax;
        const newText =
          tool.syntax + (selectedText || tool.placeholder) + suffix;
        textarea.value =
          textarea.value.substring(0, start) +
          newText +
          textarea.value.substring(end);
        textarea.focus();
        textarea.selectionStart = start + tool.syntax.length;
        textarea.selectionEnd =
          start +
          tool.syntax.length +
          (selectedText.length || tool.placeholder.length);
      } else if (tool.type === "line") {
        const lines = textarea.value.split("\n");
        const currentLine =
          textarea.value.substring(0, start).split("\n").length - 1;
        lines[currentLine] = tool.syntax + (selectedText || tool.placeholder);
        textarea.value = lines.join("\n");
        textarea.focus();
        textarea.selectionStart = start + tool.syntax.length;
        textarea.selectionEnd =
          start +
          tool.syntax.length +
          (selectedText.length || tool.placeholder.length);
      }
    });

    toolbar.appendChild(button);
  });
}

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize markdown toolbars
  createMarkdownToolbar("new-task-toolbar", "note-content");
  createMarkdownToolbar("edit-modal-toolbar", "edit-note-content");

  // Initialize managers
  TaskManager.init();
  ProfessionalTimer.init();

  // Hide loading message
  document.getElementById("loading-message").style.display = "none";

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  console.log("DevDesk Task Manager Pro initialized successfully!");
});
