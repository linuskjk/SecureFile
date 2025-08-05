document.getElementById('showRegisterBtn').onclick = function() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('registerSection').style.display = 'block';
};

document.getElementById('cancelRegisterBtn').onclick = function() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('registerSection').style.display = 'none';
  // Clear registration fields
  document.getElementById('regUsername').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('registerStatus').textContent = '';
};

document.getElementById('registerBtn').onclick = function() {
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const email = document.getElementById('regEmail').value;
  fetch('auth.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password, email, action: 'register'})
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('registerStatus').textContent = data.message || (data.success ? "Registered!" : "Failed");
    if (data.success) {
      // Clear registration fields
      document.getElementById('regUsername').value = '';
      document.getElementById('regPassword').value = '';
      document.getElementById('regEmail').value = '';
      setTimeout(() => {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('registerSection').style.display = 'none';
        document.getElementById('registerStatus').textContent = '';
      }, 1500);
    }
  });
};

let openBtnContainer = null; // Add this at the top of your script
let currentFolderPath = ""; // "" means root

function loadFileList(username) {
  fetch('get_files.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=' + encodeURIComponent(username)
  })
  .then(res => res.json())
  .then(userData => {
    // Find current folder
    function findFolder(root, path) {
      if (!path) return root;
      const parts = path.split('/').filter(Boolean);
      let current = root;
      for (const part of parts) {
        const found = (current.folders || []).find(f => f.name === part);
        if (!found) return null;
        current = found;
      }
      return current;
    }
    if (!userData.folders) userData.folders = [];
    if (!userData.files) userData.files = [];
    const folder = findFolder(userData, currentFolderPath) || userData;

    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    // Show "Up" button if not in root
    if (currentFolderPath) {
      const upLi = document.createElement('li');
      upLi.style.cursor = 'pointer';
      upLi.style.alignItems = 'center';
      upLi.style.display = 'flex';
      upLi.innerHTML = `
        <span style="font-size:1.2em;">⬆️</span>
        <b style="margin: 0 6px 0 4px;">..</b>
        <span style="color:#888;font-size:1em;">${'/' + currentFolderPath}</span>
      `;
      upLi.onclick = () => {
        currentFolderPath = currentFolderPath.split('/').slice(0, -1).join('/');
        loadFileList(username);
      };
      fileList.appendChild(upLi);
    }

    // Show folders
    (folder.folders || []).forEach(f => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';

      const folderIcon = document.createElement('span');
      folderIcon.innerHTML = '📁';
      folderIcon.style.fontSize = '1.3em';
      folderIcon.style.marginRight = '4px';

      const folderName = document.createElement('b');
      folderName.textContent = f.name;
      folderName.style.cursor = 'pointer';
      folderName.onclick = () => {
        currentFolderPath = (currentFolderPath ? currentFolderPath + '/' : '') + f.name;
        loadFileList(username);
      };

      // Rename button
      const renameBtn = document.createElement('button');
      renameBtn.innerHTML = '✏️';
      renameBtn.title = 'Rename folder';
      // Style: same size, centered vertically
      renameBtn.style.marginLeft = '8px';
      renameBtn.style.width = '32px';
      renameBtn.style.height = '32px';
      renameBtn.style.display = 'flex';
      renameBtn.style.alignItems = 'center';
      renameBtn.style.justifyContent = 'center';
      renameBtn.style.fontSize = '1.1em';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        const newName = prompt('Rename folder to:', f.name);
        if (newName && newName !== f.name) {
          fetch('rename_folder.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `username=${encodeURIComponent(username)}&old=${encodeURIComponent(f.name)}&new=${encodeURIComponent(newName)}&parent=${encodeURIComponent(currentFolderPath)}`
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) loadFileList(username);
            else alert(data.message || "Rename failed");
          });
        }
      };

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete folder';
      deleteBtn.style.marginLeft = '4px';
      deleteBtn.style.width = '32px';
      deleteBtn.style.height = '32px';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.fontSize = '1.1em';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete folder "${f.name}" and all its contents?`)) {
          fetch('delete_folder.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `username=${encodeURIComponent(username)}&folder=${encodeURIComponent(f.name)}&parent=${encodeURIComponent(currentFolderPath)}`
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) loadFileList(username);
            else alert(data.message || "Delete failed");
          });
        }
      };

      li.draggable = true;
      li.ondragstart = (e) => {
        e.dataTransfer.setData('type', 'folder');
        e.dataTransfer.setData('name', f.name);
        e.dataTransfer.setData('parent', currentFolderPath);
      };
      li.ondragover = (e) => e.preventDefault();
      li.ondrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const name = e.dataTransfer.getData('name');
        const fromParent = e.dataTransfer.getData('parent');
        if (type === 'folder') {
          moveFolder(username, name, fromParent, (currentFolderPath ? currentFolderPath + '/' : '') + f.name);
        } else if (type === 'file') {
          moveFile(username, name, fromParent, (currentFolderPath ? currentFolderPath + '/' : '') + f.name);
        }
      };

      li.appendChild(folderIcon);
      li.appendChild(folderName);
      li.appendChild(renameBtn);
      li.appendChild(deleteBtn);
      fileList.appendChild(li);
    });

    // Show files (your existing code, but use folder.files)
    (folder.files || []).forEach((file, idx) => {
      const origName = file.orig_name || file.name || file || "Unknown";
      const encName = file.enc_name || file.name || file || "Unknown";
      const size = (file.size && !isNaN(file.size)) ? (file.size/1024).toFixed(1) : "?";
      const uploaded = file.uploaded ? new Date(file.uploaded * 1000).toLocaleString() : "";

      const li = document.createElement('li');
      li.style.listStyle = 'none';

      const fileContainer = document.createElement('div');
      fileContainer.className = 'file-frame';
      fileContainer.style.cursor = 'pointer';

      const fileName = document.createElement('div');
      fileName.className = 'file-name';
      fileName.textContent = `${idx+1} ${origName} (${size} KB) ${uploaded ? '— ' + uploaded : ''}`;
      fileContainer.appendChild(fileName);

      const btnContainer = document.createElement('div');
      btnContainer.className = 'file-btns';
      btnContainer.style.display = 'none';

      // Download
      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '⬇️';
      downloadBtn.title = 'Download';
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&name=${encodeURIComponent(origName)}`;
      };
      btnContainer.appendChild(downloadBtn);

      // Preview
      const previewBtn = document.createElement('button');
      previewBtn.innerHTML = '👁️';
      previewBtn.title = 'Preview';
      previewBtn.onclick = (e) => {
        e.stopPropagation();
        previewFile(username, encName, origName);
      };
      btnContainer.appendChild(previewBtn);

      // Rename
      const renameBtn = document.createElement('button');
      renameBtn.innerHTML = '✏️';
      renameBtn.title = 'Rename';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        fileName.style.display = 'none';
        renameInput.style.display = 'block';
        renameInput.focus();
      };
      btnContainer.appendChild(renameBtn);

      // Rename input
      const renameInput = document.createElement('input');
      renameInput.type = 'text';
      renameInput.style.display = 'none';
      renameInput.value = origName;
      renameInput.onclick = (e) => e.stopPropagation();
      renameInput.onblur = renameInput.onkeydown = function(e) {
        if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
          if (renameInput.value && renameInput.value !== origName) {
            fetch('rename_file.php', {
              method: 'POST',
              headers: {'Content-Type': 'application/x-www-form-urlencoded'},
              body: `username=${encodeURIComponent(username)}&old=${encodeURIComponent(origName)}&new=${encodeURIComponent(renameInput.value)}`
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) loadFileList(username);
              else alert(data.message || "Rename failed");
            });
          } else {
            fileName.style.display = 'block';
            renameInput.style.display = 'none';
          }
        }
      };
      fileContainer.appendChild(renameInput);

      // Delete
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        fetch('delete_file.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&folder=${encodeURIComponent(currentFolderPath)}`
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            loadFileList(username); // <-- Make sure this is here!
          } else {
            alert(data.message || "Delete failed");
          }
        });
      };
      btnContainer.appendChild(deleteBtn);

      fileContainer.appendChild(fileName);
      fileContainer.appendChild(btnContainer);

      fileContainer.onclick = function(e) {
        e.stopPropagation();
        if (openBtnContainer && openBtnContainer !== btnContainer) {
          openBtnContainer.style.display = 'none';
        }
        btnContainer.style.display = btnContainer.style.display === 'none' ? 'flex' : 'none';
        openBtnContainer = btnContainer.style.display === 'flex' ? btnContainer : null;
        renameInput.style.display = 'none';
        fileName.style.display = 'block';
      };

      fileContainer.draggable = true;
      fileContainer.ondragstart = (e) => {
        e.dataTransfer.setData('type', 'file');
        e.dataTransfer.setData('name', origName);
        e.dataTransfer.setData('parent', currentFolderPath);
      };

      li.appendChild(fileContainer);
      fileList.appendChild(li);
    });
  });
}

