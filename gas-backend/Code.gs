/**
 * ============================================
 * AI Prompt Generator - GAS Backend
 * ============================================
 * Deploy as Web App - Anyone can access
 * Connected to Google Sheets as database
 */

// ============ CONFIGURATION ============
const CONFIG = {
  SHEET_ID: '1S-0yNYn1NqaeBnwddX1WV_BizMASMlNkKpDU776iUHc',
  SHEET_NAME: 'Prompts',
  STATS_SHEET: 'Stats',
  ALLOWED_ORIGINS: ['https://fadillah02.github.io', 'http://localhost:3000']
};

// ============ MAIN ENTRY POINT ============
function doGet(e) {
  const action = e.parameter.action || 'getPrompts';
  const callback = e.parameter.callback; // JSONP support
  
  let response;
  
  try {
    switch(action) {
      case 'getPrompts':
        response = getPrompts(e.parameter);
        break;
      case 'getPrompt':
        response = getPrompt(e.parameter.id);
        break;
      case 'getCategories':
        response = getCategories();
        break;
      case 'getStats':
        response = getStats();
        break;
      case 'search':
        response = searchPrompts(e.parameter.q);
        break;
      case 'getPopular':
        response = getPopularPrompts(e.parameter.limit || 10);
        break;
      default:
        response = { success: false, error: 'Invalid action' };
    }
  } catch (err) {
    response = { success: false, error: err.message };
  }
  
  return jsonResponse(response, callback);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  
  let response;
  
  try {
    switch(action) {
      case 'savePrompt':
        response = savePrompt(body);
        break;
      case 'likePrompt':
        response = likePrompt(body.id);
        break;
      case 'trackVisit':
        response = trackVisit(body);
        break;
      case 'submitPrompt':
        response = submitPrompt(body);
        break;
      case 'saveHookAnalysis':
        response = saveHookAnalysis(body);
        break;
      case 'saveRepurpose':
        response = saveRepurpose(body);
        break;
       case 'saveThumbnailAnalysis':
         response = saveThumbnailAnalysis(body);
         break;
       case 'saveVoiceHistory':
         response = saveVoiceHistory(body);
         break;
       default:
        response = { success: false, error: 'Invalid action' };
    }
  } catch (err) {
    response = { success: false, error: err.message };
  }
  
  return jsonResponse(response);
}

// ============ PROMPT OPERATIONS ============
function getPrompts(params) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  let prompts = data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  // Filter by category
  if (params.category) {
    prompts = prompts.filter(p => p.category === params.category);
  }
  
  // Filter by orientation
  if (params.orientation) {
    prompts = prompts.filter(p => p.orientation === params.orientation);
  }
  
  // Sort
  const sortBy = params.sortBy || 'date';
  const sortDir = params.sortDir === 'asc' ? 1 : -1;
  
  prompts.sort((a, b) => {
    if (sortBy === 'likes') return (b.likes - a.likes) * sortDir;
    if (sortBy === 'title') return a.title.localeCompare(b.title) * sortDir;
    return (new Date(b.date) - new Date(a.date)) * sortDir;
  });
  
  // Pagination
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;
  const start = (page - 1) * limit;
  const paginatedPrompts = prompts.slice(start, start + limit);
  
  return {
    success: true,
    data: paginatedPrompts,
    total: prompts.length,
    page: page,
    totalPages: Math.ceil(prompts.length / limit)
  };
}

function getPrompt(id) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const prompt = data.find(row => row[0] == id);
  
  if (!prompt) {
    return { success: false, error: 'Prompt not found' };
  }
  
  const obj = {};
  headers.forEach((header, i) => obj[header] = prompt[i]);
  
  return { success: true, data: obj };
}

function savePrompt(params) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  
  const newId = Utilities.getUuid();
  const newRow = [
    newId,
    params.title || 'Untitled',
    params.prompt || '',
    params.negativePrompt || '',
    params.category || 'General',
    params.orientation || 'landscape',
    params.style || '',
    params.tags ? params.tags.join(',') : '',
    params.author || 'Anonymous',
    0, // likes
    new Date(),
    new Date()
  ];
  
  sheet.appendRow(newRow);
  
  return {
    success: true,
    data: { id: newId },
    message: 'Prompt saved successfully'
  };
}

function likePrompt(id) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const rowIndex = data.findIndex(row => row[0] == id);
  
  if (rowIndex === -1) {
    return { success: false, error: 'Prompt not found' };
  }
  
  const likesCol = headers.indexOf('likes');
  const currentLikes = data[rowIndex][likesCol];
  
  sheet.getRange(rowIndex + 2, likesCol + 1).setValue(currentLikes + 1);
  
  return {
    success: true,
    data: { likes: currentLikes + 1 }
  };
}

