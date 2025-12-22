// Import cấu hình
import { API_BASE } from './config.js';
import { getCurrentUser, isAuthenticated } from './auth-helper.js';

// Biến toàn cục
let services = {};
let selectedService = null;
let selectedServices = []; // Mảng lưu các dịch vụ đã chọn
let currentUser = null;

// Khởi tạo AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
});

const appliedPromo = false

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', async function () {
    await initializeBooking();
});

async function initializeBooking() {
    try {
        // Kiểm tra xác thực
        currentUser = getCurrentUser();

        // Tải danh sách dịch vụ từ API
        await loadServices();

        // Đặt ngày tối thiểu là hôm nay
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
        }

        // Kiểm tra URL parameters cho dịch vụ được chọn trước
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('id');

        if (serviceId && services[serviceId]) {
            // Chọn trước dịch vụ từ URL
            const serviceSelect = document.getElementById('service');
            if (serviceSelect) {
                serviceSelect.value = serviceId;
                updateServiceInfo(serviceId);
                selectedServices.push(services[serviceId]);
                renderSelectedServices();
            }
        }

        // Điền trước thông tin người dùng nếu đã đăng nhập
        if (currentUser) {
            prefillUserInfo();
        }

        // Thiết lập event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing booking:', error);
        showError('Không thể tải thông tin đặt lịch. Vui lòng thử lại sau.');
    }
}

function calculateDiscount() {
    if (!appliedPromo) return 0;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    if (appliedPromo.type === 'percent') {
        return subtotal * (appliedPromo.discount / 100);
    } else {
        return appliedPromo.discount;
    }
}

function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((total, item) => selectedItems.includes(item.id.toString()) ? total + item.totalAmount : total, 0);
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
}


function bookingNow() {
    const selectItemId = Date.now().toString()
    const form = document.getElementById('booking-form');
    if (!form) return;

    const formData = new FormData(form);
    const bookingData = {
        fullname: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        appointmentDate: formData.get('bookingDate'),
        appointmentTime: formData.get('bookingTime'),
        notes: formData.get('specialRequests') || '',
        services: selectedServices
    };
    console.log("🚀 ~ bookingNow ~ bookingData:", bookingData)

    addBookingToCart(bookingData, selectItemId);

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (cart.length === 0) {
        showNotification('Giỏ hàng trống. Vui lòng thêm sản phẩm!', 'warning');
        return;
    }

    // Chỉ lấy các items đã được chọn
    const selectedCart = cart.filter(item => {
        console.log("🚀 ~ bookingNow ~ item:", item)
        return item.id === selectItemId;
    });
    console.log("🚀 ~ bookingNow ~ selectedCart:", selectedCart)

    // Save checkout data với selected items
    const checkoutData = {
        bookingDate: new Date().toISOString(),
        bookingTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        items: selectedCart,
        subtotal: selectedCart.reduce((total, item) => {
            if (item.type === 'booking' && item.totalAmount) {
                return total + item.totalAmount;
            }
            return total + (item.price * item.quantity);
        }, 0),
        appliedPromo: false,
        discount: calculateDiscount(),
        total: calculateTotal()
    };

    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // Redirect to checkout
    window.location.href = 'checkout.html';
}

