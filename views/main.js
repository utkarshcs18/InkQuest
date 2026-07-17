document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // DOM Element References
    // =============================================
    const searchForm       = document.getElementById('search-form');
    const searchInput      = document.getElementById('search-input');
    const loader           = document.getElementById('loader');
    const errorMessage     = document.getElementById('error-message');
    const bookGrid         = document.getElementById('book-grid');
    const navActions       = document.getElementById('nav-actions');

    // Auth modal elements
    const authModal        = document.getElementById('auth-modal');
    const closeAuthModal   = document.getElementById('close-auth-modal');
    const authForm         = document.getElementById('auth-form');
    const authTitle        = document.getElementById('auth-title');
    const authSubmitBtn    = document.getElementById('auth-submit-btn');
    const usernameInput    = document.getElementById('username');
    const passwordInput    = document.getElementById('password');
    const authError        = document.getElementById('auth-error');
    const nameGroup        = document.getElementById('name-group');
    const nameInput        = document.getElementById('name');
    const authToggleBtn    = document.getElementById('auth-toggle-btn');
    
    // Recommendations and Search Sections
    const recommendationsSection = document.getElementById('recommendations-section');
    const searchResultsSection   = document.getElementById('search-results-section');
    const recommendationsGrid    = document.getElementById('recommendations-grid');

    // Book detail modal elements
    const bookModal        = document.getElementById('book-modal');
    const closeModal       = document.getElementById('close-modal');
    const modalTitle       = document.getElementById('modal-title');
    const modalAuthor      = document.getElementById('modal-author');
    const modalCover       = document.getElementById('modal-cover');
    const modalPlaceholder = document.getElementById('modal-cover-placeholder');
    const modalDescription = document.getElementById('modal-description');
    const modalLoader      = document.getElementById('modal-loader');
    const btnLikeBook      = document.getElementById('btn-like-book');

    let currentAuthAction = 'login'; // 'login' | 'signup'
    let likedBooksSet     = new Set();
    let currentBookData   = null;

    // =============================================
    // Auth State — Update Navbar
    // =============================================
    async function checkAuthState() {
        const token    = localStorage.getItem('inkquest_token');
        const username = localStorage.getItem('inkquest_username');
        const name     = localStorage.getItem('inkquest_name') || username; // Fallback to username if name is missing

        if (token && username) {
            navActions.innerHTML = `
                <span class="user-greeting">Hi, <strong>${name}</strong></span>
                <a href="/dashboard" class="btn-outline">Dashboard</a>
                <button type="button" id="btn-logout" class="btn-primary">Logout</button>
            `;
            document.getElementById('btn-logout').addEventListener('click', handleLogout);
            
            // Fetch liked books silently
            try {
                const response = await fetch('/api/users/liked-books', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    likedBooksSet = new Set(data.likedBooks.map(b => b.bookId));
                }
            } catch (err) {
                console.error('Error fetching liked books on init:', err);
            }
        } else {
            likedBooksSet.clear();
            navActions.innerHTML = `
                <button type="button" id="btn-login-modal" class="btn-outline">Login</button>
                <button type="button" id="btn-signup-modal" class="btn-primary">Sign Up</button>
            `;
            document.getElementById('btn-login-modal').addEventListener('click', () => openAuthModal('login'));
            document.getElementById('btn-signup-modal').addEventListener('click', () => openAuthModal('signup'));
        }
    }

    function openAuthModal(action) {
        currentAuthAction        = action;
        authTitle.textContent    = action === 'login' ? 'Login to InkQuest' : 'Create an Account';
        authSubmitBtn.textContent = action === 'login' ? 'Login' : 'Sign Up';
        authError.classList.add('hidden');
        nameInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        
        if (action === 'signup') {
            nameGroup.classList.remove('hidden');
            nameInput.required = true;
            authToggleBtn.textContent = 'Login Instead';
        } else {
            nameGroup.classList.add('hidden');
            nameInput.required = false;
            authToggleBtn.textContent = 'Sign Up Instead';
        }

        authModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        if (action === 'signup') {
            nameInput.focus();
        } else {
            usernameInput.focus();
        }
    }

    function closeAuthModalFn() {
        authModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function handleLogout() {
        localStorage.removeItem('inkquest_token');
        localStorage.removeItem('inkquest_username');
        localStorage.removeItem('inkquest_name');
        bookGrid.innerHTML = '';
        checkAuthState();
        showMessage('You have been logged out successfully.');
    }

    // =============================================
    // Auth Form Submit (Login / Signup)
    // =============================================
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name     = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) return;
        if (currentAuthAction === 'signup' && !name) return;

        authSubmitBtn.disabled    = true;
        authSubmitBtn.textContent = 'Please wait...';
        authError.classList.add('hidden');

        try {
            const url      = currentAuthAction === 'login' ? '/api/auth/login' : '/api/auth/signup';
            const bodyData = currentAuthAction === 'login' ? { username, password } : { name, username, password };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('inkquest_token',    data.token);
                localStorage.setItem('inkquest_username', data.username);
                localStorage.setItem('inkquest_name',     data.name || data.username);
                closeAuthModalFn();
                checkAuthState();
                errorMessage.classList.add('hidden');
            } else {
                authError.textContent = data.error || 'Authentication failed. Please try again.';
                authError.classList.remove('hidden');
            }
        } catch (err) {
            console.error('Auth error:', err);
            authError.textContent = 'Network error. Please try again.';
            authError.classList.remove('hidden');
        } finally {
            authSubmitBtn.disabled    = false;
            authSubmitBtn.textContent = currentAuthAction === 'login' ? 'Login' : 'Sign Up';
        }
    });

    // Toggle between login and signup
    authToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const newAction = currentAuthAction === 'login' ? 'signup' : 'login';
        openAuthModal(newAction);
    });

    // Close auth modal
    closeAuthModal.addEventListener('click', closeAuthModalFn);
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModalFn();
    });

    // =============================================
    // Book Search
    // =============================================
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        const token = localStorage.getItem('inkquest_token');
        if (!token) {
            showMessage('You must be logged in to search for books.');
            openAuthModal('login');
            return;
        }

        // Reset UI
        bookGrid.innerHTML = '';
        errorMessage.classList.add('hidden');
        recommendationsSection.classList.add('hidden');
        searchResultsSection.classList.remove('hidden');
        loader.classList.remove('hidden');

        try {
            const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                renderBooks(data.books);
            } else if (response.status === 401) {
                handleLogout();
                showMessage('Your session expired. Please log in again.');
            } else {
                showMessage(data.error || 'Failed to fetch books. Try again.');
            }
        } catch (err) {
            console.error('Search error:', err);
            showMessage('Network error. Please check your connection and try again.');
        } finally {
            loader.classList.add('hidden');
        }
    });

    // =============================================
    // Render Book Cards
    // =============================================
    function renderBooks(books, container = bookGrid) {
        if (!books || books.length === 0) {
            showMessage('No books found for that search. Try a different title!');
            return;
        }

        books.forEach(book => {
            const card     = document.createElement('div');
            card.className = 'book-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `View details for ${book.title}`);

            const coverUrl = book.coverId
                ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
                : null;

            card.innerHTML = `
                <div class="book-cover-container">
                    ${coverUrl
                        ? `<img src="${coverUrl}" alt="Cover of ${escapeHtml(book.title)}" class="book-cover" loading="lazy">`
                        : `<div class="placeholder-cover">No Cover</div>`
                    }
                </div>
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author)}</p>
                ${book.firstPublishYear ? `<span class="book-year">${book.firstPublishYear}</span>` : ''}
            `;

            card.addEventListener('click', () => openBookModal(book.id, book.title, book.author, coverUrl, book.firstPublishYear));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') openBookModal(book.id, book.title, book.author, coverUrl, book.firstPublishYear);
            });

            container.appendChild(card);
        });
    }

    // =============================================
    // Fetch Recommendations on Load
    // =============================================
    async function fetchRecommendations() {
        if (recommendationsGrid) {
            try {
                // Show a quick loader just in case
                recommendationsGrid.innerHTML = '<div class="loader"></div>';
                const response = await fetch('/api/books/recommendations');
                const data = await response.json();
                
                recommendationsGrid.innerHTML = ''; // clear loader
                if (response.ok) {
                    renderBooks(data.books, recommendationsGrid);
                } else {
                    recommendationsGrid.innerHTML = '<p class="error-message">Failed to load recommendations.</p>';
                }
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                recommendationsGrid.innerHTML = '<p class="error-message">Network error loading recommendations.</p>';
            }
        }
    }

    // =============================================
    // Book Detail Modal & Like Logic
    // =============================================
    async function openBookModal(bookId, title, author, coverUrl, firstPublishYear) {
        const id = bookId.replace('/works/', '');
        
        currentBookData = {
            bookId: id,
            title,
            author,
            coverId: coverUrl ? coverUrl.split('/').pop().split('-')[0] : null,
            firstPublishYear
        };

        // Reset & populate modal
        modalTitle.textContent   = title;
        modalAuthor.textContent  = author;
        modalDescription.innerHTML = '';
        modalLoader.classList.remove('hidden');

        // Setup Like Button State
        const token = localStorage.getItem('inkquest_token');
        if (token) {
            btnLikeBook.classList.remove('hidden');
            if (likedBooksSet.has(id)) {
                btnLikeBook.classList.add('liked');
            } else {
                btnLikeBook.classList.remove('liked');
            }
        } else {
            btnLikeBook.classList.add('hidden');
        }

        if (coverUrl) {
            modalCover.src = coverUrl;
            modalCover.alt = `Cover of ${title}`;
            modalCover.classList.remove('hidden');
            modalPlaceholder.classList.add('hidden');
        } else {
            modalCover.classList.add('hidden');
            modalPlaceholder.classList.remove('hidden');
        }

        bookModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`/api/books/${id}`);
            const data     = await response.json();

            if (response.ok && data.description) {
                let formattedDesc = data.description
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');
                
                // Convert URLs (http, https, www) into cool clickable links
                const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
                formattedDesc = formattedDesc.replace(urlRegex, (url) => {
                    const href = url.startsWith('http') ? url : `https://${url}`;
                    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cool-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Read / View Document
                    </a>`;
                });

                modalDescription.innerHTML = formattedDesc;
            } else {
                modalDescription.textContent = 'No introduction available for this book yet.';
            }
        } catch (err) {
            console.error('Book detail error:', err);
            modalDescription.textContent = 'Failed to load book details. Please try again.';
        } finally {
            modalLoader.classList.add('hidden');
        }
    }

    function closeBookModal() {
        bookModal.classList.add('hidden');
        document.body.style.overflow = '';
        currentBookData = null;
    }

    closeModal.addEventListener('click', closeBookModal);
    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeBookModal();
    });

    // Handle Like Button Click
    btnLikeBook.addEventListener('click', async () => {
        const token = localStorage.getItem('inkquest_token');
        if (!token || !currentBookData) return;

        const isLiked = likedBooksSet.has(currentBookData.bookId);
        const endpoint = isLiked ? '/api/users/unlike' : '/api/users/like';

        // Optimistic UI update
        if (isLiked) {
            btnLikeBook.classList.remove('liked');
            likedBooksSet.delete(currentBookData.bookId);
        } else {
            btnLikeBook.classList.add('liked');
            likedBooksSet.add(currentBookData.bookId);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentBookData)
            });

            if (!response.ok) {
                // Revert optimistic update on failure
                if (isLiked) {
                    btnLikeBook.classList.add('liked');
                    likedBooksSet.add(currentBookData.bookId);
                } else {
                    btnLikeBook.classList.remove('liked');
                    likedBooksSet.delete(currentBookData.bookId);
                }
                const data = await response.json();
                showMessage(data.error || 'Failed to update like status');
            }
        } catch (err) {
            console.error('Like toggle error:', err);
            // Revert on error
            if (isLiked) {
                btnLikeBook.classList.add('liked');
                likedBooksSet.add(currentBookData.bookId);
            } else {
                btnLikeBook.classList.remove('liked');
                likedBooksSet.delete(currentBookData.bookId);
            }
        }
    });

    // Close any modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBookModal();
            closeAuthModalFn();
        }
    });

    // =============================================
    // Utility Helpers
    // =============================================
    function showMessage(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    // Prevent XSS in dynamically inserted content
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // =============================================
    // Init
    // =============================================
    checkAuthState();
    if (document.getElementById('recommendations-section')) {
        fetchRecommendations();
    }
});
