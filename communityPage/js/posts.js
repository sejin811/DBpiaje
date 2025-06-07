
const ADMIN_NAME = "Admin";
const firebaseConfig = {
    apiKey: "AIzaSyCm6nslSJF8RQgjN3h4z-awLbObhM1FTVw",
    authDomain: "dbpiaje.firebaseapp.com",
    databaseURL: "https://dbpiaje-default-rtdb.firebaseio.com/",
    projectId: "dbpiaje",
    storageBucket: "dbpiaje.appspot.com",
    messagingSenderId: "590808126930",
    appId: "1:590808126930:web:4eb9e5e754674435df240b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

async function hashPassword(pwd) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ADMIN_PWD_HASH = "1a36ea191cd5abd1c2ebd694de6dc5f1bb83661a77176d1b5524645b2ec00668";

const showWriteFormBtn = document.getElementById('showWriteFormBtn');
const writeForm = document.getElementById('writeForm');
const postBtn = document.getElementById('postBtn');
const postsList = document.getElementById('postsList');


let deleteTargetKey = null;
let postsCache = {};

showWriteFormBtn.addEventListener('click', () => {
    writeForm.style.display = writeForm.style.display === 'none' ? 'block' : 'none';
});

postBtn.addEventListener('click', async () => {
    const author = document.getElementById('authorInput').value.trim();
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();

    if (!author || !title || !content) {
        alert('작성자, 제목, 내용을 모두 입력해주세요.');
        return;
    }

    // 관리자 이름 제한
    if (author.toLowerCase() === ADMIN_NAME.toLowerCase() && localStorage.getItem("isAdmin") !== "true") {
        alert('관리자 이름은 사용할 수 없습니다.');
        return;
    }


    const postData = {
        author,
        title,
        content,
        timestamp: Date.now(),
        likes: 0
    };

    await db.ref('posts').push(postData);

    document.getElementById('authorInput').value = '';
    document.getElementById('titleInput').value = '';
    document.getElementById('contentInput').value = '';
    writeForm.style.display = 'none';
});

function createPostElement(post, key) {
    const li = document.createElement('li');
    li.className = 'post-item';

    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const dateStr = new Date(post.timestamp).toLocaleString();

    li.innerHTML = `
                <div class="post-title">${post.title}</div>
                <div class="post-meta">작성자: ${post.author} | ${dateStr}</div>
                <div class="post-content" style="margin:8px 0; display:none;">${post.content.replace(/\n/g, '<br>')}</div>
                <button class="like-btn" data-key="${key}">
                    <i class="fa-regular fa-thumbs-up"></i> 좋아요 (<span class="like-count">${post.likes || 0}</span>)
                </button>
                <button class="toggle-content-btn">내용 펼치기</button>
                ${isAdmin ? `<button class="admin-delete-btn" data-key="${key}">관리자 삭제</button>` : ""}
                <div class="comment-section">
                    <div class="comments-list"></div>
                    <input type="text" class="comment-author" placeholder="댓글 작성자" />
                    <input type="text" class="comment-input" placeholder="댓글을 입력하세요" />
                    <button class="comment-submit">댓글 달기</button>
                </div>
            `;

    const toggleBtn = li.querySelector('.toggle-content-btn');
    const contentDiv = li.querySelector('.post-content');
    toggleBtn.addEventListener('click', () => {
        const isVisible = contentDiv.style.display === 'block';
        contentDiv.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? '내용 펼치기' : '내용 접기';
    });

    const likeBtn = li.querySelector('.like-btn');
    const likeCountSpan = likeBtn.querySelector('.like-count');
    likeBtn.addEventListener('click', async () => {
        const likedKey = `liked-${key}`;
        if (localStorage.getItem(likedKey)) {
            alert('이미 좋아요를 누르셨습니다!');
            return;
        }

        const newLikes = (post.likes || 0) + 1;
        await db.ref(`posts/${key}/likes`).set(newLikes);
        localStorage.setItem(likedKey, 'true');
    });

    db.ref(`posts/${key}/likes`).on('value', snapshot => {
        likeCountSpan.textContent = snapshot.val() || 0;
    });

    const deleteBtn = li.querySelector('.admin-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

            const content = post.content || '';
            const imageUrls = Array.from(content.matchAll(/<img[^>]+src="([^">]+)"/g)).map(m => m[1]);

            for (const url of imageUrls) {
                try {
                    const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1].split('?')[0]);
                    const ref = storage.ref().child(path);
                    await ref.delete();
                } catch (e) {
                    console.error("이미지 삭제 오류:", e);
                }
            }

            await db.ref(`posts/${key}`).remove();
            alert('게시물이 삭제되었습니다.');
        });
    }

    const commentsListDiv = li.querySelector('.comments-list');
    const commentAuthorInput = li.querySelector('.comment-author');
    const commentInput = li.querySelector('.comment-input');
    const commentSubmitBtn = li.querySelector('.comment-submit');

    db.ref(`posts/${key}/comments`).on('value', snapshot => {
        commentsListDiv.innerHTML = '';
        const comments = snapshot.val();
        if (comments) {
            Object.values(comments).forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                const date = new Date(comment.timestamp).toLocaleString();
                commentEl.innerHTML = `<strong>${comment.author}</strong>: ${comment.text} <span class="comment-time">${date}</span>`;
                commentsListDiv.appendChild(commentEl);
            });
        }
    });

    commentSubmitBtn.addEventListener('click', () => {
        const author = commentAuthorInput.value.trim();
        const text = commentInput.value.trim();

        if (!author || !text) {
            alert("작성자와 내용을 모두 입력해주세요.");
            return;
        }

        // 관리자 이름 제한
        if (author.toLowerCase() === ADMIN_NAME.toLowerCase() && localStorage.getItem("isAdmin") !== "true") {
            alert("관리자 이름은 사용할 수 없습니다.");
            return;
        }

        const commentData = {
            author,
            text,
            timestamp: Date.now()
        };

        db.ref(`posts/${key}/comments`).push(commentData);
        commentAuthorInput.value = '';
        commentInput.value = '';
    });

    return li;
}