// Re-sort when dropdown changes
document.getElementById('sortFiles').onchange = function() {
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  loadFileList(username);
};

// Attach filter and sort events
document.getElementById('sortFiles').onchange =
document.getElementById('filterFiles').oninput = function() {
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  loadFileList(username);
};

document.getElementById('loginBtn').onclick = function() {
  const username = document.getElementById('username').value;
  if (!username) return;
  // Request 2FA code
  fetch('send_2fa_code.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=' + encodeURIComponent(username)
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'ok') {
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('twofaSection').style.display = 'block';
      document.getElementById('twofaUsername').value = username;
      // Clear 2FA input field
      document.getElementById('twofaCode').value = '';
      document.getElementById('twofaStatus').textContent = '';
    } else {
      document.getElementById('loginStatus').textContent = data.error || "Failed to send 2FA code";
    }
  });
};

document.getElementById('verify2faBtn').onclick = function() {
  const username = document.getElementById('twofaUsername').value;
  const code = document.getElementById('twofaCode').value;
  const password = document.getElementById('password').value;
  fetch('verify_2fa.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, code, password})
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById('twofaSection').style.display = 'none';
      document.getElementById('uploadSection').style.display = 'block';
      loadFileList(username);
      // Clear 2FA and login fields
      document.getElementById('twofaCode').value = '';
      document.getElementById('twofaUsername').value = '';
      document.getElementById('password').value = '';
      document.getElementById('loginStatus').textContent = '';
      document.getElementById('twofaStatus').textContent = '';
    } else {
      document.getElementById('twofaStatus').textContent = data.message || "Invalid code or password";
    }
  });
};