// ============ CATEGORY OPERATIONS ============
function getCategories() {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const categoryCol = headers.indexOf('category');
  const categories = [...new Set(data.map(row => row[categoryCol]))].filter(Boolean);
  
  // Count per category
  const categoryCounts = {};
  categories.forEach(cat => {
    categoryCounts[cat] = data.filter(row => row[categoryCol] === cat).length;
  });
  
  return {
    success: true,
    data: categories.map(cat => ({
      name: cat,
      count: categoryCounts[cat]
    }))
  };
}

// ============ SEARCH ============
function searchPrompts(query) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const lowerQuery = query.toLowerCase();
  
  const results = data.filter(row => {
    return row.some(cell => 
      String(cell).toLowerCase().includes(lowerQuery)
    );
  }).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  return {
    success: true,
    data: results,
    query: query,
    total: results.length
  };
}

// ============ STATS ============
function getStats() {
  const promptSheet = getSheet(CONFIG.SHEET_NAME);
  const promptData = promptSheet.getDataRange().getValues();
  const promptHeaders = promptData.shift();

  const categoryCol = promptHeaders.indexOf('category');
  const likesCol = promptHeaders.indexOf('likes');
  const dateCol = promptHeaders.indexOf('date');

  const totalPrompts = promptData.length;
  const totalLikes = promptData.reduce((sum, row) => sum + (row[likesCol] || 0), 0);
  const categories = [...new Set(promptData.map(row => row[categoryCol]))].length;

  // Prompts this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekPrompts = promptData.filter(row => new Date(row[dateCol]) > oneWeekAgo).length;

  // Top category
  const categoryCounts = {};
  promptData.forEach(row => {
    const cat = row[categoryCol];
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  // Stats sheet (visits)
  const statsSheet = getSheet(CONFIG.STATS_SHEET);
  const statsData = statsSheet.getDataRange().getValues();
  const statsHeaders = statsData.shift();
  const totalVisits = statsData.length;
  const oneWeekAgoTimestamp = oneWeekAgo.getTime();
  const thisWeekVisits = statsData.filter(row => new Date(row[0]).getTime() > oneWeekAgoTimestamp).length;

  // Submissions
  let totalSubmissions = 0;
  try {
    const subSheet = getSheet('Submissions');
    const subData = subSheet.getDataRange().getValues();
    subData.shift();
    totalSubmissions = subData.length;
  } catch (e) {}

  // Hook Analyses
  let totalHookAnalyses = 0;
  try {
    const hookSheet = getSheet('HookAnalyses');
    const hookData = hookSheet.getDataRange().getValues();
    hookData.shift();
    totalHookAnalyses = hookData.length;
  } catch (e) {}

  // Repurposed Content
  let totalRepurposed = 0;
  try {
    const repoSheet = getSheet('RepurposedContent');
    const repoData = repoSheet.getDataRange().getValues();
    repoData.shift();
    totalRepurposed = repoData.length;
  } catch (e) {}

  // Thumbnail Analyses
  let totalThumbnails = 0;
  try {
    const thumbSheet = getSheet('ThumbnailAnalyses');
    const thumbData = thumbSheet.getDataRange().getValues();
    thumbData.shift();
    totalThumbnails = thumbData.length;
  } catch (e) {}

  // Voice History
  let totalVoiceHistory = 0;
  try {
    const voiceSheet = getSheet('VoiceHistory');
    const voiceData = voiceSheet.getDataRange().getValues();
    voiceData.shift();
    totalVoiceHistory = voiceData.length;
  } catch (e) {}

  return {
    success: true,
    data: {
      totalPrompts,
      totalLikes,
      categories,
      thisWeekPrompts: thisWeekPrompts,
      topCategory: topCategory ? topCategory[0] : 'N/A',
      topCategoryCount: topCategory ? topCategory[1] : 0,
      totalVisits,
      thisWeekVisits,
      totalSubmissions,
      totalHookAnalyses,
      totalRepurposed,
      totalThumbnails,
      totalVoiceHistory
    }
  };
}

function getPopularPrompts(limit) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const likesCol = headers.indexOf('likes');
  
  const prompts = data
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => obj[header] = row[i]);
      return obj;
    })
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, parseInt(limit) || 10);
  
  return {
    success: true,
    data: prompts
  };
}

