import { API_BASE } from "./config.js";

// JavaScript cho trang Dịch vụ
let currentView = 'grid';
let currentSort = 'default';
let currentPage = 1;
let itemsPerPage = 9;
let filteredProducts = [];
let products = [];
let activeFilters = {
    category: [],
    price: [],
    duration: [],
    rating: [],
    special: [],
    search: ''
};

// Khởi tạo trang dịch vụ
document.addEventListener('DOMContentLoaded', function () {
    initializeServicesPage();
});

async function initializeServicesPage() {
    try {
        // Khởi tạo AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });

        // Tải dữ liệu nếu chưa có
        await loadServicesData();


        // Lấy tham số URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        const searchParam = urlParams.get('search');

        // Thiết lập bộ lọc ban đầu từ URL
        if (categoryParam) {
            activeFilters.category = [categoryParam];
        }
        if (searchParam) {
            activeFilters.search = searchParam;
            document.getElementById('search-input').value = searchParam;
        }

        // Khởi tạo các thành phần
        renderCategoryFilters();
        setupEventListeners();

        // Áp dụng bộ lọc ban đầu và hiển thị
        applyFilters();

        console.log('Services page initialized');
    } catch (error) {
        console.error('Error initializing services page:', error);
    }
}

async function loadServicesData() {
    try {
        // Thử tải từ API
        const response = await fetch(`${API_BASE}/products`);
        const categoryResponse = await fetch(`${API_BASE}/categories`);
        if (response.ok) {
            const data = await response.json();
            products = data?.data;
            const categoriesData = await categoryResponse.json();
            products.forEach(product => {
                const category = categoriesData.data.find(cat => cat._id === product.category);
                product.category = category ? category.name : 'Khác';
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu dịch vụ:', error);
        // Sử dụng dữ liệu mẫu nếu thất bại
        loadSampleServicesData();
    }
}

function loadSampleServicesData() {
    const sampleProducts = [
        {
            id: 1,
            name: "Massage Thư Giãn Toàn Thân",
            price: 300000,
            originalPrice: 350000,
            discount: 14,
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
            rating: 4.8,
            reviewCount: 127,
            trending: true,
            bestseller: true,
            featured: true,
            duration: 60,
            categoryId: 1,
            category: "Massage & Spa",
            description: "Giảm stress, thư giãn cơ bắp, phục hồi năng lượng với các kỹ thuật massage chuyên nghiệp.",
            tags: ["massage", "thư giãn", "giảm stress"]
        },
        {
            id: 2,
            name: "Chăm Sóc Da Mặt Cơ Bản",
            price: 250000,
            originalPrice: 300000,
            discount: 17,
            image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
            rating: 4.6,
            reviewCount: 89,
            trending: true,
            bestseller: false,
            featured: true,
            duration: 45,
            categoryId: 2,
            category: "Chăm Sóc Da",
            description: "Làm sạch, dưỡng ẩm và bảo vệ da mặt với các sản phẩm thiên nhiên cao cấp.",
            tags: ["skincare", "facial", "làm đẹp"]
        },
        {
            id: 3,
            name: "Tẩy Tế Bào Chết Toàn Thân",
            price: 400000,
            originalPrice: 450000,
            discount: 11,
            image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop",
            rating: 4.7,
            reviewCount: 156,
            trending: false,
            bestseller: true,
            featured: false,
            duration: 90,
            categoryId: 2,
            category: "Chăm Sóc Da",
            description: "Loại bỏ tế bào chết, làm mềm mịn da và tăng cường tuần hoàn máu.",
            tags: ["exfoliate", "body care", "detox"]
        },
        {
            id: 4,
            name: "Massage Đá Nóng",
            price: 450000,
            originalPrice: 500000,
            discount: 10,
            image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop",
            rating: 4.9,
            reviewCount: 203,
            trending: true,
            bestseller: true,
            featured: true,
            duration: 75,
            categoryId: 1,
            category: "Massage & Spa",
            description: "Massage với đá nóng giúp thư giãn sâu, giảm đau nhức và cải thiện tuần hoàn.",
            tags: ["hot stone", "massage", "therapy"]
        },
        {
            id: 5,
            name: "Liệu Trình Trị Mụn",
            price: 350000,
            originalPrice: 400000,
            discount: 12,
            image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop",
            rating: 4.5,
            reviewCount: 78,
            trending: false,
            bestseller: false,
            featured: true,
            duration: 60,
            categoryId: 2,
            category: "Chăm Sóc Da",
            description: "Điều trị mụn chuyên sâu với công nghệ hiện đại và sản phẩm an toàn.",
            tags: ["acne treatment", "skincare", "facial"]
        },
        {
            id: 6,
            name: "Cắt Tóc & Tạo Kiểu",
            price: 200000,
            originalPrice: 250000,
            discount: 20,
            image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
            rating: 4.3,
            reviewCount: 95,
            trending: true,
            bestseller: false,
            featured: false,
            duration: 45,
            categoryId: 3,
            category: "Chăm Sóc Tóc",
            description: "Cắt tóc và tạo kiểu theo xu hướng mới nhất với stylist chuyên nghiệp.",
            tags: ["haircut", "styling", "hair"]
        }
    ];

    if (window.SpaApp) {
        window.SpaApp.products = sampleProducts;
    } else {
        window.SpaApp = { products: sampleProducts };
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container || !products) return;

    // Get unique categories
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

    const filtersHTML = categories.map(category => {
        const count = products.filter(p => p.category === category).length;
        return `
            <label class="filter-option">
                <input type="checkbox" class="filter-checkbox category-filter" value="${category}" 
                       ${activeFilters.category.includes(category) ? 'checked' : ''}>
                <span>${category} (${count})</span>
            </label>
        `;
    }).join('');

    container.innerHTML = filtersHTML;
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    // View toggles
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const view = this.dataset.view;
            switchView(view);
        });
    });

    // Filter checkboxes
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('filter-checkbox')) {
            handleFilterChange(e.target);
        }
    });

    // Clear filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }

    // Reset search
    const resetSearch = document.getElementById('reset-search');
    if (resetSearch) {
        resetSearch.addEventListener('click', resetFilters);
    }

    // Pagination
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    if (prevPage) prevPage.addEventListener('click', () => changePage(currentPage - 1));
    if (nextPage) nextPage.addEventListener('click', () => changePage(currentPage + 1));
}

