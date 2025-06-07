const ADMIN_NAME = "Admin";
const ADMIN_PWD_HASH = "1a36ea191cd5abd1c2ebd694de6dc5f1bb83661a77176d1b5524645b2ec00668";

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

let postsCache = {};
let currentSort = 'recent';

function updateAdminUI() {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    document.getElementById('adminLoginBtn').style.display = isAdmin ? "none" : "inline-block";
    document.getElementById('adminLogoutBtn').style.display = isAdmin ? "inline-block" : "none";
    renderPosts(postsCache);
}

function renderPosts(posts) {
    postsCache = posts || {};
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '';
    let entries = Object.entries(postsCache);
    if (currentSort === 'recent') entries = entries.reverse();
    for (const [key, post] of entries) {
        postsList.appendChild(createPostElement(post, key));
    }
}

function createPostElement(post, key) {
    const li = document.createElement('li');
    li.className = 'post-item';
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const dateStr = new Date(post.timestamp).toLocaleString();

    li.innerHTML = `
        <div class="post-title">${post.title}</div>
        <div class="post-meta">작성자: ${post.author} | ${dateStr}</div>
        <div class="post-content" style="display:none;">${post.content.replace(/\n/g, "<br>")}</div>
        <button class="like-btn" data-key="${key}">좋아요 (<span class="like-count">${post.likes || 0}</span>)</button>
        <button class="toggle-content-btn">내용 펼치기</button>
        ${isAdmin ? `<button class="admin-delete-btn" data-key="${key}">관리자 삭제</button>` : ""}
        <div class="comment-section">
            <div class="comments-list"></div>
            <input class="comment-author" placeholder="댓글 작성자">
            <input class="comment-input" placeholder="댓글을 입력하세요">
            <button class="comment-submit">댓글 달기</button>
        </div>
    `;

    const contentDiv = li.querySelector('.post-content');
    const toggleBtn = li.querySelector('.toggle-content-btn');
    toggleBtn.addEventListener('click', () => {
        const visible = contentDiv.style.display === 'block';
        contentDiv.style.display = visible ? 'none' : 'block';
        toggleBtn.textContent = visible ? '내용 펼치기' : '내용 접기';
    });

    const likeBtn = li.querySelector('.like-btn');
    likeBtn.addEventListener('click', async () => {
        const likedKey = `liked-${key}`;
        if (localStorage.getItem(likedKey)) return alert("이미 좋아요를 누르셨습니다.");
        const newLikes = (post.likes || 0) + 1;
        await db.ref(`posts/${key}/likes`).set(newLikes);
        localStorage.setItem(likedKey, 'true');
    });

    db.ref(`posts/${key}/likes`).on('value', snap => {
        li.querySelector('.like-count').textContent = snap.val() || 0;
    });

    const deleteBtn = li.querySelector('.admin-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm("정말 삭제하시겠습니까?")) return;
            const imgs = Array.from((post.content || "").matchAll(/<img[^>]+src="([^">]+)"/g)).map(m => m[1]);
            for (const url of imgs) {
                try {
                    const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1].split('?')[0]);
                    await storage.ref().child(path).delete();
                } catch (e) { }
            }
            await db.ref(`posts/${key}`).remove();
        });
    }

    const commentsListDiv = li.querySelector('.comments-list');
    const commentSubmitBtn = li.querySelector('.comment-submit');
    const commentAuthorInput = li.querySelector('.comment-author');
    const commentInput = li.querySelector('.comment-input');

    db.ref(`posts/${key}/comments`).on('value', snap => {
        commentsListDiv.innerHTML = '';
        const comments = snap.val();
        if (comments) {
            Object.values(comments).forEach(comment => {
                const d = new Date(comment.timestamp).toLocaleString();
                const div = document.createElement('div');
                div.className = "comment-item";
                div.innerHTML = `<strong>${comment.author}</strong>: ${comment.text} <span class="comment-time">${d}</span>`;
                commentsListDiv.appendChild(div);
            });
        }
    });

    commentSubmitBtn.addEventListener('click', () => {
        const author = commentAuthorInput.value.trim();
        const text = commentInput.value.trim();
        if (!author || !text) return alert("작성자와 내용을 입력하세요.");
        if (author.toLowerCase() === ADMIN_NAME.toLowerCase() && localStorage.getItem("isAdmin") !== "true") {
            return alert("관리자 이름은 사용할 수 없습니다.");
        }
        const comment = { author, text, timestamp: Date.now() };
        db.ref(`posts/${key}/comments`).push(comment);
        commentAuthorInput.value = '';
        commentInput.value = '';
    });

    return li;
}