document.getElementById('uploadBtn').onclick = function() {
  const files = document.getElementById('fileInput').files;
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  const progressContainer = document.getElementById('uploadProgressContainer');
  progressContainer.innerHTML = '';

  if (!files.length) return;

  Array.from(files).forEach(file => {
    // Create progress bar UI
    const wrapper = document.createElement('div');
    wrapper.style.margin = '8px 0';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';

    const label = document.createElement('span');
    label.textContent = file.name;
    label.style.flex = '1';

    const progress = document.createElement('progress');
    progress.max = 100;
    progress.value = 0;
    progress.style.width = '200px';
    progress.style.marginLeft = '12px';

    wrapper.appendChild(label);
    wrapper.appendChild(progress);
    progressContainer.appendChild(wrapper);

    // Upload with progress
    const formData = new FormData();
    formData.append('username', username);
    formData.append('file', file);
    formData.append('folder', currentFolderPath);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'upload.php', true);

    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        progress.value = (e.loaded / e.total) * 100;
      }
    };

    xhr.onload = function() {
      progress.value = 100;
      setTimeout(() => wrapper.remove(), 1000);
      if (xhr.status === 200) {
        document.getElementById('uploadStatus').textContent = 'Files uploaded!';
        loadFileList(username);
      } else {
        document.getElementById('uploadStatus').textContent = 'Upload failed: ' + xhr.responseText;
      }
    };

    xhr.onerror = function() {
      document.getElementById('uploadStatus').textContent = 'Upload failed: Network error';
    };

    xhr.send(formData);
  });
};

// Logout button functionality
document.getElementById('logoutBtn').onclick = function() {
  document.getElementById('uploadSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginStatus').textContent = '';
  document.getElementById('twofaCode').value = '';
  document.getElementById('twofaUsername').value = '';
  document.getElementById('twofaStatus').textContent = '';
};

document.getElementById('createFolderBtn').onclick = function() {
  const folderName = prompt("Folder name:");
  if (!folderName) return;
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  fetch('create_folder.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `username=${encodeURIComponent(username)}&folder=${encodeURIComponent(folderName)}&parent=${encodeURIComponent(currentFolderPath)}`
  })
  .then(res => res.json())
  .then (data => {
    if (data.success) loadFileList(username);
    else alert(data.message || "Failed to create folder");
  });
};

function previewFile(username, encName, origName) {
  if (!encName || typeof encName !== "string") return alert("No filename!");
  const ext = (origName.split('.').pop() || '').toLowerCase();
  if (['png','jpg','jpeg','gif','bmp','webp'].includes(ext)) {
    const img = document.createElement('img');
    img.src = `download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&preview=1`;
    img.style.maxWidth = '80vw';
    img.style.maxHeight = '70vh';
    showModal(img, true);
  } else if (['pdf'].includes(ext)) {
    const iframe = document.createElement('iframe');
    iframe.src = `download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&preview=1`;
    iframe.style.width = '80vw';
    iframe.style.height = '70vh';
    showModal(iframe, false);
  } else if (['mp3','wav','ogg'].includes(ext)) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = `download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&preview=1`;
    audio.style.width = '80vw';
    showModal(audio, false);
  } else if (['mp4','webm','ogg'].includes(ext)) {
    const video = document.createElement('video');
    video.controls = true;
    video.src = `download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&preview=1`;
    video.style.width = '80vw';
    video.style.maxHeight = '70vh';
    showModal(video, false);
  } else if (['txt','md','csv','log','json','js','css','html'].includes(ext)) {
    fetch(`download.php?username=${encodeURIComponent(username)}&file=${encodeURIComponent(encName)}&preview=1`)
      .then(res => res.text())
      .then(text => {
        const pre = document.createElement('pre');
        pre.textContent = text.substring(0, 5000);
        pre.style.maxWidth = '80vw';
        pre.style.maxHeight = '70vh';
        pre.style.overflow = 'auto';
        showModal(pre, false);
      });
  } else {
    alert("Preview not supported for this file type.");
  }
}

