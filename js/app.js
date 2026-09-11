const DEBUG_BORDERS_KEY = "debugBordersEnabled";

function setDebugBorders(enabled) {
    document.body.classList.toggle("debug-borders", enabled);
    localStorage.setItem(DEBUG_BORDERS_KEY, String(enabled));
}

function createDebugBordersToggle() {
    const toggle = document.createElement("label");
    toggle.className = "debug-toggle";
    toggle.htmlFor = "debug-borders-toggle";

    const checkbox = document.createElement("input");
    checkbox.id = "debug-borders-toggle";
    checkbox.type = "checkbox";
    checkbox.checked = localStorage.getItem(DEBUG_BORDERS_KEY) === "true";

    const label = document.createElement("span");
    label.textContent = "Debug borders";

    checkbox.addEventListener("change", () => {
        setDebugBorders(checkbox.checked);
    });

    toggle.append(checkbox, label);
    document.body.append(toggle);
    setDebugBorders(checkbox.checked);
}

document.addEventListener("DOMContentLoaded", createDebugBordersToggle);
