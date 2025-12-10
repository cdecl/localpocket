document.addEventListener('DOMContentLoaded', () => {
	const saveBtn = document.getElementById('saveBtn');
	const clearBtn = document.getElementById('clearBtn');
	const urlList = document.getElementById('urlList');

	// Load saved URLs on startup
	loadUrls();

	// Save current tab
	saveBtn.addEventListener('click', async () => {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		if (tab && tab.url) {
			const newItem = {
				url: tab.url,
				title: tab.title || tab.url,
				timestamp: new Date().toISOString()
			};

			chrome.storage.local.get(['savedUrls'], (result) => {
				const savedUrls = result.savedUrls || [];
				// Check in reverse to see if already exists at the top, or just simply add. 
				// Let's add safely.
				savedUrls.unshift(newItem);

				chrome.storage.local.set({ savedUrls }, () => {
					loadUrls();
				});
			});
		}
	});

	// Clear all
	clearBtn.addEventListener('click', () => {
		if (confirm('Are you sure you want to clear all saved URLs?')) {
			chrome.storage.local.set({ savedUrls: [] }, () => {
				loadUrls();
			});
		}
	});

	function loadUrls() {
		chrome.storage.local.get(['savedUrls'], (result) => {
			const savedUrls = result.savedUrls || [];
			renderList(savedUrls);
		});
	}

	function renderList(items) {
		urlList.innerHTML = '';

		if (items.length === 0) {
			urlList.innerHTML = '<div class="empty-state">No URLs saved yet.</div>';
			return;
		}

		items.forEach((item, index) => {
			const li = document.createElement('li');

			const title = document.createElement('div');
			title.className = 'title';
			title.textContent = item.title;
			title.title = 'Click to edit';
			title.onclick = (e) => {
				e.preventDefault(); // Prevent accidental navigation if nested
				makeEditable(title, index, item.title);
			};

			const link = document.createElement('a');
			link.className = 'url';
			link.href = item.url;
			link.textContent = item.url;
			link.target = '_blank'; // Open in new tab

			const time = document.createElement('div');
			time.className = 'timestamp';
			time.textContent = new Date(item.timestamp).toLocaleString();

			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'delete-btn';
			deleteBtn.innerHTML = '&times;'; // HTML entity for multiplication sign (X)
			deleteBtn.title = 'Delete this item';
			deleteBtn.onclick = (e) => {
				e.stopPropagation(); // Prevent clicking other things
				deleteItem(index);
			};

			li.appendChild(title);
			li.appendChild(link);
			li.appendChild(time);
			li.appendChild(deleteBtn);

			urlList.appendChild(li);
		});
	}

	function makeEditable(element, index, currentTitle) {
		const input = document.createElement('input');
		input.type = 'text';
		input.value = currentTitle;
		input.className = 'title-input';

		// Save on Enter, Cancel on Escape
		input.onkeydown = (e) => {
			if (e.key === 'Enter') {
				saveTitle(index, input.value);
			} else if (e.key === 'Escape') {
				element.textContent = currentTitle; // Revert
				renderList(getCurrentItems()); // Or just re-render to be safe
			}
		};

		// Save on Blur
		input.onblur = () => {
			saveTitle(index, input.value);
		};

		element.innerHTML = '';
		element.appendChild(input);
		input.focus();
	}

	function saveTitle(index, newTitle) {
		chrome.storage.local.get(['savedUrls'], (result) => {
			let savedUrls = result.savedUrls || [];
			if (index >= 0 && index < savedUrls.length) {
				// Only update if changed and not empty
				if (newTitle && newTitle.trim() !== "") {
					savedUrls[index].title = newTitle.trim();
					chrome.storage.local.set({ savedUrls }, () => {
						loadUrls();
					});
				} else {
					loadUrls(); // Revert/Refresh if empty
				}
			}
		});
	}

	function getCurrentItems() {
		// Helper to recover state if needed, though loadUrls does it all.
		loadUrls();
	}

	function deleteItem(index) {
		chrome.storage.local.get(['savedUrls'], (result) => {
			let savedUrls = result.savedUrls || [];
			if (index >= 0 && index < savedUrls.length) {
				savedUrls.splice(index, 1); // Remove item at index
				chrome.storage.local.set({ savedUrls }, () => {
					loadUrls(); // Re-render
				});
			}
		});
	}
});
