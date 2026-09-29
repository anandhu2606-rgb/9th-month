const initialSections = [
  {
    id: 'moments-1',
    type: 'photos',
    title: 'Little moments I keep close',
    photos: [
      { id: 'photo-1', src: 'WhatsApp Image 2026-09-29 at 12.24.57 PM.jpeg', caption: 'My favorite place is wherever you are.' },
      { id: 'photo-2', src: 'WhatsApp Image 2026-09-29 at 12.24.58 PM (1).jpeg', caption: 'A little moment, a lot of love.' }
    ]
  },
  {
    id: 'note-1',
    type: 'message',
    title: 'To my Sreee',
    text: 'Sreee, we will successfully complete our 9 months together. I love you, my girl! I love you so much. Thank you for being my girl. I will love you until my last breath. I am so proud and happy that I chose you. You are the most beautiful and correct choice I have ever made. I love you so much, and I am so lucky to have you as my life partner. Only you can complete me, girl :)'
  },
  {
    id: 'moments-2',
    type: 'photos',
    title: 'More pieces of us',
    photos: [
      { id: 'photo-3', src: 'WhatsApp Image 2026-09-29 at 12.24.58 PM.jpeg', caption: 'You make ordinary days feel golden.' },
      { id: 'photo-4', src: 'WhatsApp Image 2026-09-29 at 12.24.59 PM (1).jpeg', caption: 'Still smiling because it is you.' }
    ]
  },
  {
    id: 'note-2',
    type: 'message',
    title: 'Nine months, all my heart',
    text: 'Happy 9 months together! Every single day with you feels easier, brighter, and happier. I love you more than words can say.\n\nNine months, countless memories, endless smiles, and a million reasons why I choose you every day. Happy anniversary, my love!'
  },
  {
    id: 'moments-3',
    type: 'photos',
    title: 'The smiles I want to keep',
    photos: [
      { id: 'photo-5', src: 'WhatsApp Image 2026-09-29 at 12.24.59 PM.jpeg', caption: 'Every version of us is my favorite.' },
      { id: 'photo-6', src: 'WhatsApp Image 2026-09-29 at 12.25.00 PM (1).jpeg', caption: 'My heart is happiest beside yours.' }
    ]
  },
  {
    id: 'moments-4',
    type: 'photos',
    title: 'And a few more, just because',
    photos: [
      { id: 'photo-7', src: 'WhatsApp Image 2026-09-29 at 12.25.00 PM (2).jpeg', caption: 'Here is to all the memories still to come.' },
      { id: 'photo-8', src: 'WhatsApp Image 2026-09-29 at 12.25.00 PM.jpeg', caption: 'I choose you, today and every day.' }
    ]
  }
];

const story = document.querySelector('#story');
const editToggle = document.querySelector('#edit-toggle');
const editorTools = document.querySelector('#editor-tools');
const addSectionButton = document.querySelector('#add-section');
const picker = document.querySelector('#photo-picker');
const saveStatus = document.querySelector('#save-status');
const storageKey = 'nine-month-anniversary-state';
let state = { sections: initialSections };
let editing = false;
let pendingUpload = null;
let saveTimer;
let databasePromise;

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function photoUrl(src) {
  return src.startsWith('data:image/') ? src : encodeURI(src);
}

function getDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('nine-month-anniversary', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('page');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

async function readSavedState() {
  try {
    const database = await getDatabase();
    const saved = await new Promise((resolve, reject) => {
      const request = database.transaction('page', 'readonly').objectStore('page').get('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (saved?.sections) return saved;
  } catch (error) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.sections) return saved;
    } catch { /* Use the original page if saved data is unavailable. */ }
  }
  return { sections: structuredClone(initialSections) };
}

async function writeSavedState() {
  try {
    const database = await getDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('page', 'readwrite');
      transaction.objectStore('page').put(state, 'state');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch (error) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      saveStatus.textContent = 'Could not save changes';
      return;
    }
  }
  saveStatus.textContent = 'Saved on this device';
}

function queueSave() {
  saveStatus.textContent = 'Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeSavedState, 350);
}

function renderPhoto(photo, sectionId) {
  const photoMarkup = photo.src
    ? `<div class="photo-frame"><img src="${escapeHtml(photoUrl(photo.src))}" alt="A favorite anniversary memory" loading="lazy"></div>`
    : '<div class="empty-photo"><div><span>♡</span>Add a favorite photo</div></div>';
  return `<article class="photo-card" data-photo-id="${escapeHtml(photo.id)}">
    ${photoMarkup}
    <p class="photo-caption" data-editable data-field="caption" contenteditable="false">${escapeHtml(photo.caption)}</p>
    <div class="photo-actions">
      <button class="photo-action replace-photo" type="button" data-section-id="${escapeHtml(sectionId)}" data-photo-id="${escapeHtml(photo.id)}">Replace</button>
      <button class="photo-action remove-photo" type="button" data-section-id="${escapeHtml(sectionId)}" data-photo-id="${escapeHtml(photo.id)}">Remove</button>
    </div>
  </article>`;
}