// Add this function to your script.js
function showModal(content, isImage) {
  let modal = document.getElementById('previewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'previewModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
  }
  modal.innerHTML = '';
  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '24px';
  box.style.borderRadius = '12px';
  box.style.maxWidth = '90vw';
  box.style.maxHeight = '90vh';
  box.style.overflow = 'auto';
  box.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
  box.onclick = e => e.stopPropagation();

  // Fullscreen button
  const fsBtn = document.createElement('button');
  fsBtn.innerHTML = '⛶';
  fsBtn.title = 'Fullscreen';
  fsBtn.style.position = 'absolute';
  fsBtn.style.top = '16px';
  fsBtn.style.right = '32px';
  fsBtn.style.fontSize = '2rem';
  fsBtn.style.background = 'none';
  fsBtn.style.border = 'none';
  fsBtn.style.cursor = 'pointer';
  fsBtn.onclick = (e) => {
    e.stopPropagation();
    if (box.requestFullscreen) box.requestFullscreen();
    else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
    else if (box.msRequestFullscreen) box.msRequestFullscreen();
  };
  box.style.position = 'relative';
  box.appendChild(fsBtn);

  box.appendChild(content);
  modal.appendChild(box);
}

function updateFolderPath() {
  const folderPathDiv = document.getElementById('folderPath');
  if (!folderPathDiv) return;
  if (!currentFolderPath) {
    folderPathDiv.innerHTML = `<span class="breadcrumb" data-path="">/</span>`;
    return;
  }
  const parts = currentFolderPath.split('/').filter(Boolean);
  let html = `<span class="breadcrumb" data-path="">/</span>`;
  let path = '';
  parts.forEach((part, idx) => {
    path += (path ? '/' : '') + part;
    html += `<span class="breadcrumb" data-path="${path}">${part}/</span>`;
  });
  folderPathDiv.innerHTML = html;

  // Add click handlers for breadcrumbs
  folderPathDiv.querySelectorAll('.breadcrumb').forEach(el => {
    el.onclick = function() {
      currentFolderPath = this.getAttribute('data-path');
      loadFileList(document.getElementById('username').value || document.getElementById('regUsername').value);
    };
    el.style.cursor = 'pointer';
    el.style.color = '#4286f4';
    el.style.fontWeight = 'bold';
    el.style.marginRight = '2px';
  });
}

fileList.ondragover = (e) => e.preventDefault();
fileList.ondrop = (e) => {
  const type = e.dataTransfer.getData('type');
  const name = e.dataTransfer.getData('name');
  const fromParent = e.dataTransfer.getData('parent');
  if (type === 'folder') {
    moveFolder(username, name, fromParent, currentFolderPath);
  } else if (type === 'file') {
    moveFile(username, name, fromParent, currentFolderPath);
  }
};

function moveFolder(username, name, from, to) {
  fetch('move_folder.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `username=${encodeURIComponent(username)}&name=${encodeURIComponent(name)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  })
  .then(res => res.json())
  .then (data => {
    if (data.success) loadFileList(username);
    else alert(data.message || "Move failed");
  });
}

function moveFile(username, name, from, to) {
  fetch('move_file.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `username=${encodeURIComponent(username)}&name=${encodeURIComponent(name)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) loadFileList(username);
    else alert(data.message || "Move failed");
  });
}

document.getElementById('settingsBtn').onclick = function() {
  // Load current email (optional: fetch from backend)
  document.getElementById('settingsModal').style.display = 'flex';
  document.getElementById('settingsStatus').textContent = '';
};

function updateEmail() {
  const email = document.getElementById('settingsEmail').value;
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  fetch('update_profile.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('settingsStatus').textContent = data.message || (data.success ? "Email updated!" : "Failed");
  });
}

function updatePassword() {
  const password = document.getElementById('settingsPassword').value;
  const username = document.getElementById('username').value || document.getElementById('regUsername').value;
  fetch('update_profile.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('settingsStatus').textContent = data.message || (data.success ? "Password updated!" : "Failed");
  });
}

function send2faSetup() {
  // You can implement a real 2FA setup flow here
  document.getElementById('settings2faStatus').textContent = "2FA setup instructions sent to your email (demo)";
}

// Dark mode toggle logic
document.getElementById('darkModeToggle').onchange = function() {
  if (this.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', '1');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', '0');
  }
};
// On load, restore dark mode
if (localStorage.getItem('darkMode') === '1') {
  document.body.classList.add('dark-mode');
  document.getElementById('darkModeToggle').checked = true;
}
