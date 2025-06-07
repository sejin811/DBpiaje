
const audioPlayer = document.getElementById("audio-player");
const songButtons = document.querySelectorAll(".song-btn");
const currentSong = document.getElementById("current-song");
const togglePlayBtn = document.getElementById("toggle-play");
let isPlaying = false;

songButtons.forEach(button => {
    button.addEventListener("click", () => {
        const src = button.getAttribute("data-src");
        audioPlayer.src = src;
        audioPlayer.play();
        isPlaying = true;
        updateStatus(button.textContent);
    });
});

togglePlayBtn.addEventListener("click", () => {
    if (isPlaying) {
        audioPlayer.pause();
        togglePlayBtn.textContent = "▶ 재생";
        isPlaying = false;
    } else {
        audioPlayer.play();
        togglePlayBtn.textContent = "⏸ 멈춤";
        isPlaying = true;
    }
});

function updateStatus(title) {
    currentSong.textContent = title;
    togglePlayBtn.textContent = "⏸ 멈춤";
}

const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

// 시간 형식: 초 → mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

// 오디오 로드 완료 시 전체 길이 표시
audioPlayer.addEventListener("loadedmetadata", () => {
    progressBar.max = Math.floor(audioPlayer.duration);
    durationEl.textContent = formatTime(audioPlayer.duration);
});

// 재생 중일 때 진행 바 업데이트
audioPlayer.addEventListener("timeupdate", () => {
    progressBar.value = Math.floor(audioPlayer.currentTime);
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
});

// 사용자가 바를 움직일 때 위치 변경
progressBar.addEventListener("input", () => {
    audioPlayer.currentTime = progressBar.value;
});

// 노래 선택 부분 접기 기능
document.getElementById("toggle-music-bar").addEventListener("click", function () {
    const bar = document.getElementById("music-bar");
    bar.classList.toggle("collapsed");
});