// 글 작성
document.getElementById('postBtn').addEventListener('click', async () => {
    const author = document.getElementById('authorInput').value.trim();
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    if (!author || !title || !content) return alert("작성자, 제목, 내용 필수");

    if (author.toLowerCase() === ADMIN_NAME.toLowerCase() && localStorage.getItem("isAdmin") !== "true")
        return alert("관리자 이름은 사용할 수 없습니다.");

    const postData = { author, title, content, timestamp: Date.now(), likes: 0 };
    await db.ref('posts').push(postData);
    document.getElementById('authorInput').value = '';
    document.getElementById('titleInput').value = '';
    document.getElementById('contentInput').value = '';
    document.getElementById('writeForm').style.display = 'none';
});

// 이미지 업로드
document.getElementById('addImageBtn').addEventListener('click', () => {
    const wrapper = document.getElementById("imageUploadWrapper");
    wrapper.style.display = wrapper.style.display === "none" ? "block" : "none";
});

document.getElementById('imageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const ref = storage.ref().child(`images/${Date.now()}_${file.name}`);
        const snap = await ref.put(file);
        const url = await snap.ref.getDownloadURL();
        const input = document.getElementById('contentInput');
        const imgTag = `<img src="${url}" style="max-width: 100%;"/>\n`;
        const cursor = input.selectionStart;
        input.value = input.value.slice(0, cursor) + imgTag + input.value.slice(cursor);
        input.focus();
        input.selectionStart = input.selectionEnd = cursor + imgTag.length;
    } catch (e) {
        alert("이미지 업로드 오류");
    }
});

// 관리자 로그인/로그아웃
document.getElementById('adminLoginBtn').addEventListener('click', () => {
    document.getElementById('adminLoginPopup').style.display = 'flex';
    document.getElementById('adminLoginPwdInput').focus();
});
document.getElementById('cancelAdminLoginBtn').addEventListener('click', () => {
    document.getElementById('adminLoginPopup').style.display = 'none';
});
document.getElementById('confirmAdminLoginBtn').addEventListener('click', async () => {
    const pwd = document.getElementById('adminLoginPwdInput').value.trim();
    if (!pwd) return alert("비밀번호를 입력하세요.");
    const hash = await hashPassword(pwd);
    if (hash === ADMIN_PWD_HASH) {
        localStorage.setItem("isAdmin", "true");
        alert("관리자 로그인 성공!");
        document.getElementById('adminLoginPopup').style.display = 'none';
        updateAdminUI();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
});
document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem("isAdmin");
    alert("로그아웃되었습니다.");
    updateAdminUI();
});

// 검색
document.getElementById("searchBtn").addEventListener("click", () => {
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!keyword) return;
    const filtered = Object.entries(postsCache).filter(([_, post]) =>
        post.title.toLowerCase().includes(keyword) || post.content.toLowerCase().includes(keyword));
    renderPosts(Object.fromEntries(filtered));
});
document.getElementById("resetSearchBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = '';
    renderPosts(postsCache);
});

// 정렬
document.getElementById("sortRecentBtn").addEventListener("click", () => {
    currentSort = 'recent';
    renderPosts(postsCache);
});
document.getElementById("sortOldBtn").addEventListener("click", () => {
    currentSort = 'old';
    renderPosts(postsCache);
});

// 게시글 토글
document.getElementById("showWriteFormBtn").addEventListener("click", () => {
    const form = document.getElementById("writeForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
});

// 초기 로드
db.ref('posts').on('value', snapshot => {
    renderPosts(snapshot.val());
});
updateAdminUI();