function handleSearch(e) {
    activeFilters.search = e.target.value.toLowerCase();
    currentPage = 1;
    applyFilters();
}

function handleSort(e) {
    currentSort = e.target.value;
    applyFilters();
}

function handleFilterChange(checkbox) {
    const filterType = checkbox.classList.contains('category-filter') ? 'category' :
        checkbox.classList.contains('price-filter') ? 'price' :
            checkbox.classList.contains('duration-filter') ? 'duration' :
                checkbox.classList.contains('rating-filter') ? 'rating' :
                    checkbox.classList.contains('special-filter') ? 'special' : null;

    if (!filterType) return;

    const value = checkbox.value;

    if (checkbox.checked) {
        if (!activeFilters[filterType].includes(value)) {
            activeFilters[filterType].push(value);
        }
    } else {
        activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
    }

    currentPage = 1;
    applyFilters();
}

function switchView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update container class
    const container = document.getElementById('products-container');
    if (container) {
        if (view === 'list') {
            container.className = 'space-y-6';
        } else {
            container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
        }
    }

    renderProducts();
}

function applyFilters() {
    showLoading(true);

    // Start with all products
    let filtered = [...products];

    // Apply search filter
    if (activeFilters.search) {
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(activeFilters.search) ||
            product.description?.toLowerCase().includes(activeFilters.search) ||
            product.tags?.some(tag => tag.toLowerCase().includes(activeFilters.search))
        );
    }

    // Apply category filter
    if (activeFilters.category.length > 0) {
        filtered = filtered.filter(product =>
            activeFilters.category.includes(product.category)
        );
    }

    // Apply price filter
    if (activeFilters.price.length > 0) {
        filtered = filtered.filter(product => {
            return activeFilters.price.some(range => {
                if (range === '1000000+') return product.price >= 1000000;

                const [min, max] = range.split('-').map(Number);
                return product.price >= min && product.price <= max;
            });
        });
    }

    // Apply duration filter
    if (activeFilters.duration.length > 0) {
        filtered = filtered.filter(product => {
            if (!product.duration) return false;

            return activeFilters.duration.some(range => {
                if (range === '90+') return product.duration >= 90;

                const [min, max] = range.split('-').map(Number);
                return product.duration >= min && product.duration <= max;
            });
        });
    }

    // Apply rating filter
    if (activeFilters.rating.length > 0) {
        filtered = filtered.filter(product => {
            if (!product.rating) return false;

            return activeFilters.rating.some(range => {
                const minRating = parseFloat(range.replace('+', ''));
                return product.rating >= minRating;
            });
        });
    }

    // Apply special filters
    if (activeFilters.special.length > 0) {
        console.log("🚀 ~ applyFilters ~ products:", products)
        const top10TrendingProducts = products?.sort((a, b) => (b.boughtQuantity || 0) - (a.boughtQuantity || 0)).slice(0, 10);
        const top10BestSellerProducts = products?.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 10);
        filtered = filtered.filter(product => {
            console.log("🚀 ~ applyFilters ~ product:", product)
            return activeFilters.special.some(special => {
                switch (special) {
                    case 'discount':
                        return product.originalPrice && product.price < product.originalPrice;
                    case 'trending':
                        return top10TrendingProducts?.includes(product);
                    case 'bestseller':
                        return top10BestSellerProducts?.includes(product);
                    case 'featured':
                        return product.featured;
                    default:
                        return false;
                }
            });
        });
    }

    // Apply sorting
    filtered = sortProducts(filtered, currentSort);

    // Store filtered results
    filteredProducts = filtered;

    // Reset to first page
    currentPage = 1;

    // Update UI
    setTimeout(() => {
        showLoading(false);
        updateActiveFiltersDisplay();
        renderProducts();
        renderPagination();
        updateResultsCount();
    }, 300);
}

