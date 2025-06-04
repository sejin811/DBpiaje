document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");
  const darkToggle = document.getElementById("darkModeToggle");

  // ✅ 사이드바 토글
  toggleButton.addEventListener("click", function (e) {
    e.stopPropagation();
    sidebar.classList.toggle("hide");
  });

  sidebar.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("click", function () {
    sidebar.classList.add("hide");
  });

  // ✅ 페이지 로드 시 다크모드 상태 반영
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    document.body.classList.add("dark-mode");
    if (darkToggle) darkToggle.checked = true;
  }

  // ✅ 다크모드 토글
  if (darkToggle) {
    darkToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
      }
    });
  }
});