let currentSort = 'recent';

function renderPosts(posts) {
    postsCache = posts || {};
    postsList.innerHTML = '';
    let entries = Object.entries(postsCache);
    if (currentSort === 'recent') entries = entries.reverse();
    for (const [key, post] of entries) {
        const li = createPostElement(post, key);
        postsList.appendChild(li);
    }
}

db.ref('posts').on('value', snapshot => {
    renderPosts(snapshot.val());
});

cancelDeleteBtn.addEventListener('click', () => {
    deletePopup.style.display = 'none';
    deleteTargetKey = null;
});

confirmDeleteBtn.addEventListener('click', async () => {
    const inputPwd = adminPwdInput.value;
    if (!inputPwd) {
        alert('비밀번호를 입력하세요.');
        return;
    }

    const hashedInput = await hashPassword(inputPwd);
    if (hashedInput !== ADMIN_PWD_HASH) {
        alert('비밀번호가 틀렸습니다.');
        return;
    }

    if (deleteTargetKey && postsCache[deleteTargetKey]) {
        const content = postsCache[deleteTargetKey].content || '';
        const imageUrls = Array.from(content.matchAll(/<img[^>]+src="([^">]+)"/g)).map(m => m[1]);

        for (const url of imageUrls) {
            try {
                const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1].split('?')[0]);
                const ref = storage.ref().child(path);
                await ref.delete();
            } catch (e) {
                console.error("이미지 삭제 오류:", e);
            }
        }

        await db.ref(`posts/${deleteTargetKey}`).remove();
        alert('게시물이 삭제되었습니다.');
    }

    deletePopup.style.display = 'none';
    deleteTargetKey = null;
});

