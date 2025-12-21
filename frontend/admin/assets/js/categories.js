import { API_BASE } from '../../../assets/js/config.js';
let categories = []

document.addEventListener('DOMContentLoaded', function () {
    initializePage();
});

async function initializePage() {
    try {

        // Tải dữ liệu nếu chưa có
        await loadCategories();

        // Khởi tạo các thành phần
        setupEventListeners();

        renderCategoriesTable();

        console.log('Services page initialized');
    } catch (error) {
        console.error('Error initializing services page:', error);
    }
}

function setupEventListeners() {
    document.getElementById('cat-search').addEventListener('input', e => renderCategoriesTable(e.target.value));
    document.querySelector('.category-modal-open').addEventListener('click', openCategoryForm);
    document.querySelector('.category-modal-save').addEventListener('click', saveCategory);
    document.querySelector('.category-modal-close').addEventListener('click', closeCategoryForm);
    document.querySelector('.category-modal-close').addEventListener('click', closeCategoryForm);
}

function loadCategories() {
    return fetch(`${API_BASE}/categories`)
        .then(response => response.json())
        .then(data => {
            categories = data;
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

/* categories.js - CRUD for categories */
function renderCategoriesTable(filter = '') {
    const table = document.getElementById('cat-table');
    if (!table) return;
    console.log("🚀 ~ renderCategoriesTable ~ categories:", categories)
    const items = categories?.data?.filter(c => !filter || c.name.toLowerCase().includes(filter.toLowerCase()));
    const rows = items.map((c, i) => `<tr>
    <td>${i + 1}</td>
    <td>${c.name}</td>
    <td>
      <button class="btn" onclick="editCategory('${c.name}')">Sửa</button>
      <button class="btn muted" onclick="deleteCategory('${c._id}')">Xóa</button>
    </td>
  </tr>`).join('');
    table.innerHTML = `<thead><tr><th>ID</th><th>Tên</th><th>Hành động</th></tr></thead><tbody>${rows}</tbody>`;
}

function openCategoryForm(name = null) {
    const modal = document.getElementById('modal-cat');
    modal.classList.remove('hidden');
    if (name) {
        const cat = categories.find(x => x.name === name);
        document.getElementById('modal-cat-title').innerText = 'Sửa danh mục';
        document.getElementById('cat-name').value = cat.name;
        modal.dataset.editId = cat._id;
    } else {
        document.getElementById('modal-cat-title').innerText = 'Thêm danh mục';
        document.getElementById('cat-name').value = '';
        delete modal.dataset.editId;
    }
}

function closeCategoryForm() { document.getElementById('modal-cat').classList.add('hidden'); delete document.getElementById('modal-cat').dataset.editId; }

async function saveCategory() {
    const modal = document.getElementById('modal-cat');
    const categoryId = modal.dataset.editId; // có → update, không → new
    const name = document.getElementById('cat-name').value.trim();

    if (!name) {
        alert('Nhập tên danh mục');
        return;
    }

    if (categoryId) {
        await updateCategory(categoryId, name);
    } else {
        await createCategory(name);
    }
}

async function createCategory(name) {
    try {
        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || 'Thêm danh mục thất bại');
            return;
        }

        closeCategoryForm();
        await loadCategories();
        renderCategoriesTable();
        alert('Thêm danh mục thành công');

    } catch (error) {
        console.error('❌ Create category error:', error);
        alert('Lỗi kết nối server');
    }
}

async function updateCategory(name) {
    const id = categories.find(c => c.name === name)?._id;
    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || 'Cập nhật thất bại');
            return;
        }

        closeCategoryForm();
        await loadCategories();
        renderCategoriesTable();
        alert('Cập nhật thành công');

    } catch (error) {
        console.error('❌ Update category error:', error);
        alert('Lỗi kết nối server');
    }
}

function editCategory(name) { openCategoryForm(name); }

function deleteCategory(id) {
    if (!confirm('Xóa danh mục?')) return;
    const db = getDB();
    db.categories = db.categories.filter(c => c.id !== id);
    // detach category from products
    db.products.forEach(prod => { if (prod.categoryId === id) prod.categoryId = null; });
    saveDB(db);
    renderCategoriesTable();
    alert('Đã xóa');
}
