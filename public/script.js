const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const toolConfig = {
  ask: {
    title: "Ask AI anything",
    description: "What would you like to explore today?",
    label: "Your question",
    hint: "Be as specific as you like.",
    placeholder: "For example: Explain how the JavaScript event loop works with a simple example..."
  },
  summarize: {
    title: "Summarize your text",
    description: "Turn a long piece of writing into the key points.",
    label: "Text to summarize",
    hint: "Paste the text you want to make easier to scan.",
    placeholder: "Paste an article, notes, or a long paragraph here..."
  },
  ideas: {
    title: "Find your next idea",
    description: "Explore fresh possibilities for your topic.",
    label: "Your topic or goal",
    hint: "Share a topic, challenge, or project idea.",
    placeholder: "For example: Suggest creative full-stack project ideas for a student portfolio..."
  },
  define: {
    title: "Make a term simple",
    description: "Understand a concept without the jargon.",
    label: "Term to explain",
    hint: "Add a subject area if it helps.",
    placeholder: "For example: Explain API in simple English with a real-world example..."
  }
};

const toolButtons = [...document.querySelectorAll("[data-task]")];
const form = document.getElementById("generatorForm");
const promptInput = document.getElementById("promptInput");
const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");
const inputLabel = document.getElementById("inputLabel");
const inputHint = document.getElementById("inputHint");
const charCount = document.getElementById("charCount");
const generateButton = document.getElementById("generateButton");
const buttonText = document.getElementById("buttonText");
const buttonIcon = document.getElementById("buttonIcon");
const errorMessage = document.getElementById("errorMessage");
const resultSection = document.getElementById("resultSection");
const resultContent = document.getElementById("resultContent");
const copyButton = document.getElementById("copyButton");
const lengthSelect = document.getElementById("lengthSelect");

let selectedTask = "ask";
let latestResult = "";

// Light and dark mode
function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";

  root.dataset.theme = nextTheme;

  try {
    localStorage.setItem("contentcraft-theme", nextTheme);
  } catch {
    // The theme still works if browser storage is unavailable.
  }

  const isDark = nextTheme === "dark";

  if (themeIcon) {
    themeIcon.textContent = isDark ? "☀" : "☾";
  }

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  if (themeMeta) {
    themeMeta.setAttribute(
      "content",
      isDark ? "#15131d" : "#f7f4fb"
    );
  }
}

let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("contentcraft-theme") || "light";
} catch {
  savedTheme = "light";
}

setTheme(savedTheme);

themeToggle?.addEventListener("click", (event) => {
  event.preventDefault();

  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

// Character counter
function updateCharCount() {
  if (charCount && promptInput) {
    charCount.textContent =
      `${promptInput.value.length.toLocaleString()} / 20,000`;
  }
}

// Change selected AI tool
function chooseTask(task) {
  if (!toolConfig[task]) return;

  selectedTask = task;
  const config = toolConfig[task];

  toolButtons.forEach((button) => {
    const active = button.dataset.task === task;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (formTitle) formTitle.textContent = config.title;
  if (formDescription) formDescription.textContent = config.description;
  if (inputLabel) inputLabel.textContent = config.label;
  if (inputHint) inputHint.textContent = config.hint;
  if (promptInput) promptInput.placeholder = config.placeholder;

  if (promptInput) promptInput.value = "";

  updateCharCount();

  if (errorMessage) errorMessage.hidden = true;
  if (resultSection) resultSection.hidden = true;

  latestResult = "";
}

toolButtons.forEach((button) => {
  button.setAttribute(
    "aria-pressed",
    String(button.dataset.task === selectedTask)
  );

  button.addEventListener("click", (event) => {
    // Prevent accidental form submission and page refresh.
    event.preventDefault();
    chooseTask(button.dataset.task);
  });
});

promptInput?.addEventListener("input", updateCharCount);

// Generate AI content
form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = promptInput?.value.trim() || "";

  if (errorMessage) errorMessage.hidden = true;

  if (!text) {
    if (errorMessage) {
      errorMessage.textContent =
        "Please enter some text before generating content.";
      errorMessage.hidden = false;
    }

    promptInput?.focus();
    return;
  }

  if (text.length > 20000) {
    if (errorMessage) {
      errorMessage.textContent =
        "Please keep your input within 20,000 characters.";
      errorMessage.hidden = false;
    }
    return;
  }

  if (generateButton) generateButton.disabled = true;
  if (buttonText) buttonText.textContent = "Generating...";
  if (buttonIcon) buttonIcon.textContent = "◌";

  try {
    // Use the backend URL, not a direct browser request to Gemini.
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task: selectedTask,
        text,
        length: lengthSelect?.value || "medium"
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Request failed (${response.status}). Please try again.`
      );
    }

    if (!data.text) {
      throw new Error(
        "The AI returned an empty response. Please try again."
      );
    }

    latestResult = data.text;

    if (resultContent) resultContent.textContent = data.text;
    if (resultSection) {
      resultSection.hidden = false;
      resultSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  } catch (error) {
    if (errorMessage) {
      errorMessage.textContent =
        error.message || "Unable to generate content. Please try again.";
      errorMessage.hidden = false;
    }
  } finally {
    if (generateButton) generateButton.disabled = false;
    if (buttonText) buttonText.textContent = "Generate content";
    if (buttonIcon) buttonIcon.textContent = "✦";
  }
});

// Copy generated content
copyButton?.addEventListener("click", async (event) => {
  event.preventDefault();

  if (!latestResult) return;

  try {
    await navigator.clipboard.writeText(latestResult);

    copyButton.textContent = "✓ Copied!";

    window.setTimeout(() => {
      copyButton.textContent = "▣ Copy text";
    }, 1500);
  } catch {
    if (resultContent) {
      const range = document.createRange();
      range.selectNodeContents(resultContent);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    copyButton.textContent = "Text selected — copy it";
  }
});

updateCharCount();