document.getElementById("searchBtn").addEventListener("click", () => {
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!keyword) return;

    const filtered = Object.entries(postsCache).filter(([_, post]) =>
        post.title.toLowerCase().includes(keyword) || post.content.toLowerCase().includes(keyword)
    );
    renderPosts(Object.fromEntries(filtered));
});

document.getElementById("resetSearchBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = '';
    renderPosts(postsCache);
});

const sortRecentBtn = document.getElementById("sortRecentBtn");
const sortOldBtn = document.getElementById("sortOldBtn");

sortRecentBtn.addEventListener("click", () => {
    currentSort = 'recent';
    sortRecentBtn.classList.add("active");
    sortOldBtn.classList.remove("active");
    renderPosts(postsCache);
});

sortOldBtn.addEventListener("click", () => {
    currentSort = 'old';
    sortOldBtn.classList.add("active");
    sortRecentBtn.classList.remove("active");
    renderPosts(postsCache);
});

// 이미지 업로드
const addImageBtn = document.getElementById("addImageBtn");
const imageUploadWrapper = document.getElementById("imageUploadWrapper");
const imageInput = document.getElementById("imageInput");

addImageBtn.addEventListener("click", () => {
    imageUploadWrapper.style.display = imageUploadWrapper.style.display === "none" ? "block" : "none";
});

imageInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const imageRef = firebase.storage().ref().child(`images/${Date.now()}_${file.name}`);
        const snapshot = await imageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL(); // 이게 핵심!

        const contentInput = document.getElementById("contentInput");
        const cursorPos = contentInput.selectionStart;
        const textBefore = contentInput.value.substring(0, cursorPos);
        const textAfter = contentInput.value.substring(cursorPos);

        const imgTag = `<img src="${downloadURL}" style="max-width: 100%;"/>\n`;

        contentInput.value = textBefore + imgTag + textAfter;
        contentInput.focus();
        contentInput.selectionStart = contentInput.selectionEnd = cursorPos + imgTag.length;
    } catch (e) {
        console.error("이미지 업로드 실패:", e);
        alert("이미지 업로드 중 오류가 발생했습니다.");
    }
});

// 관리자 로그인, 로그아웃 기능 구현
// 관리자 관련 요소들
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminLoginPopup = document.getElementById('adminLoginPopup');
const adminLoginPwdInput = document.getElementById('adminLoginPwdInput');
const cancelAdminLoginBtn = document.getElementById('cancelAdminLoginBtn');
const confirmAdminLoginBtn = document.getElementById('confirmAdminLoginBtn');

// 로그인 버튼 클릭
adminLoginBtn.addEventListener('click', () => {
    adminLoginPopup.style.display = 'flex';
    adminLoginPwdInput.value = '';
    adminLoginPwdInput.focus();
});

// 로그인 취소
cancelAdminLoginBtn.addEventListener('click', () => {
    adminLoginPopup.style.display = 'none';
});

// 로그인 시도
confirmAdminLoginBtn.addEventListener('click', async () => {
    const inputPwd = adminLoginPwdInput.value.trim();
    if (!inputPwd) {
        alert("비밀번호를 입력하세요.");
        return;
    }

    const hashedInput = await hashPassword(inputPwd);
    if (hashedInput === ADMIN_PWD_HASH) {
        localStorage.setItem("isAdmin", "true");
        alert("관리자 로그인 성공!");
        adminLoginPopup.style.display = 'none';
        updateAdminUI();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
});

// 로그아웃 버튼 클릭
adminLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem("isAdmin");
    alert("로그아웃되었습니다.");
    updateAdminUI();
});

// UI 상태 반영 함수
function updateAdminUI() {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    adminLoginBtn.style.display = isAdmin ? "none" : "inline-block";
    adminLogoutBtn.style.display = isAdmin ? "inline-block" : "none";

    // 게시글 다시 렌더링 해서 관리자 삭제 버튼 갱신
    renderPosts(postsCache);
}

// 페이지 로드시 UI 상태 업데이트
updateAdminUI();

