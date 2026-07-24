/**
 * ============================================
 * GAS Backend Connector
 * ============================================
 * Frontend JavaScript to connect with Google Apps Script
 * Add this to your GitHub Pages
 */

// ============ CONFIGURATION ============
const GAS_CONFIG = {
  // Ganti dengan URL GAS Web App kamu setelah deploy
  URL: 'https://script.google.com/macros/s/AKfycbzwUibixvYbYGcUlMvA1T83gZNIDUMcWbPteUGW_nGlfIG9AZG0za-Xi--OUgyuGuYrWg/exec',
  
  // Atau gunakan JSONP untuk bypass CORS
  JSONP: true
};

// ============ API FUNCTIONS ============

/**
 * Fetch prompts from GAS backend
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
async function fetchPrompts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return gasRequest(`?action=getPrompts&${queryString}`);
}

/**
 * Get single prompt by ID
 * @param {string} id - Prompt ID
 * @returns {Promise<Object>}
 */
async function fetchPrompt(id) {
  return gasRequest(`?action=getPrompt&id=${id}`);
}

/**
 * Save new prompt
 * @param {Object} promptData - Prompt data
 * @returns {Promise<Object>}
 */
async function savePrompt(promptData) {
  return gasRequest('', {
    method: 'POST',
    body: JSON.stringify({
      action: 'savePrompt',
      ...promptData
    })
  });
}

/**
 * Like a prompt
 * @param {string} id - Prompt ID
 * @returns {Promise<Object>}
 */
async function likePrompt(id) {
  return gasRequest('', {
    method: 'POST',
    body: JSON.stringify({
      action: 'likePrompt',
      id: id
    })
  });
}

/**
 * Search prompts
 * @param {string} query - Search query
 * @returns {Promise<Object>}
 */
async function searchPrompts(query) {
  return gasRequest(`?action=search&q=${encodeURIComponent(query)}`);
}

/**
 * Get categories
 * @returns {Promise<Object>}
 */
async function fetchCategories() {
  return gasRequest(`?action=getCategories`);
}

/**
 * Get stats
 * @returns {Promise<Object>}
 */
async function fetchStats() {
  return gasRequest(`?action=getStats`);
}

/**
 * Get popular prompts
 * @param {number} limit - Number of results
 * @returns {Promise<Object>}
 */
async function fetchPopular(limit = 10) {
  return gasRequest(`?action=getPopular&limit=${limit}`);
}

/**
 * Track page visit
 * @param {Object} data - Visit data
 * @returns {Promise<Object>}
 */
async function trackVisit(data = {}) {
  return gasRequest('', {
    method: 'POST',
    body: JSON.stringify({
      action: 'trackVisit',
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      ...data
    })
  });
}

/**
 * Submit prompt for review
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>}
 */
async function submitPrompt(submissionData) {
  return gasRequest('', {
    method: 'POST',
    body: JSON.stringify({
      action: 'submitPrompt',
      ...submissionData
    })
  });
}

// ============ CORE REQUEST FUNCTION ============

/**
 * Make request to GAS backend
 * @param {string} endpoint - Query string or empty for POST
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
async function gasRequest(endpoint = '', options = {}) {
  const url = `${GAS_CONFIG.URL}${endpoint}`;
  
  // JSONP method (bypass CORS)
  if (GAS_CONFIG.JSONP && !options.method) {
    return jsonpRequest(url);
  }
  
  // Regular fetch
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('GAS Request Error:', error);
    throw error;
  }
}

/**
 * JSONP request (bypass CORS)
 * @param {string} url - Request URL
 * @returns {Promise<Object>}
 */
function jsonpRequest(url) {
  return new Promise((resolve, reject) => {
    const callbackName = 'gasCallback_' + Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const scriptUrl = `${url}${separator}callback=${callbackName}`;
    
    // Create callback function
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      document.body.removeChild(script);
    };
    
    // Create script element
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onerror = function() {
      reject(new Error('JSONP request failed'));
      delete window[callbackName];
      document.body.removeChild(script);
    };
    
    document.body.appendChild(script);
  });
}

// ============ UI HELPERS ============

/**
 * Render prompts to container
 * @param {Array} prompts - Array of prompt objects
 * @param {HTMLElement} container - Target container
 */
function renderPrompts(prompts, container) {
  container.innerHTML = prompts.map(prompt => `
    <div class="prompt-card" data-id="${prompt.id}">
      <h3>${escapeHtml(prompt.title)}</h3>
      <p class="category">${escapeHtml(prompt.category)}</p>
      <div class="prompt-text">${escapeHtml(prompt.prompt)}</div>
      <div class="meta">
        <span class="likes">❤️ ${prompt.likes || 0}</span>
        <span class="author">by ${escapeHtml(prompt.author)}</span>
      </div>
      <button onclick="copyPrompt('${escapeHtml(prompt.prompt)}')" class="btn-copy">
        Copy Prompt
      </button>
      <button onclick="handleLike('${prompt.id}')" class="btn-like">
        Like
      </button>
    </div>
  `).join('');
}

/**
 * Copy prompt to clipboard
 * @param {string} text - Text to copy
 */
async function copyPrompt(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Prompt copied!');
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Prompt copied!');
  }
}

/**
 * Handle like button click
 * @param {string} id - Prompt ID
 */
async function handleLike(id) {
  try {
    const result = await likePrompt(id);
    if (result.success) {
      // Update UI
      const card = document.querySelector(`[data-id="${id}"]`);
      if (card) {
        const likesSpan = card.querySelector('.likes');
        likesSpan.textContent = `❤️ ${result.data.likes}`;
      }
      showToast('Liked!');
    }
  } catch (err) {
    showToast('Failed to like', 'error');
  }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success/error)
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'error' ? '#ff4444' : '#44ff44'};
    color: ${type === 'error' ? 'white' : 'black'};
    border-radius: 8px;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - Input string
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============ INITIALIZATION ============

/**
 * Initialize GAS connection
 * Call this when page loads
 */
async function initGAS() {
  // Track initial visit
  await trackVisit();
  
  console.log('GAS Backend connected:', GAS_CONFIG.URL);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGAS);
} else {
  initGAS();
}
