let bookings = [];
const API_BASE = window.CONFIG.API_BASE;
document.addEventListener('DOMContentLoaded', async function () {
    await loadData();
    console.log("🚀 ~ db.bookings:", bookings)
    renderBookingsTable();
});

async function loadData() {
    await fetch(`${API_BASE}/bookings`)
        .then(res => res.json())
        .then(data => {
            bookings = data.bookings;
        });
}

function renderBookingsTable(list = bookings) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:20px">
                    Không có đơn hàng
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = list.map(b => `
        <tr data-booking-id="${b._id}">
            <td>${b._id.slice(-6).toUpperCase()}</td>
            <td>
                ${new Date(b.createdAt).toLocaleDateString('vi-VN')}
                <br>
                <small class="muted">${b.bookingTime}</small>
            </td>
            <td>
                ${b.finalAmount.toLocaleString('vi-VN')} ₫
            </td>
            <td>
                <span class="badge ${b.status}">
                    ${formatBookingStatus(b.status)}
                </span>
            </td>
            <td>
                ${renderBookingActions(b)}
            </td>
        </tr>
    `).join('');
}

function renderBookingActions(b) {
    if (b.status === 'pending') {
        return `
            <button class="btn" onclick="confirmBooking('${b._id}')">
                Xác nhận
            </button>
            <button class="btn muted" onclick="cancelBooking('${b._id}')">
                Huỷ
            </button>
        `;
    }

    if (b.status === 'confirmed') {
        return `
            <button class="btn" onclick="completeBooking('${b._id}')">
                Hoàn thành
            </button>
        `;
    }

    return `
        <button class="btn muted" onclick="viewBooking('${b._id}')">
            Xem
        </button>
    `;
}

function formatBookingStatus(status) {
    const map = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        in_progress: 'Đang thực hiện',
        completed: 'Hoàn thành',
        cancelled: 'Đã huỷ'
    };
    return map[status] || status;
}

function handleFilter() {
    const status = document.getElementById('status-filter').value;

    if (!status) {
        renderBookingsTable(bookings);
        return;
    }

    const filtered = bookings.filter(b => b.status === status);
    renderBookingsTable(filtered);
}

async function confirmBooking(bookingId) {
    if (!confirm('Xác nhận đơn đặt lịch này?')) return;

    try {
        const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed'
            })
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.error || 'Không thể xác nhận booking');
            return;
        }

        // cập nhật local state (frontend)
        const index = bookings.findIndex(b => b._id === bookingId);
        if (index !== -1) {
            bookings[index] = result.booking;
        }

        renderBookingsTable();
        alert('Đã xác nhận đặt lịch');

    } catch (error) {
        console.error('❌ confirmBooking error:', error);
        alert('Lỗi kết nối server');
    }
}
