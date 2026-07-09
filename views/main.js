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

    // Book detail modal elements
    const bookModal        = document.getElementById('book-modal');
    const closeModal       = document.getElementById('close-modal');
    const modalTitle       = document.getElementById('modal-title');
    const modalAuthor      = document.getElementById('modal-author');
    const modalCover       = document.getElementById('modal-cover');
    const modalPlaceholder = document.getElementById('modal-cover-placeholder');
    const modalDescription = document.getElementById('modal-description');
    const modalLoader      = document.getElementById('modal-loader');

    let currentAuthAction = 'login'; // 'login' | 'signup'

    // =============================================
    // Auth State — Update Navbar
    // =============================================
    function checkAuthState() {
        const token    = localStorage.getItem('inkquest_token');
        const username = localStorage.getItem('inkquest_username');

        if (token && username) {
            navActions.innerHTML = `
                <span class="user-greeting">Hi, <strong>${username}</strong></span>
                <a href="/dashboard" class="btn-outline">Dashboard</a>
                <button type="button" id="btn-logout" class="btn-primary">Logout</button>
            `;
            document.getElementById('btn-logout').addEventListener('click', handleLogout);
        } else {
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
        usernameInput.value = '';
        passwordInput.value = '';
        authModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        usernameInput.focus();
    }

    function closeAuthModalFn() {
        authModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function handleLogout() {
        localStorage.removeItem('inkquest_token');
        localStorage.removeItem('inkquest_username');
        bookGrid.innerHTML = '';
        checkAuthState();
        showMessage('You have been logged out successfully.');
    }

    // =============================================
    // Auth Form Submit (Login / Signup)
    // =============================================
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) return;

        authSubmitBtn.disabled    = true;
        authSubmitBtn.textContent = 'Please wait...';
        authError.classList.add('hidden');

        try {
            const url      = currentAuthAction === 'login' ? '/api/auth/login' : '/api/auth/signup';
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('inkquest_token',    data.token);
                localStorage.setItem('inkquest_username', data.username);
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
    function renderBooks(books) {
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

            card.addEventListener('click', () => openBookModal(book.id, book.title, book.author, coverUrl));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') openBookModal(book.id, book.title, book.author, coverUrl);
            });

            bookGrid.appendChild(card);
        });
    }

    // =============================================
    // Book Detail Modal
    // =============================================
    async function openBookModal(bookId, title, author, coverUrl) {
        const id = bookId.replace('/works/', '');

        // Reset & populate modal
        modalTitle.textContent   = title;
        modalAuthor.textContent  = author;
        modalDescription.innerHTML = '';
        modalLoader.classList.remove('hidden');

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
                modalDescription.innerHTML = data.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
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
    }

    closeModal.addEventListener('click', closeBookModal);
    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeBookModal();
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
});
