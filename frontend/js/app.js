const API_BASE = '/api';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function getDisplayName(user) {
    if (user && user.profile && user.profile.firstName && user.profile.lastName) {
        return user.profile.lastName + user.profile.firstName;
    } else if (user && user.profile && user.profile.firstName) {
        return user.profile.firstName;
    }
    return user ? user.username : '用户';
}

function checkAuth() {
    const token = getToken();
    const user = getUser();
    const navAuth = document.getElementById('nav-auth');
    
    if (token && user) {
        const adminLink = user.role === 'admin' ? '<a href="/admin.html" class="text-gray-600 hover:text-primary transition">管理后台</a>' : '';
        const displayName = getDisplayName(user);
        navAuth.innerHTML = `
            <a href="/submit.html" class="text-gray-600 hover:text-primary transition">投稿</a>
            <a href="/profile.html" class="text-gray-600 hover:text-primary transition">个人中心</a>
            ${adminLink}
            <span class="text-gray-600">欢迎, <strong>${displayName}</strong></span>
            <button onclick="logout()" class="text-gray-600 hover:text-primary transition">退出</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function loadTeachers(search = '') {
    const grid = document.getElementById('teachers-grid');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('empty');
    
    try {
        loading.classList.remove('hidden');
        grid.classList.add('hidden');
        empty.classList.add('hidden');
        
        const url = search ? `${API_BASE}/teachers?search=${encodeURIComponent(search)}` : `${API_BASE}/teachers`;
        const res = await fetch(url);
        const result = await res.json();
        
        loading.classList.add('hidden');
        
        if (result.success && result.data.length > 0) {
            grid.classList.remove('hidden');
            grid.innerHTML = result.data.map(teacher => `
                <a href="/teacher.html?id=${teacher.id}" class="card-hover block bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-bold text-lg text-gray-900">${escapeHtml(teacher.name)}</h3>
                        <div class="flex items-center gap-1">
                            <i class="fas fa-star text-yellow-400"></i>
                            <span class="font-semibold">${escapeHtml(teacher.rating)}</span>
                            <span class="text-gray-400 text-sm">(${teacher.ratingCount})</span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm line-clamp-2">${escapeHtml(teacher.description) || '暂无简介'}</p>
                </a>
            `).join('');
        } else {
            empty.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        empty.classList.remove('hidden');
    }
}

let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTeachers(e.target.value), 300);
});

async function loadTeacher(id) {
    try {
        const res = await fetch(`${API_BASE}/teachers/${id}`);
        const result = await res.json();
        
        if (result.success) {
            const t = result.data;
            document.getElementById('teacher-name').textContent = t.name;
            document.getElementById('teacher-desc').textContent = t.description || '暂无简介';
            document.getElementById('teacher-rating').textContent = t.rating;
            document.getElementById('teacher-count').textContent = `${t.ratingCount} 条评价`;
            document.title = `${t.name} - TeacherRate`;
            
            updateRatingForm(id);
        }
    } catch (err) {
        console.error(err);
    }
}

function updateRatingForm(teacherId) {
    const token = getToken();
    const form = document.getElementById('rating-form');
    const prompt = document.getElementById('login-prompt');
    const btn = document.getElementById('submit-rating');
    
    if (!token) {
        form.querySelector('button').classList.add('hidden');
        prompt.classList.remove('hidden');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            teacherId: teacherId,
            rating: parseInt(document.getElementById('rating-value').value),
            comment: formData.get('comment'),
            isAnonymous: formData.get('isAnonymous') === 'on'
        };
        
        const errDiv = document.getElementById('rating-error');
        const succDiv = document.getElementById('rating-success');
        
        try {
            const res = await fetch(`${API_BASE}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (result.success) {
                succDiv.textContent = '评价提交成功！';
                succDiv.classList.remove('hidden');
                errDiv.classList.add('hidden');
                form.reset();
                loadRatings(teacherId);
                loadTeacher(teacherId);
                setTimeout(() => succDiv.classList.add('hidden'), 3000);
            } else {
                errDiv.textContent = result.message;
                errDiv.classList.remove('hidden');
                succDiv.classList.add('hidden');
            }
        } catch (err) {
            console.error(err);
        }
    });
}

async function loadRatings(teacherId) {
    const list = document.getElementById('ratings-list');
    const loading = document.getElementById('ratings-loading');
    const empty = document.getElementById('ratings-empty');
    
    try {
        loading.classList.remove('hidden');
        list.classList.add('hidden');
        empty.classList.add('hidden');
        
        const res = await fetch(`${API_BASE}/teachers/${teacherId}/ratings`);
        const result = await res.json();
        
        loading.classList.add('hidden');
        
        if (result.success && result.data.length > 0) {
            list.classList.remove('hidden');
            list.innerHTML = result.data.map(r => `
                <div class="border-b border-gray-100 pb-4 last:border-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                ${r.isAnonymous ? '?' : (r.username ? escapeHtml(r.username[0]).toUpperCase() : 'U')}
                            </div>
                            <span class="font-medium text-gray-900">${r.isAnonymous ? '匿名用户' : (r.username ? escapeHtml(r.username) : '用户')}</span>
                        </div>
                        <div class="star-rating">
                            ${[1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= r.rating ? '' : 'empty'}"></i>`).join('')}
                        </div>
                    </div>
                    <p class="text-gray-700">${escapeHtml(r.comment)}</p>
                    <p class="text-gray-400 text-sm mt-2">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '未知'}</p>
                </div>
            `).join('');
        } else {
            empty.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
    }
}