// ============ VISITOR TRACKING ============
function trackVisit(data) {
  const sheet = getSheet(CONFIG.STATS_SHEET);
  
  sheet.appendRow([
    new Date(),
    data.page || 'unknown',
    data.referrer || 'direct',
    data.userAgent || '',
    data.screenSize || ''
  ]);
  
  return { success: true };
}

// ============ USER SUBMISSION ============
function submitPrompt(data) {
  const sheet = getSheet('Submissions');
  
  sheet.appendRow([
    Utilities.getUuid(),
    data.title,
    data.prompt,
    data.category || 'General',
    data.authorName || 'Anonymous',
    data.authorEmail || '',
    new Date(),
    'pending' // status: pending, approved, rejected
  ]);
  
  // Send notification email
  const adminEmail = Session.getActiveUser().getEmail();
  if (adminEmail) {
    MailApp.sendEmail({
      to: adminEmail,
      subject: 'New Prompt Submission',
      body: 'Title: ' + data.title + '\nAuthor: ' + data.authorName + '\n\nPrompt:\n' + data.prompt
    });
  }
  
  return {
    success: true,
    message: 'Prompt submitted for review'
  };
}

// ============ HOOK ANALYSIS ============
function saveHookAnalysis(data) {
  const sheet = getSheet('HookAnalyses');
  
  sheet.appendRow([
    Utilities.getUuid(),
    data.hook || '',
    data.platform || 'youtube',
    data.score || 0,
    data.strengths ? data.strengths.join(', ') : '',
    data.weaknesses ? data.weaknesses.join(', ') : '',
    new Date()
  ]);
  
  return { success: true };
}

// ============ CONTENT REPURPOSE ============
function saveRepurpose(data) {
  const sheet = getSheet('RepurposedContent');
  
  sheet.appendRow([
    Utilities.getUuid(),
    data.originalContent || '',
    data.platform || '',
    data.repuposedContent || '',
    new Date()
  ]);
  
  return { success: true };
}

// ============ THUMBNAIL ANALYSIS ============
function saveThumbnailAnalysis(data) {
  const sheet = getSheet('ThumbnailAnalyses');
  
  sheet.appendRow([
    Utilities.getUuid(),
    data.thumbnailUrl || '',
    data.platform || 'youtube',
    data.score || 0,
    data.feedback ? data.feedback.join(', ') : '',
    new Date()
  ]);
  
  return { success: true };
}

// ============ VOICE HISTORY ============
function saveVoiceHistory(data) {
  const sheet = getSheet('VoiceHistory');
  
  sheet.appendRow([
    Utilities.getUuid(),
    data.type || '',
    data.title || '',
    data.meta || '',
    new Date()
  ]);
  
  return { success: true };
}

// ============ HELPER FUNCTIONS ============
function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(name);
  
  // Create sheet if not exists
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initializeSheet(sheet, name);
  }
  
  return sheet;
}

function initializeSheet(sheet, name) {
  if (name === CONFIG.SHEET_NAME) {
    sheet.appendRow([
      'id', 'title', 'prompt', 'negativePrompt', 'category',
      'orientation', 'style', 'tags', 'author', 'likes',
      'dateCreated', 'dateUpdated'
    ]);
  } else if (name === CONFIG.STATS_SHEET) {
    sheet.appendRow([
      'timestamp', 'page', 'referrer', 'userAgent', 'screenSize'
    ]);
  } else if (name === 'Submissions') {
    sheet.appendRow([
      'id', 'title', 'prompt', 'category', 'authorName',
      'authorEmail', 'dateSubmitted', 'status'
    ]);
  } else if (name === 'HookAnalyses') {
    sheet.appendRow([
      'id', 'hook', 'platform', 'score', 'strengths',
      'weaknesses', 'dateAnalyzed'
    ]);
  } else if (name === 'RepurposedContent') {
    sheet.appendRow([
      'id', 'originalContent', 'platform', 'repurposedContent',
      'dateCreated'
    ]);
  } else if (name === 'ThumbnailAnalyses') {
    sheet.appendRow([
      'id', 'thumbnailUrl', 'platform', 'score', 'feedback',
      'dateAnalyzed'
    ]);
  } else if (name === 'VoiceHistory') {
    sheet.appendRow([
      'id', 'type', 'title', 'meta',
      'dateCreated'
    ]);
  }
}

function jsonResponse(data, callback) {
  const output = ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);
  
  // JSONP support
  if (callback) {
    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify(data) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return output;
}
