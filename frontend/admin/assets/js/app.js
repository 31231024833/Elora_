const API_BASE = window.CONFIG.API_BASE;
// load header/footer và render thống kê
fetch("layouts/header.html").then(r => r.text()).then(t => document.querySelector("#header").innerHTML = t);
fetch("layouts/footer.html").then(r => r.text()).then(t => document.querySelector("#footer").innerHTML = t);
db = { products: [], categories: [], bookings: [] };

document.addEventListener('DOMContentLoaded', async function () {
    await loadData();
    document.getElementById('stat-products').innerText = db.products.length;
    document.getElementById('stat-categories').innerText = db.categories.length;
    document.getElementById('stat-orders').innerText = db.bookings.filter(b => b.status === 'pending').length;
    document.getElementById('stat-sales').innerText = db.bookings.reduce((s, b) => b?.status === "completed" ? s + b.finalAmount : s, 0).toLocaleString();
    console.log("🚀 ~ db.bookings:", db.bookings)
    renderSalesChart('#sales-chart');
    renderPendingOrders('#orders-list');

});

async function loadData() {
    await fetch(`${API_BASE}/products`)
        .then(res => res.json())
        .then(data => {
            db.products = data.data;
        });

    await fetch(`${API_BASE}/categories`)
        .then(res => res.json())
        .then(data => {
            db.categories = data.data;
        });

    await fetch(`${API_BASE}/bookings`)
        .then(res => res.json())
        .then(data => {
            db.bookings = data.bookings;
        });
}
function calcDailySales(bookings, days = 7) {
    const map = {};
    const today = new Date();

    // init days
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        map[key] = 0;
    }

    bookings.forEach(b => {
        if (b.status !== 'completed') return;
        const day = new Date(b.createdAt).toISOString().slice(0, 10);
        if (map[day] !== undefined) {
            map[day] += b.finalAmount;
        }
    });

    return {
        labels: Object.keys(map),
        data: Object.values(map)
    };
}

function renderSalesChart(selector) {
    const chartEl = document.querySelector(selector);
    if (!chartEl) return;

    bookings = db.bookings;

    const { labels, data } = calcDailySales(bookings, 7);
    const max = Math.max(...data, 1);

    chartEl.innerHTML = '';

    data.forEach((value, index) => {
        const height = (value / max) * 100;

        const bar = document.createElement('div');
        bar.className = 'simple-bar';
        bar.style.height = height + '%';

        bar.innerHTML = `
            <span>${value.toLocaleString('vi-VN')} ₫</span>
            <label>${labels[index].slice(5)}</label>
        `;

        chartEl.appendChild(bar);
    });
}

async function renderPendingOrders(selector, limit = 5) {
    const container = document.querySelector(selector);
    if (!container) return;

    const bookings = db.bookings;

    const pendingOrders = bookings
        .filter(b =>
            b.status === 'pending' ||
            b.status === 'confirmed'
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

    if (!pendingOrders.length) {
        container.innerHTML = `<p class="muted">Không có đơn chờ xử lý</p>`;
        return;
    }

    container.innerHTML = pendingOrders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <strong>${order.fullname || 'Khách hàng'}</strong>
                <div class="muted">
                    ${new Date(order.createdAt).toLocaleString('vi-VN')}
                </div>
            </div>

            <div class="order-meta">
                <span class="badge ${order.status}">
                    ${formatOrderStatus(order.status)}
                </span>
                <div class="price">
                    ${order.finalAmount.toLocaleString('vi-VN')} ₫
                </div>
            </div>
        </div>
    `).join('');
}

function formatOrderStatus(status) {
    const map = {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        in_progress: 'Đang làm',
        completed: 'Hoàn thành',
        cancelled: 'Đã huỷ'
    };
    return map[status] || status;
}