// Tải danh sách dịch vụ từ API
async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/products`);

        if (!response.ok) {
            throw new Error('Không thể tải danh sách dịch vụ');
        }

        const data = await response.json();
        const servicesList = data.data || data;

        // Chuyển đổi sang object services
        services = {};
        servicesList.forEach(product => {
            const serviceId = product._id;
            services[serviceId] = {
                id: product._id,
                name: product.name,
                price: formatPrice(product.price),
                priceValue: product.price,
                duration: product.duration || 'Liên hệ',
                description: product.description || '',
                image: product.images?.[0]?.gridfsId || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop'
            };
        });

        // Cập nhật dropdown danh sách dịch vụ
        updateServiceDropdown();
    } catch (error) {
        console.error('Lỗi khi tải danh sách dịch vụ:', error);
        // Sử dụng dữ liệu mẫu nếu API thất bại
        loadSampleServices();
        updateServiceDropdown();
    }
}


// Update service dropdown with loaded services
function updateServiceDropdown() {
    const serviceSelect = document.getElementById('service');
    if (!serviceSelect) return;

    // Clear existing options except the first one
    while (serviceSelect.options.length > 1) {
        serviceSelect.remove(1);
    }

    // Add services as options
    Object.entries(services).forEach(([key, service]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = service.name;
        serviceSelect.appendChild(option);
    });
}

// Pre-fill user info if logged in
function prefillUserInfo() {
    if (!currentUser) return;

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (fullNameInput && currentUser.name) {
        fullNameInput.value = currentUser.name;
    }
    if (emailInput && currentUser.email) {
        emailInput.value = currentUser.email;
    }
    if (phoneInput && currentUser.phone) {
        phoneInput.value = currentUser.phone;
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Setup event listeners
function setupEventListeners() {
    // Service selection handler
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function () {
            updateServiceInfo(this.value);
        });
    }

    // Add service button
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', addSelectedService);
    }

    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }

    // Form submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            bookingNow()
        });
    }

    // Modal close handlers
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// Thêm dịch vụ vào danh sách đã chọn
function addSelectedService() {
    const serviceSelect = document.getElementById('service');
    const serviceId = serviceSelect.value;

    if (!serviceId) {
        showError('Vui lòng chọn dịch vụ');
        return;
    }

    // Kiểm tra dịch vụ đã được chọn chưa
    if (selectedServices.find(s => s.id === serviceId)) {
        showError('Dịch vụ này đã được chọn');
        return;
    }

    const service = services[serviceId];
    if (service) {
        selectedServices.push(service);
        renderSelectedServices();
        updateServiceInfo(null); // Reset preview
        serviceSelect.value = ''; // Reset select
    }
}

// Xóa dịch vụ khỏi danh sách
function removeSelectedService(serviceId) {
    selectedServices = selectedServices.filter(s => s.id !== serviceId);
    renderSelectedServices();
}

// Hiển thị danh sách dịch vụ đã chọn
function renderSelectedServices() {
    const container = document.getElementById('selected-services');
    const noServicesMsg = document.getElementById('no-services-msg');

    if (!container || !noServicesMsg) return;

    if (selectedServices.length === 0) {
        container.classList.add('hidden');
        noServicesMsg.classList.remove('hidden');
        updateServiceInfo(null);
        return;
    }

    container.classList.remove('hidden');
    noServicesMsg.classList.add('hidden');

    container.innerHTML = selectedServices.map(service => `
        <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <img src="${API_BASE}/files/${service.image}" 
                 alt="${service.name}" 
                 class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
            <div class="flex-1 min-w-0">
                <h5 class="font-semibold text-gray-800 truncate">${service.name}</h5>
                <p class="text-sm text-primary-500 font-medium">${service.price}</p>
                <p class="text-xs text-gray-500">${service.duration} phút</p>
            </div>
            <button type="button" 
                    onclick="removeSelectedService('${service.id}')"
                    class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Cập nhật thông tin tổng hợp
    updateServicesSummary();
}