function renderSection(section, index) {
  if (section.type === 'photos') {
    return `<section class="photo-section" data-section-id="${escapeHtml(section.id)}" aria-label="${escapeHtml(section.title)}">
      <div class="section-heading">
        <h2>${escapeHtml(section.title)}</h2>
        <button class="photo-add" type="button" data-add-photo="${escapeHtml(section.id)}">＋ Add Photo</button>
      </div>
      <div class="photo-grid">${section.photos.map(photo => renderPhoto(photo, section.id)).join('')}</div>
    </section>`;
  }

  return `<section class="message-section" data-section-id="${escapeHtml(section.id)}" aria-label="Love note ${index + 1}">
    <p class="message-kicker">with all my heart</p>
    <h2 class="message-title" data-editable data-field="title" contenteditable="false">${escapeHtml(section.title)}</h2>
    <div class="message-copy" data-editable data-field="text" contenteditable="false">${escapeHtml(section.text)}</div>
    <div class="message-heart" aria-hidden="true">♥</div>
    <div class="section-controls"><button class="remove-section" type="button" data-remove-section="${escapeHtml(section.id)}">Remove text section</button></div>
  </section>`;
}

function render() {
  story.innerHTML = state.sections.map(renderSection).join('');
  story.querySelectorAll('[data-editable]').forEach(element => {
    element.contentEditable = String(editing);
    element.spellcheck = editing;
  });
  document.body.classList.toggle('editing', editing);
  editToggle.textContent = editing ? 'Done Editing' : 'Edit Page';
  editToggle.setAttribute('aria-pressed', String(editing));
  editorTools.hidden = !editing;
}

function textFrom(element) {
  return (element.innerText || element.textContent || '').replace(/\r/g, '').trim();
}

function updateTextField(element) {
  const sectionId = element.closest('[data-section-id]')?.dataset.sectionId;
  const section = state.sections.find(item => item.id === sectionId);
  if (!section) return;
  const value = textFrom(element);
  if (element.dataset.field === 'caption') {
    const photo = section.photos?.find(item => item.id === element.closest('[data-photo-id]')?.dataset.photoId);
    if (photo) photo.caption = value;
  } else if (element.dataset.field === 'title') {
    section.title = value;
  } else if (element.dataset.field === 'text') {
    section.text = value;
  }
  queueSave();
}

function choosePhotos(sectionId, photoId = null) {
  pendingUpload = { sectionId, photoId };
  picker.multiple = !photoId;
  picker.value = '';
  picker.click();
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handlePhotos(files) {
  if (!pendingUpload || !files.length) return;
  const target = state.sections.find(item => item.id === pendingUpload.sectionId);
  if (!target || target.type !== 'photos') return;
  saveStatus.textContent = 'Adding photos…';
  try {
    const uploaded = await Promise.all([...files].filter(file => file.type.startsWith('image/')).map(fileAsDataUrl));
    if (pendingUpload.photoId) {
      const photo = target.photos.find(item => item.id === pendingUpload.photoId);
      if (photo && uploaded[0]) photo.src = uploaded[0];
    } else {
      uploaded.forEach((src, index) => target.photos.push({
        id: makeId('photo'),
        src,
        caption: `A little memory to keep close${uploaded.length > 1 ? ` ${index + 1}` : ''}.`
      }));
    }
    render();
    await writeSavedState();
  } catch {
    saveStatus.textContent = 'Could not add photos';
  }
  pendingUpload = null;
}

editToggle.addEventListener('click', () => {
  editing = !editing;
  render();
});

addSectionButton.addEventListener('click', () => {
  state.sections.push({ id: makeId('note'), type: 'message', title: 'A little note for you', text: 'Write your love note here.' });
  render();
  queueSave();
  story.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

story.addEventListener('input', event => {
  if (event.target.matches('[data-editable]')) updateTextField(event.target);
});

story.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add-photo]');
  if (addButton) {
    choosePhotos(addButton.dataset.addPhoto);
    return;
  }
  const replaceButton = event.target.closest('.replace-photo');
  if (replaceButton) {
    choosePhotos(replaceButton.dataset.sectionId, replaceButton.dataset.photoId);
    return;
  }
  const removePhotoButton = event.target.closest('.remove-photo');
  if (removePhotoButton) {
    const section = state.sections.find(item => item.id === removePhotoButton.dataset.sectionId);
    if (section) section.photos = section.photos.filter(photo => photo.id !== removePhotoButton.dataset.photoId);
    render();
    queueSave();
    return;
  }
  const removeSectionButton = event.target.closest('[data-remove-section]');
  if (removeSectionButton) {
    state.sections = state.sections.filter(section => section.id !== removeSectionButton.dataset.removeSection);
    render();
    queueSave();
  }
});

picker.addEventListener('change', event => handlePhotos(event.target.files));

readSavedState().then(saved => {
  state = saved;
  render();
}).catch(() => render());