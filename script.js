const STORAGE_KEY = 'anniversary-page-v1';
const originalData = {
  heading: 'HAPPY 9TH ANNIVERSARY',
  messageOne: 'Sreee, we’ve successfully completed 9 months together! I love you, my gurlll. I love you so much. Thank you for being my gurlll. I’ll love you until my last breath. I’m so proud and happy to love you. You’re the most beautiful and right choice I’ve ever made. I love you so much, and I’m so lucky to have you as my life partner. Only you can complete me, gullll :)',
  messageTwo: 'Happy 9 months together! Every single day with you feels easier, brighter, and happier. I love you more than words can say.\n\nThese nine months brought countless memories, endless smiles, and a million reasons why I choose you every day. Happy anniversary, my love!',
  photos: []
};
const $ = (id) => document.getElementById(id);
let data = loadData();
function loadData() { try { return { ...originalData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return structuredClone(originalData); } }
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function render() {
  $('headingDisplay').innerHTML = escapeHtml(data.heading).replace(/\n/g, '<br>');
  $('messageOneDisplay').innerHTML = escapeHtml(data.messageOne).replace(/\n/g, '<br>');
  $('messageTwoDisplay').innerHTML = escapeHtml(data.messageTwo).replace(/\n/g, '<br>');
  renderGalleries(); renderEditorPhotos();
  $('headingInput').value = data.heading; $('messageOneInput').value = data.messageOne; $('messageTwoInput').value = data.messageTwo;
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function renderGalleries() {
  const first = $('galleryOne'); const second = $('galleryTwo'); first.innerHTML = ''; second.innerHTML = '';
  const photos = data.photos || [];
  const show = (photo, index, target) => { const card = document.getElementById('photoCardTemplate').content.cloneNode(true); const article = card.querySelector('.photo-card'); article.querySelector('img').src = photo.src; article.querySelector('img').alt = photo.caption || 'Anniversary memory'; article.querySelector('.caption').textContent = photo.caption || ''; article.querySelector('.remove-photo').remove(); target.appendChild(card); };
  photos.slice(0, 3).forEach((photo, index) => show(photo, index, first)); photos.slice(3, 6).forEach((photo, index) => show(photo, index + 3, second));
  if (!photos.length) { [first, second].forEach((target) => { for (let index = 0; index < 3; index += 1) { const card = document.getElementById('photoCardTemplate').content.cloneNode(true); card.querySelector('.photo-card').classList.add('placeholder'); card.querySelector('.photo-frame img').remove(); card.querySelector('.remove-photo').remove(); card.querySelector('.caption').textContent = 'Your memory will live here'; target.appendChild(card); } }); }
}
function renderEditorPhotos() {
  const list = $('editorPhotoList'); list.innerHTML = '';
  (data.photos || []).forEach((photo, index) => { const row = document.createElement('div'); row.className = 'editor-photo-row'; row.innerHTML = `<img src="${photo.src}" alt=""><input class="caption-input" value="${escapeHtml(photo.caption || '')}" placeholder="Add a short caption"><button class="remove-editor-photo" type="button" aria-label="Remove photo">×</button>`; row.querySelector('.caption-input').addEventListener('input', (event) => { data.photos[index].caption = event.target.value; saveData(); renderGalleries(); }); row.querySelector('.remove-editor-photo').addEventListener('click', () => { data.photos.splice(index, 1); saveData(); render(); }); list.appendChild(row); });
  if (!data.photos.length) list.innerHTML = '<p class="field-help">No photos yet. Add some memories above.</p>';
}
function openEditor() { $('editorPanel').classList.add('open'); $('editorPanel').setAttribute('aria-hidden', 'false'); $('editToggle').setAttribute('aria-pressed', 'true'); $('editToggleLabel').textContent = 'Close editor'; }
function closeEditor() { $('editorPanel').classList.remove('open'); $('editorPanel').setAttribute('aria-hidden', 'true'); $('editToggle').setAttribute('aria-pressed', 'false'); $('editToggleLabel').textContent = 'Edit page'; }
$('editToggle').addEventListener('click', () => $('editorPanel').classList.contains('open') ? closeEditor() : openEditor()); $('closeEditor').addEventListener('click', closeEditor); $('editorBackdrop').addEventListener('click', closeEditor);
[['headingInput', 'heading'], ['messageOneInput', 'messageOne'], ['messageTwoInput', 'messageTwo']].forEach(([inputId, key]) => $(inputId).addEventListener('input', (event) => { data[key] = event.target.value; saveData(); render(); $(inputId).focus(); }));
$('photoInput').addEventListener('change', (event) => { Array.from(event.target.files).forEach((file) => { const reader = new FileReader(); reader.addEventListener('load', () => { data.photos.push({ src: reader.result, caption: '' }); saveData(); render(); }); reader.readAsDataURL(file); }); event.target.value = ''; });
$('resetButton').addEventListener('click', () => { if (confirm('Reset all text and remove all saved photos?')) { data = structuredClone(originalData); saveData(); render(); } });
render();