function sortProducts(products, sortType) {
    const sorted = [...products];

    switch (sortType) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'rating-desc':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'duration-asc':
            return sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        case 'duration-desc':
            return sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
        default:
            return sorted;
    }
}

function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    if (paginatedProducts.length === 0) {
        showNoResults(true);
        return;
    }

    showNoResults(false);

    if (currentView === 'grid') {
        container.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
    } else {
        container.innerHTML = paginatedProducts.map(product => createProductListItem(product)).join('');
    }

    // Add event listeners to new products
    addProductEventListeners(container);

    // Animate products
    container.querySelectorAll('.product-card, .product-list-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('animate-fade-in');
    });
}

function createProductCard(product) {
    const discountPercent = product.originalPrice ?
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const thumbnail = product.images && product.images.length > 0 ? `${API_BASE}/files/${product?.images[0]?.gridfsId}` : 'https://via.placeholder.com/400x300?text=No+Image';

    return `
        <div class="product-card" data-product-id="${product._id}" data-aos="fade-up">
            <div class="product-image">
                <img src="${thumbnail}" alt="${product.name}" loading="lazy">
                ${product.trending ? '<span class="product-badge trending">Xu Hướng</span>' : ''}
                ${product.bestseller ? '<span class="product-badge bestseller">Bán Chạy</span>' : ''}
                ${discountPercent > 0 ? `<span class="product-badge discount">-${discountPercent}%</span>` : ''}
                <div class="product-actions">
                    <button class="product-action-btn wishlist-btn" title="Thêm vào yêu thích" data-product-id="${product._id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="product-action-btn quick-view-btn" title="Xem nhanh" data-product-id="${product._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="product-action-btn compare-btn" title="So sánh" data-product-id="${product._id}">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-primary-300 bg-primary-50 px-2 py-1 rounded-full">
                        ${product.category}
                    </span>
                    ${product.duration ? `<span class="text-xs text-gray-500">${product.duration} phút</span>` : ''}
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-primary-300 transition-colors cursor-pointer line-clamp-2">
                    ${product.name}
                </h3>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${product.description || ''}</p>
                <div class="flex items-center mb-3">
                    <div class="rating-stars">
                        ${generateStarRating(product.rating || 0)}
                    </div>
                    <span class="text-sm text-gray-500 ml-2">(${product.reviewCount || 0})</span>
                </div>
                <div class="price-section mb-4">
                    <div class="flex items-center space-x-2">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                    ${discountPercent > 0 ? `<div class="discount-percent">Tiết kiệm ${discountPercent}%</div>` : ''}
                </div>
                <div class="flex space-x-2">
                    <button class="add-to-cart-btn flex-1 btn-primary text-sm py-2" data-product-id="${product._id}">
                        <i class="fas fa-calendar-plus mr-2"></i>
                        Đặt Lịch
                    </button>
                    <button class="view-details-btn btn-outline text-sm py-2 px-4" data-product-id="${product._id}">
                        Chi Tiết
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createProductListItem(product) {
    const discountPercent = product.originalPrice ?
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const thumbnail = product.images && product.images.length > 0 ? `${API_BASE}/files/${product?.images[0]?.gridfsId}` : 'https://via.placeholder.com/400x300?text=No+Image';

    return `
        <div class="product-list-item bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300" data-product-id="${product._id}">
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div class="relative flex-shrink-0">
                    <img src="${thumbnail}" alt="${product.name}" class="w-full md:w-48 h-48 object-cover rounded-lg">
                    ${product.trending ? '<span class="absolute top-2 left-2 product-badge trending">Xu Hướng</span>' : ''}
                    ${product.bestseller ? '<span class="absolute top-2 left-2 product-badge bestseller">Bán Chạy</span>' : ''}
                    ${discountPercent > 0 ? `<span class="absolute top-2 right-2 product-badge discount">-${discountPercent}%</span>` : ''}
                </div>
                
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-primary-300 bg-primary-50 px-2 py-1 rounded-full">
                            ${product.category}
                        </span>
                        ${product.duration ? `<span class="text-sm text-gray-500"><i class="fas fa-clock mr-1"></i>${product.duration} phút</span>` : ''}
                    </div>
                    
                    <h3 class="text-xl font-semibold text-gray-800 mb-2 hover:text-primary-300 transition-colors cursor-pointer">
                        ${product.name}
                    </h3>
                    
                    <p class="text-gray-600 mb-4">${product.description || ''}</p>
                    
                    <div class="flex items-center mb-4">
                        <div class="rating-stars">
                            ${generateStarRating(product.rating || 0)}
                        </div>
                        <span class="text-sm text-gray-500 ml-2">(${product.reviewCount || 0} đánh giá)</span>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="price-section">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="current-price text-xl">${formatPrice(product.price)}</span>
                                ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                            </div>
                            ${discountPercent > 0 ? `<div class="discount-percent">Tiết kiệm ${discountPercent}%</div>` : ''}
                        </div>
                        
                        <div class="flex space-x-2">
                            <button class="product-action-btn wishlist-btn" title="Thêm vào yêu thích" data-product-id="${product._id}">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="add-to-cart-btn btn-primary px-6 py-2" data-product-id="${product._id}">
                                <i class="fas fa-calendar-plus mr-2"></i>
                                Đặt Lịch
                            </button>
                            <button class="view-details-btn btn-outline px-4 py-2" data-product-id="${product._id}">
                                Chi Tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateActiveFiltersDisplay() {
    const activeFiltersEl = document.getElementById('active-filters');
    const activeFiltersListEl = document.getElementById('active-filters-list');

    if (!activeFiltersEl || !activeFiltersListEl) return;

    const filters = [];

    // Add search filter
    if (activeFilters.search) {
        filters.push({
            type: 'search',
            label: `"${activeFilters.search}"`,
            value: activeFilters.search
        });
    }

    // Add category filters
    activeFilters.category.forEach(category => {
        filters.push({
            type: 'category',
            label: category,
            value: category
        });
    });

    // Add price filters
    activeFilters.price.forEach(price => {
        let label = price;
        if (price === '1000000+') label = 'Trên 1.000.000đ';
        else if (price.includes('-')) {
            const [min, max] = price.split('-').map(Number);
            label = `${formatPrice(min)} - ${formatPrice(max)}`;
        }

        filters.push({
            type: 'price',
            label: label,
            value: price
        });
    });

    // Add duration filters
    activeFilters.duration.forEach(duration => {
        let label = duration;
        if (duration === '90+') label = 'Trên 90 phút';
        else if (duration.includes('-')) {
            label = duration.replace('-', ' - ') + ' phút';
        }

        filters.push({
            type: 'duration',
            label: label,
            value: duration
        });
    });

    // Add rating filters
    activeFilters.rating.forEach(rating => {
        filters.push({
            type: 'rating',
            label: `${rating} sao`,
            value: rating
        });
    });

    // Add special filters
    activeFilters.special.forEach(special => {
        let label = special;
        switch (special) {
            case 'discount': label = 'Có giảm giá'; break;
            case 'trending': label = 'Xu hướng'; break;
            case 'bestseller': label = 'Bán chạy'; break;
            case 'featured': label = 'Nổi bật'; break;
        }

        filters.push({
            type: 'special',
            label: label,
            value: special
        });
    });

    if (filters.length === 0) {
        activeFiltersEl.classList.add('hidden');
    } else {
        activeFiltersEl.classList.remove('hidden');
        activeFiltersListEl.innerHTML = filters.map(filter => `
            <button class="active-filter-tag flex items-center space-x-2 bg-primary-100 text-primary-400 px-3 py-1 rounded-full text-sm hover:bg-primary-200 transition-colors" 
                    data-type="${filter.type}" data-value="${filter.value}">
                <span>${filter.label}</span>
                <i class="fas fa-times text-xs"></i>
            </button>
        `).join('');

        // Add event listeners to remove filter tags
        activeFiltersListEl.querySelectorAll('.active-filter-tag').forEach(tag => {
            tag.addEventListener('click', function () {
                const type = this.dataset.type;
                const value = this.dataset.value;
                removeFilter(type, value);
            });
        });
    }
}

function removeFilter(type, value) {
    if (type === 'search') {
        activeFilters.search = '';
        document.getElementById('search-input').value = '';
    } else if (activeFilters[type]) {
        activeFilters[type] = activeFilters[type].filter(v => v !== value);

        // Update corresponding checkboxes
        const checkbox = document.querySelector(`input[value="${value}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    currentPage = 1;
    applyFilters();
}

function clearAllFilters() {
    // Reset all filters
    activeFilters = {
        category: [],
        price: [],
        duration: [],
        rating: [],
        special: [],
        search: ''
    };

    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    // Uncheck all checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    currentPage = 1;
    applyFilters();
}

function resetFilters() {
    clearAllFilters();
}

function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    const prevPageEl = document.getElementById('prev-page');
    const nextPageEl = document.getElementById('next-page');
    const pageNumbersEl = document.getElementById('page-numbers');

    if (!paginationEl || !prevPageEl || !nextPageEl || !pageNumbersEl) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        return;
    }

    paginationEl.style.display = 'flex';

    // Update prev/next buttons
    prevPageEl.disabled = currentPage === 1;
    nextPageEl.disabled = currentPage === totalPages;

    // Generate page numbers
    const pageNumbers = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
    }

    pageNumbersEl.innerHTML = pageNumbers.map(page => `
        <button class="pagination-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">
            ${page}
        </button>
    `).join('');

    // Add event listeners to page numbers
    pageNumbersEl.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = parseInt(this.dataset.page);
            changePage(page);
        });
    });
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderProducts();
    renderPagination();

    // Scroll to top of products
    const container = document.getElementById('products-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateResultsCount() {
    const resultsCountEl = document.getElementById('results-count');
    if (resultsCountEl) {
        resultsCountEl.textContent = filteredProducts.length;
    }
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('products-container');

    if (show) {
        if (loadingEl) loadingEl.classList.remove('hidden');
        if (containerEl) containerEl.style.opacity = '0.5';
    } else {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (containerEl) containerEl.style.opacity = '1';
    }
}

function showNoResults(show) {
    const noResultsEl = document.getElementById('no-results');
    const containerEl = document.getElementById('products-container');
    const paginationEl = document.getElementById('pagination');

    if (show) {
        if (noResultsEl) noResultsEl.classList.remove('hidden');
        if (containerEl) containerEl.classList.add('hidden');
        if (paginationEl) paginationEl.style.display = 'none';
    } else {
        if (noResultsEl) noResultsEl.classList.add('hidden');
        if (containerEl) containerEl.classList.remove('hidden');
    }
}

// Utility functions
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star"></i>';
    }

    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star empty"></i>';
    }

    return starsHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function addProductEventListeners(container) {
    // Add to cart buttons
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = this.dataset.productId;
            if (window.SpaApp && window.SpaApp.addToCart) {
                window.SpaApp.addToCart(productId);
            }
        });
    });

    // View details buttons
    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = this.dataset.productId;
            if (window.SpaApp && window.SpaApp.viewProductDetails) {
                window.SpaApp.viewProductDetails(productId);
            }
        });
    });

    // Wishlist buttons
    container.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(this.dataset.productId);
            if (window.SpaApp && window.SpaApp.toggleWishlist) {
                window.SpaApp.toggleWishlist(productId);
            }
        });
    });

    // Product card/item click
    container.querySelectorAll('.product-card, .product-list-item, .view-details-btn').forEach(item => {
        item.addEventListener('click', function (e) {
            if (!e.target.closest('button')) {
                const productId = this.dataset.productId;
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}