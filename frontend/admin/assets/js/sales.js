const API_BASE = window.CONFIG?.API_BASE;
const db = { bookings: [] };

// Load bookings rồi render
document.addEventListener("DOMContentLoaded", async () => {
    await loadBookings();
    renderSalesChart('#sales-chart-large');
    renderSalesMonthly();
});

// fetch bookings
async function loadBookings() {
    try {
        const res = await fetch(`${API_BASE}/bookings`);
        const json = await res.json();
        db.bookings = json.bookings || [];
    } catch (err) {
        console.error("fetch bookings error:", err);
    }
}

// ----------------------------------------------------------------------
// Daily Sales (7 days)
// ----------------------------------------------------------------------

function calcDailySales(days = 7) {
    const result = {};
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result[key] = 0;
    }

    db.bookings.forEach(b => {
        if (b.status !== "completed") return;
        const key = new Date(b.createdAt).toISOString().slice(0, 10);
        if (result[key] !== undefined) {
            result[key] += b.finalAmount;
        }
    });

    return {
        labels: Object.keys(result),
        values: Object.values(result)
    };
}

function renderSalesChart(selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    const { labels, values } = calcDailySales(7);
    const max = Math.max(...values, 1);

    container.innerHTML = "";

    values.forEach((val, i) => {
        const height = (val / max) * 100;
        const bar = document.createElement("div");
        bar.className = "simple-bar";

        bar.style.height = height + "%";
        bar.innerHTML = `
            <span>${val.toLocaleString('vi-VN')} ₫</span>
            <label>${labels[i].slice(5)}</label>
        `;

        container.appendChild(bar);
    });
}

// ----------------------------------------------------------------------
// Monthly sales (sample demo, tính tháng theo createdAt)
// ----------------------------------------------------------------------

function calcMonthlySales() {
    const map = {};

    db.bookings.forEach(b => {
        if (b.status !== "completed") return;
        const month = new Date(b.createdAt).toISOString().slice(0, 7); // yyyy-mm
        map[month] = (map[month] || 0) + b.finalAmount;
    });

    return {
        labels: Object.keys(map),
        values: Object.values(map)
    };
}

function renderSalesMonthly() {
    const container = document.querySelector('#sales-monthly');
    if (!container) return;

    const { labels, values } = calcMonthlySales();

    if (!values.length) {
        container.innerHTML = `<p class="muted">Chưa có dữ liệu</p>`;
        return;
    }

    const max = Math.max(...values, 1);
    container.innerHTML = "";

    values.forEach((val, i) => {
        const bar = document.createElement("div");
        bar.className = "simple-bar small";
        bar.style.height = (val / max) * 100 + '%';

        bar.innerHTML = `
            <span>${val.toLocaleString('vi-VN')} ₫</span>
            <label>${labels[i]}</label>
        `;
        container.appendChild(bar);
    });
}
