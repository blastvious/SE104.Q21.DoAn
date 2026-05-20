const icons = {
  success: "fa-circle-check",
  error: "fa-circle-xmark",
  warning: "fa-triangle-exclamation",
  info: "fa-circle-info",
};

const getContainer = () => {
  let c = document.querySelector(".app-toast-container");

  if (!c) {
    c = document.createElement("div");
    c.className = "app-toast-container";
    document.body.appendChild(c);
  }

  return c;
};

const removeToast = (toast) => {
  toast.classList.add("hide");
  setTimeout(() => toast.remove(), 300);
};

const show = (type, message) => {
  const toast = document.createElement("div");
  toast.className = `app-toast ${type}`;

  toast.innerHTML = `
    <div class="content">
        <i class="fa-solid ${icons[type]}"></i>
        <span>${message}</span>
    </div>
    <span class="close">&times;</span>
`;

  toast.querySelector(".close").onclick = () => removeToast(toast);

  getContainer().appendChild(toast);

  setTimeout(() => removeToast(toast), 4000);
};

window.Toast = {
  success: (msg) => show("success", msg),
  error: (msg) => show("error", msg),
  warning: (msg) => show("warning", msg),
  info: (msg) => show("info", msg),
};
