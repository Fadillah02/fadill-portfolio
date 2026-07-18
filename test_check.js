const fs = require('fs');
const base = 'C:/Users/kyrug/OneDrive/Pictures/fadil/fadill-portfolio/';

// Test Poster-fitur
const html1 = fs.readFileSync(base + 'Poster-fitur.html', 'utf8');
console.log('=== Poster-fitur.html ===');
console.log('Has loading.gif:', html1.includes('loading.gif'));
console.log('Has download.gif:', html1.includes('download.gif'));
console.log('Has font-src CSP:', html1.includes('font-src'));
console.log('Has e.currentTarget in filter:', html1.includes('e.currentTarget'));
console.log('Has copyText null guard:', html1.includes('if (!el)'));
console.log('Has applyFilters init:', html1.includes('applyFilters()'));
console.log('Orientation bar show on init:', html1.includes('orientationBar.classList.add'));
console.log('StatsCount fix:', html1.includes('countSpan') && html1.includes('querySelector'));
console.log('Filter count 961:', html1.includes('filter-count">961'));
console.log('Hyper Realistic count 50:', html1.includes('Hyper Realistic') && html1.includes('filter-count">50'));

// Test posterData
const s1 = html1.indexOf('const posterData = [');
const e1 = html1.indexOf('];', s1) + 2;
eval(html1.slice(s1, e1).replace('const posterData', 'var posterData'));
console.log('Total entries:', posterData.length);
console.log('Hyper Realistic:', posterData.filter(i => i.collection === 'Hyper Realistic').length);
console.log('Photo Restore:', posterData.filter(i => i.collection === 'Photo Restore').length);
console.log('Family Add:', posterData.filter(i => i.collection === 'Family Add').length);
console.log('Missing suitableFor:', posterData.filter(i => !Array.isArray(i.suitableFor) || i.suitableFor.length === 0).length);

// Test lyric.html
const html2 = fs.readFileSync(base + 'lyric.html', 'utf8');
console.log('\n=== lyric.html ===');
console.log('Has loading.gif:', html2.includes('loading.gif'));
console.log('Has font-src CSP:', html2.includes('font-src'));
console.log('Has e.currentTarget in filter:', html2.includes('e.currentTarget'));
console.log('Has copyText null guard:', html2.includes('if (!el)'));
console.log('Has applyFilters init:', html2.includes('applyFilters()'));
console.log('Orientation bar show on init:', html2.includes('orientationBar.classList.add'));
console.log('StatsCount fix:', html2.includes('countSpan') && html2.includes('querySelector'));

// Test lyricData
const s2 = html2.indexOf('const lyricData = [');
const e2 = html2.indexOf('];', s2) + 2;
eval(html2.slice(s2, e2).replace('const lyricData', 'var lyricData'));
console.log('Total entries:', lyricData.length);

// Test video.html
const html3 = fs.readFileSync(base + 'video.html', 'utf8');
console.log('\n=== video.html ===');
console.log('Has loading.gif:', html3.includes('loading.gif'));
console.log('Has font-src CSP:', html3.includes('font-src'));
console.log('Has e.currentTarget in filter:', html3.includes('e.currentTarget'));
console.log('Has copyText null guard:', html3.includes('if (!el)'));
console.log('Has applyFilters init:', html3.includes('applyFilters()'));
console.log('Orientation bar show on init:', html3.includes('orientationBar.classList.add'));
console.log('StatsCount fix:', html3.includes('countSpan') && html3.includes('querySelector'));

// Test videoData
const s3 = html3.indexOf('const videoData = [');
const e3 = html3.indexOf('];', s3) + 2;
eval(html3.slice(s3, e3).replace('const videoData', 'var videoData'));
console.log('Total entries:', videoData.length);