// Cập nhật thông tin tóm tắt các dịch vụ
function updateServicesSummary() {
    const serviceInfo = document.getElementById('service-info');
    if (!serviceInfo) return;

    if (selectedServices.length === 0) {
        serviceInfo.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-hand-sparkles text-4xl text-primary-500 mb-4"></i>
                <p class="text-gray-500">Chọn dịch vụ để xem thông tin chi tiết</p>
            </div>
        `;
        return;
    }

    const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceValue, 0);

    serviceInfo.innerHTML = `
        <div class="space-y-4">
            <div class="text-center pb-4 border-b border-gray-200">
                <h4 class="font-semibold text-gray-800 mb-1">Tổng quan đặt lịch</h4>
                <p class="text-sm text-gray-600">${selectedServices.length} dịch vụ</p>
            </div>
            
            <div class="max-h-48 overflow-y-auto space-y-2">
                ${selectedServices.map(service => `
                    <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <img src="${API_BASE}/files/${service.image}" 
                             alt="${service.name}" 
                             class="w-12 h-12 object-cover rounded-lg">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800 truncate">${service.name}</p>
                            <p class="text-xs text-primary-500">${service.price}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <span class="text-gray-700 font-medium">Tổng tiền:</span>
                    <span class="text-xl font-bold text-primary-500">${formatPrice(totalPrice)}</span>
                </div>
            </div>
        </div>
    `;
}

// Update service info display
function updateServiceInfo(serviceId) {
    const serviceInfo = document.getElementById('service-info');
    if (!serviceInfo) return;

    if (serviceId && services[serviceId]) {
        selectedService = services[serviceId];
        serviceInfo.innerHTML = `
            <div class="text-center mb-4">
                <img src="${API_BASE}/files/${selectedService.image}" alt="${selectedService.name}" class="w-full h-32 object-cover rounded-lg mb-3">
                <h4 class="font-semibold text-gray-800">${selectedService.name}</h4>
            </div>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-gray-600">Giá:</span>
                    <span class="font-semibold text-primary-500">${selectedService.price}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Thời gian:</span>
                    <span class="font-semibold">${selectedService.duration}</span>
                </div>
                <p class="text-sm text-gray-600 mt-3">${selectedService.description}</p>
            </div>
        `;
    } else {
        selectedService = null;
        if (selectedServices.length > 0) {
            updateServicesSummary();
        } else {
            serviceInfo.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-hand-sparkles text-4xl text-primary-500 mb-4"></i>
                    <p class="text-gray-500">Chọn dịch vụ để xem thông tin chi tiết</p>
                </div>
            `;
        }
    }
}

// Xử lý thêm vào giỏ hàng
function handleAddToCart() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    const formData = new FormData(form);
    const bookingData = {
        fullname: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        appointmentDate: formData.get('bookingDate'),
        appointmentTime: formData.get('bookingTime'),
        notes: formData.get('specialRequests') || '',
        services: selectedServices
    };

    // Validate basic info
    if (!validateBookingForCart(bookingData)) {
        return;
    }

    // Add to cart (localStorage)
    addBookingToCart(bookingData);

    // Show success message
    showNotification('Đã thêm vào giỏ hàng thành công!', 'success');

    // Reset form
    form.reset();
    selectedServices = [];
    renderSelectedServices();
    updateServiceInfo(null);
}

// Validate booking data for cart (không cần đầy đủ như submit)
function validateBookingForCart(data) {
    if (selectedServices.length === 0) {
        showError('Vui lòng chọn ít nhất một dịch vụ');
        return false;
    }

    if (!data.appointmentDate || !data.appointmentTime) {
        showError('Vui lòng chọn ngày và giờ hẹn');
        return false;
    }

    // Validate date is not in the past
    const selectedDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showError('Ngày hẹn không được trong quá khứ');
        return false;
    }

    return true;
}

// Thêm booking vào giỏ hàng trong localStorage
function addBookingToCart(bookingData, itemId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Tạo cart item với format phù hợp
    const cartItem = {
        id: itemId ? itemId : Date.now().toString(), // Unique ID cho cart item
        type: 'booking',
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        services: bookingData.services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.priceValue,
            image: s.image,
            duration: s.duration
        })),
        totalAmount: bookingData.services.reduce((sum, s) => sum + s.priceValue, 0),
        notes: bookingData.notes,
        fullname: bookingData.fullname || '',
        email: bookingData.email || '',
        phone: bookingData.phone || ''
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart count if function exists
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full`;

    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        notification.innerHTML = `
            <div class="flex items-center gap-3 text-white">
                <i class="fas fa-check-circle text-2xl"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        notification.innerHTML = `
            <div class="flex items-center gap-3 text-white">
                <i class="fas fa-exclamation-circle text-2xl"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        notification.innerHTML = `
            <div class="flex items-center gap-3 text-white">
                <i class="fas fa-info-circle text-2xl"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
        submitBtn.disabled = true;

        // Get form data
        const formData = new FormData(this);
        const bookingData = {
            fullname: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            service: formData.get('service'),
            appointmentDate: formData.get('bookingDate'),
            appointmentTime: formData.get('bookingTime'),
            notes: formData.get('specialRequests') || ''
        };

        // Validate
        if (!validateBooking(bookingData)) {
            throw new Error('Vui lòng điền đầy đủ thông tin');
        }

        // Check if user is logged in
        if (!currentUser) {
            // Save booking data to localStorage for after login
            localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

            // Redirect to login with return URL
            if (confirm('Bạn cần đăng nhập để đặt lịch. Chuyển đến trang đăng nhập?')) {
                window.location.href = `login.html?redirect=booking.html${window.location.search}`;
            }
            return;
        }

        // Submit booking to API
        const result = await submitBooking(bookingData);

        if (result.success) {
            // Show success modal
            showSuccessModal(result.booking);

            // Reset form
            this.reset();
            selectedServices = []; // Clear selected services
            renderSelectedServices();
            updateServiceInfo(null);

            // Clear pending booking
            localStorage.removeItem('pendingBooking');
        } else {
            throw new Error(result.message || 'Đặt lịch thất bại');
        }

    } catch (error) {
        console.error('Booking error:', error);
        showError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Validate booking data
function validateBooking(data) {
    if (!data.fullname || !data.email || !data.phone) {
        showError('Vui lòng điền đầy đủ thông tin cá nhân');
        return false;
    }

    if (selectedServices.length === 0) {
        showError('Vui lòng chọn ít nhất một dịch vụ');
        return false;
    }

    if (!data.appointmentDate || !data.appointmentTime) {
        showError('Vui lòng chọn ngày và giờ hẹn');
        return false;
    }

    // Validate date is not in the past
    const selectedDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showError('Ngày hẹn không được trong quá khứ');
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showError('Email không hợp lệ');
        return false;
    }

    // Validate phone format (Vietnamese phone)
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        showError('Số điện thoại không hợp lệ');
        return false;
    }

    return true;
}

// Submit booking to API
async function submitBooking(bookingData) {
    try {
        // Prepare API payload với nhiều dịch vụ
        const totalAmount = selectedServices.reduce((sum, s) => sum + s.priceValue, 0);

        const payload = {
            fullname: bookingData.fullname,
            email: bookingData.email,
            phone: bookingData.phone,
            customerId: currentUser._id || currentUser.id,
            services: selectedServices.map(service => ({
                product: service.id,
                quantity: 1,
                price: service.priceValue
            })),
            appointmentDate: bookingData.appointmentDate,
            appointmentTime: bookingData.appointmentTime,
            notes: bookingData.notes,
            finalAmount: totalAmount
        };

        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Đặt lịch thất bại');
        }

        const result = await response.json();

        return {
            success: true,
            booking: result.booking || result,
            message: result.message || 'Đặt lịch thành công'
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || 'Không thể kết nối đến server'
        };
    }
}

// Show success modal
function showSuccessModal(booking) {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Add flex display when showing
    modal.classList.add('flex');

    const transform = modal.querySelector('.transform');
    if (transform) {
        setTimeout(() => {
            transform.classList.add('scale-100');
            transform.classList.remove('scale-95');
        }, 10);
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    const transform = modal.querySelector('.transform');
    if (transform) {
        transform.classList.remove('scale-100');
        transform.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Go to home
function goToHome() {
    window.location.href = 'index.html';
}

// Show error message
function showError(message) {
    // You can implement a custom error modal or use alert
    alert(message);
}

// Make functions available globally for onclick handlers
window.closeModal = closeModal;
window.goToHome = goToHome;
window.removeSelectedService = removeSelectedService;