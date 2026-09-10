document.addEventListener('DOMContentLoaded', () => {
	// =========================================================
	// LocalPocket URLs Management (Right Panel)
	// =========================================================
	const saveBtn = document.getElementById('saveBtn');
	const saveAllBtn = document.getElementById('saveAllBtn');
	const openWindowBtn = document.getElementById('openWindowBtn');
	const clearBtn = document.getElementById('clearBtn');
	const exportBtn = document.getElementById('exportBtn');
	const importBtn = document.getElementById('importBtn');
	const importFile = document.getElementById('importFile');
	const urlList = document.getElementById('urlList');

	// Load saved URLs on startup
	loadUrls();

	// Export JSON
	exportBtn.addEventListener('click', () => {
		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(['savedUrls'], (result) => {
				downloadBackup(result.savedUrls || []);
			});
		} else {
			const saved = JSON.parse(localStorage.getItem('savedUrls') || '[]');
			downloadBackup(saved);
		}
	});

	function downloadBackup(savedUrls) {
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedUrls, null, 2));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "localpocket_backup.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	// Import JSON - Click hidden file input
	importBtn.addEventListener('click', () => {
		importFile.click();
	});

	// Handle File Selection
	importFile.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const importedData = JSON.parse(event.target.result);
				if (Array.isArray(importedData)) {
					getSavedUrls((existingUrls) => {
						const existingUrlSet = new Set(existingUrls.map(item => item.url));
						let addedCount = 0;

						importedData.forEach(item => {
							if (item.url && !existingUrlSet.has(item.url)) {
								item.title = item.title || item.url;
								item.timestamp = item.timestamp || new Date().toISOString();
								existingUrls.push(item);
								existingUrlSet.add(item.url);
								addedCount++;
							}
						});

						setSavedUrls(existingUrls, () => {
							loadUrls();
							showToast(`Imported ${addedCount} new URLs.`, 'success');
						});
					});
				} else {
					showToast('Invalid file format: JSON must be an array.', 'warning');
				}
			} catch (err) {
				console.error(err);
				showToast('Error parsing JSON file.', 'danger');
			}
			importFile.value = '';
		};
		reader.readAsText(file);
	});

	// Save current tab
	saveBtn.addEventListener('click', async () => {
		if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (tab && tab.url) {
				saveTabs([tab]);
			}
		} else {
			saveTabs([{ url: window.location.href, title: document.title }]);
		}
	});

	// Save all tabs
	saveAllBtn.addEventListener('click', async () => {
		if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
			const tabs = await chrome.tabs.query({ currentWindow: true });
			saveTabs(tabs);
		} else {
			showToast('Tabs API not available.', 'warning');
		}
	});



	// Open all saved in new window
	openWindowBtn.addEventListener('click', () => {
		getSavedUrls((savedUrls) => {
			if (savedUrls.length === 0) {
				showToast('No URLs to open.', 'warning');
				return;
			}

			if (confirm(`Open all ${savedUrls.length} saved URLs in a new window?`)) {
				const urls = savedUrls.map(item => item.url);
				if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.create) {
					chrome.windows.create({ url: urls });
				} else {
					urls.forEach(u => window.open(u, '_blank'));
				}
			}
		});
	});

	function getSavedUrls(callback) {
		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(['savedUrls'], (result) => {
				callback(result.savedUrls || []);
			});
		} else {
			const saved = JSON.parse(localStorage.getItem('savedUrls') || '[]');
			callback(saved);
		}
	}

	function setSavedUrls(savedUrls, callback) {
		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
			chrome.storage.local.set({ savedUrls }, callback);
		} else {
			localStorage.setItem('savedUrls', JSON.stringify(savedUrls));
			if (callback) callback();
		}
	}

	function saveTabs(tabs) {
		getSavedUrls((savedUrls) => {
			const existingUrlSet = new Set(savedUrls.map(item => item.url));
			let addedCount = 0;

			const tabsToProcess = [...tabs].reverse();

			tabsToProcess.forEach(tab => {
				if (tab.url && !existingUrlSet.has(tab.url)) {
					if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
						return;
					}

					const newItem = {
						url: tab.url,
						title: tab.title || tab.url,
						timestamp: new Date().toISOString()
					};
					savedUrls.unshift(newItem);
					existingUrlSet.add(tab.url);
					addedCount++;
				}
			});

			if (addedCount > 0) {
				setSavedUrls(savedUrls, () => {
					loadUrls();
					showToast(`Saved ${addedCount} new URL(s).`, 'success');
				});
			} else {
				showToast('No new URLs to save.', 'warning');
			}
		});
	}

	// Clear all
	clearBtn.addEventListener('click', () => {
		if (confirm('Are you sure you want to clear all saved URLs?')) {
			setSavedUrls([], () => {
				loadUrls();
				showToast('All items cleared.', 'success');
			});
		}
	});

	function showToast(message, type = 'success') {
		const container = document.getElementById('toast-container');
		if (!container) return;

		const toast = document.createElement('div');
		toast.className = `toast ${type}`;
		toast.textContent = message;

		container.appendChild(toast);

		requestAnimationFrame(() => {
			toast.classList.add('show');
		});

		setTimeout(() => {
			toast.classList.remove('show');
			toast.addEventListener('transitionend', () => {
				toast.remove();
			});
		}, 3000);
	}

	function loadUrls() {
		getSavedUrls((savedUrls) => {
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
				e.preventDefault();
				makeEditable(title, index, item.title);
			};

			const link = document.createElement('a');
			link.className = 'url';
			link.href = item.url;
			link.textContent = item.url;
			link.target = '_blank';

			const time = document.createElement('div');
			time.className = 'timestamp';
			time.textContent = new Date(item.timestamp).toLocaleString();

			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'delete-btn';
			deleteBtn.innerHTML = '&times;';
			deleteBtn.title = 'Delete this item';
			deleteBtn.onclick = (e) => {
				e.stopPropagation();
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

		input.onkeydown = (e) => {
			if (e.key === 'Enter') {
				saveTitle(index, input.value);
			} else if (e.key === 'Escape') {
				element.textContent = currentTitle;
				loadUrls();
			}
		};

		input.onblur = () => {
			saveTitle(index, input.value);
		};

		element.innerHTML = '';
		element.appendChild(input);
		input.focus();
	}

	function saveTitle(index, newTitle) {
		getSavedUrls((savedUrls) => {
			if (index >= 0 && index < savedUrls.length) {
				if (newTitle && newTitle.trim() !== "") {
					savedUrls[index].title = newTitle.trim();
					setSavedUrls(savedUrls, () => {
						loadUrls();
					});
				} else {
					loadUrls();
				}
			}
		});
	}

	function deleteItem(index) {
		getSavedUrls((savedUrls) => {
			if (index >= 0 && index < savedUrls.length) {
				savedUrls.splice(index, 1);
				setSavedUrls(savedUrls, () => {
					loadUrls();
					showToast('Item deleted.', 'success');
				});
			}
		});
	}


	// =========================================================
	// Browser Bookmarks Tree Sidebar (Left Panel)
	// =========================================================

	const bmSearchInput = document.getElementById('bmSearchInput');
	const bmSearchClearBtn = document.getElementById('bmSearchClearBtn');
	const bmStarBtn = document.getElementById('bmStarBtn');
	const bmMenuBtn = document.getElementById('bmMenuBtn');
	const bmDropdownMenu = document.getElementById('bmDropdownMenu');
	const bmExpandAllBtn = document.getElementById('bmExpandAllBtn');
	const bmCollapseAllBtn = document.getElementById('bmCollapseAllBtn');
	const bmRefreshBtn = document.getElementById('bmRefreshBtn');

	const bmRecentBtn = document.getElementById('bmRecentBtn');
	const bmTreeBtn = document.getElementById('bmTreeBtn');
	const bmCopyAllBtn = document.getElementById('bmCopyAllBtn');

	const bookmarkTreeEl = document.getElementById('bookmarkTree');

	// State
	let bookmarkDataTree = null;
	let expandedFolderIds = new Set();
	let currentViewMode = 'tree'; // 'tree' | 'recent' | 'stats'
	let filterBarOnly = false;

	// Load stored expanded folders
	try {
		const storedExp = localStorage.getItem('localpocket_bm_expanded');
		if (storedExp) {
			expandedFolderIds = new Set(JSON.parse(storedExp));
		}
	} catch (e) {
		console.warn('Failed to parse expanded folders:', e);
	}

	function saveExpandedFolders() {
		try {
			localStorage.setItem('localpocket_bm_expanded', JSON.stringify([...expandedFolderIds]));
		} catch (e) {
			console.warn('Failed to save expanded folders:', e);
		}
	}

	// Initialize Bookmarks
	initBookmarks();

	function initBookmarks() {
		loadBookmarksData();
		setupBookmarkEvents();
		setupBookmarkListeners();
	}

	function loadBookmarksData() {
		if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
			chrome.bookmarks.getTree((tree) => {
				bookmarkDataTree = tree;
				// If no folders expanded yet, expand first-level folders by default
				if (expandedFolderIds.size === 0 && tree && tree[0] && tree[0].children) {
					tree[0].children.forEach(child => {
						expandedFolderIds.add(child.id);
						if (child.children) {
							child.children.forEach(sub => {
								if (sub.children) expandedFolderIds.add(sub.id);
							});
						}
					});
					saveExpandedFolders();
				}
				renderCurrentView();
			});
		} else {
			// Fallback mock bookmarks matching the screenshot when running in preview/non-extension
			bookmarkDataTree = getMockBookmarksTree();
			if (expandedFolderIds.size === 0) {
				expandedFolderIds.add('mock-that');
				expandedFolderIds.add('mock-social');
				expandedFolderIds.add('mock-dash');
				saveExpandedFolders();
			}
			renderCurrentView();
		}
	}

	function setupBookmarkListeners() {
		if (typeof chrome !== 'undefined' && chrome.bookmarks) {
			const events = ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered'];
			events.forEach(evt => {
				if (chrome.bookmarks[evt]) {
					chrome.bookmarks[evt].addListener(() => {
						loadBookmarksData();
					});
				}
			});
		}
	}

	function setupBookmarkEvents() {
		// Search Input
		bmSearchInput.addEventListener('input', (e) => {
			const query = e.target.value.trim();
			if (query.length > 0) {
				bmSearchClearBtn.style.display = 'block';
				handleSearch(query);
			} else {
				bmSearchClearBtn.style.display = 'none';
				renderCurrentView();
			}
		});

		bmSearchClearBtn.addEventListener('click', () => {
			bmSearchInput.value = '';
			bmSearchClearBtn.style.display = 'none';
			bmSearchInput.focus();
			renderCurrentView();
		});

		// Star Button - toggle bookmark bar filter
		bmStarBtn.addEventListener('click', () => {
			filterBarOnly = !filterBarOnly;
			bmStarBtn.classList.toggle('active', filterBarOnly);
			showToast(filterBarOnly ? '북마크 바만 표시' : '전체 북마크 표시', 'success');
			renderCurrentView();
		});

		// Menu Button & Dropdown
		bmMenuBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			bmDropdownMenu.classList.toggle('show');
		});

		document.addEventListener('click', (e) => {
			if (!bmMenuBtn.contains(e.target) && !bmDropdownMenu.contains(e.target)) {
				bmDropdownMenu.classList.remove('show');
			}
		});

		bmExpandAllBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			expandAllFolders(true);
		});

		bmCollapseAllBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			expandAllFolders(false);
		});

		bmRefreshBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			loadBookmarksData();
			showToast('북마크 새로고침 완료', 'success');
		});

		bmRecentBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			currentViewMode = 'recent';
			renderRecentBookmarks();
		});

		bmTreeBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			currentViewMode = 'tree';
			renderBookmarkTree();
		});

		bmCopyAllBtn.addEventListener('click', () => {
			bmDropdownMenu.classList.remove('show');
			copyVisibleBookmarks();
		});
	}

	function renderCurrentView() {
		if (currentViewMode === 'tree') {
			renderBookmarkTree();
		} else if (currentViewMode === 'recent') {
			renderRecentBookmarks();
		} else if (currentViewMode === 'stats') {
			renderBookmarkStats();
		}
	}

	function expandAllFolders(expand) {
		if (!bookmarkDataTree) return;
		if (expand) {
			const collectFolderIds = (nodes) => {
				nodes.forEach(node => {
					if (node.children) {
						expandedFolderIds.add(node.id);
						collectFolderIds(node.children);
					}
				});
			};
			collectFolderIds(bookmarkDataTree);
		} else {
			expandedFolderIds.clear();
		}
		saveExpandedFolders();
		renderCurrentView();
	}

	// =========================================================
	// Tree Rendering & Event Handling
	// =========================================================

	function renderBookmarkTree() {
		bookmarkTreeEl.innerHTML = '';
		if (!bookmarkDataTree || bookmarkDataTree.length === 0) {
			bookmarkTreeEl.innerHTML = '<div class="bm-empty">북마크가 없습니다.</div>';
			return;
		}

		const rootNodes = bookmarkDataTree[0].children || bookmarkDataTree;
		const container = document.createElement('div');
		container.className = 'bm-tree-list';

		rootNodes.forEach(node => {
			if (filterBarOnly && !node.title.includes('바') && !node.title.toLowerCase().includes('bar')) {
				return;
			}
			const el = createTreeNodeElement(node);
			if (el) container.appendChild(el);
		});

		if (container.children.length === 0) {
			bookmarkTreeEl.innerHTML = '<div class="bm-empty">표시할 북마크가 없습니다.</div>';
		} else {
			bookmarkTreeEl.appendChild(container);
		}
	}

	function createTreeNodeElement(node) {
		const isFolder = Boolean(node.children);

		if (isFolder) {
			// Folders: "Bookmarks Bar" / "Other Bookmarks" can be displayed or flattened
			// If root has title like "북마크바" or "Bookmarks bar" or "Other bookmarks", render folder
			const folderContainer = document.createElement('div');
			folderContainer.className = 'bm-folder-node';
			folderContainer.dataset.id = node.id;

			const isExpanded = expandedFolderIds.has(node.id);

			const folderRow = document.createElement('div');
			folderRow.className = `bm-folder-row ${isExpanded ? 'expanded' : ''}`;
			folderRow.title = node.title;

			// Chevron Icon
			const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			chevron.setAttribute('class', 'bm-chevron');
			chevron.setAttribute('viewBox', '0 0 24 24');
			chevron.setAttribute('fill', 'none');
			chevron.setAttribute('stroke', 'currentColor');
			chevron.setAttribute('stroke-width', '2.5');
			chevron.setAttribute('stroke-linecap', 'round');
			chevron.setAttribute('stroke-linejoin', 'round');
			chevron.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>';

			// Folder Icon (outline matching screenshot)
			const folderIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			folderIcon.setAttribute('class', 'bm-folder-icon');
			folderIcon.setAttribute('viewBox', '0 0 24 24');
			folderIcon.setAttribute('fill', 'none');
			folderIcon.setAttribute('stroke', 'currentColor');
			folderIcon.setAttribute('stroke-width', '2');
			folderIcon.setAttribute('stroke-linecap', 'round');
			folderIcon.setAttribute('stroke-linejoin', 'round');
			folderIcon.innerHTML = '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>';

			// Folder Title
			const titleSpan = document.createElement('span');
			titleSpan.className = 'bm-folder-title';
			titleSpan.textContent = node.title || '폴더';

			folderRow.appendChild(chevron);
			folderRow.appendChild(folderIcon);
			folderRow.appendChild(titleSpan);

			// Children Container
			const childrenContainer = document.createElement('div');
			childrenContainer.className = `bm-folder-children ${isExpanded ? 'expanded' : ''}`;

			if (node.children && node.children.length > 0) {
				node.children.forEach(childNode => {
					const childEl = createTreeNodeElement(childNode);
					if (childEl) childrenContainer.appendChild(childEl);
				});
			}

			// Toggle Expand / Collapse
			folderRow.addEventListener('click', (e) => {
				e.stopPropagation();
				const currentlyExpanded = expandedFolderIds.has(node.id);
				if (currentlyExpanded) {
					expandedFolderIds.delete(node.id);
					folderRow.classList.remove('expanded');
					childrenContainer.classList.remove('expanded');
				} else {
					expandedFolderIds.add(node.id);
					folderRow.classList.add('expanded');
					childrenContainer.classList.add('expanded');
				}
				saveExpandedFolders();
			});

			folderContainer.appendChild(folderRow);
			folderContainer.appendChild(childrenContainer);
			return folderContainer;
		} else {
			// Leaf Bookmark Node
			return createBookmarkRowElement(node);
		}
	}

	function createBookmarkRowElement(node, highlightQuery = '') {
		const row = document.createElement('div');
		row.className = 'bm-bookmark-row';
		row.dataset.id = node.id;
		row.dataset.url = node.url;
		row.title = `${node.title || node.url}\n${node.url}`;

		// Favicon element
		const faviconImg = document.createElement('img');
		faviconImg.className = 'bm-favicon';
		faviconImg.alt = '';
		faviconImg.loading = 'lazy';
		faviconImg.src = getFaviconUrl(node.url);

		// Fallback onerror chain
		faviconImg.onerror = () => {
			if (!faviconImg.dataset.triedGoogle) {
				faviconImg.dataset.triedGoogle = 'true';
				faviconImg.src = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(node.url)}`;
			} else {
				// Default fallback icon
				faviconImg.onerror = null;
				faviconImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
			}
		};

		// Title element
		const titleSpan = document.createElement('span');
		titleSpan.className = 'bm-title';
		const displayText = node.title || node.url;

		if (highlightQuery && displayText.toLowerCase().includes(highlightQuery.toLowerCase())) {
			const idx = displayText.toLowerCase().indexOf(highlightQuery.toLowerCase());
			const before = displayText.slice(0, idx);
			const match = displayText.slice(idx, idx + highlightQuery.length);
			const after = displayText.slice(idx + highlightQuery.length);

			titleSpan.innerHTML = '';
			titleSpan.appendChild(document.createTextNode(before));
			const mark = document.createElement('mark');
			mark.className = 'bm-highlight';
			mark.textContent = match;
			titleSpan.appendChild(mark);
			titleSpan.appendChild(document.createTextNode(after));
		} else {
			titleSpan.textContent = displayText;
		}

		row.appendChild(faviconImg);
		row.appendChild(titleSpan);

		// Click to open URL in browser
		row.addEventListener('click', (e) => {
			e.preventDefault();
			openBookmarkUrl(node.url, e.ctrlKey || e.metaKey);
		});

		// Middle-click to open in background tab
		row.addEventListener('auxclick', (e) => {
			if (e.button === 1) {
				e.preventDefault();
				openBookmarkUrl(node.url, true);
			}
		});

		return row;
	}

	function getFaviconUrl(url) {
		if (!url) return '';
		try {
			if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
				return chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`);
			}
		} catch (e) {
			// Ignore and fallback
		}
		return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`;
	}

	function openBookmarkUrl(url, inBackground = false) {
		if (!url) return;
		if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
			chrome.tabs.create({
				url: url,
				active: !inBackground
			});
		} else {
			window.open(url, '_blank');
		}
	}

	// =========================================================
	// Real-time Bookmark Search
	// =========================================================

	function handleSearch(query) {
		if (!bookmarkDataTree) return;

		const matchingNodes = [];
		const searchLower = query.toLowerCase();

		function traverse(nodes) {
			nodes.forEach(node => {
				if (node.url) {
					const title = (node.title || '').toLowerCase();
					const url = (node.url || '').toLowerCase();
					if (title.includes(searchLower) || url.includes(searchLower)) {
						matchingNodes.push(node);
					}
				}
				if (node.children) {
					traverse(node.children);
				}
			});
		}

		traverse(bookmarkDataTree);

		bookmarkTreeEl.innerHTML = '';
		if (matchingNodes.length === 0) {
			bookmarkTreeEl.innerHTML = `<div class="bm-empty">'${escapeHtml(query)}' 검색 결과가 없습니다.</div>`;
			return;
		}

		const resultHeader = document.createElement('div');
		resultHeader.className = 'bm-section-title';
		resultHeader.textContent = `검색 결과 (${matchingNodes.length})`;
		bookmarkTreeEl.appendChild(resultHeader);

		const list = document.createElement('div');
		matchingNodes.forEach(node => {
			const item = createBookmarkRowElement(node, query);
			list.appendChild(item);
		});
		bookmarkTreeEl.appendChild(list);
	}

	function escapeHtml(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	// =========================================================
	// Recent & Stats Views
	// =========================================================

	function renderRecentBookmarks() {
		bookmarkTreeEl.innerHTML = '<div class="bm-loading">최근 북마크 불러오는 중...</div>';

		if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getRecent) {
			chrome.bookmarks.getRecent(40, (recentItems) => {
				displayRecentList(recentItems);
			});
		} else {
			// Mock recent items
			const mockRecent = [
				{ id: '1', title: '다모앙 | DAMOANG', url: 'https://damoang.net' },
				{ id: '2', title: '딴지 자유게시판', url: 'https://www.ddanzi.com' },
				{ id: '3', title: '홈 / X', url: 'https://x.com' },
				{ id: '4', title: 'Threads', url: 'https://www.threads.net' },
				{ id: '5', title: '클리앙', url: 'https://www.clien.net' },
				{ id: '6', title: 'YouTube', url: 'https://www.youtube.com' }
			];
			displayRecentList(mockRecent);
		}
	}

	function displayRecentList(items) {
		bookmarkTreeEl.innerHTML = '';
		if (!items || items.length === 0) {
			bookmarkTreeEl.innerHTML = '<div class="bm-empty">최근 북마크가 없습니다.</div>';
			return;
		}

		const title = document.createElement('div');
		title.className = 'bm-section-title';
		title.textContent = `최근 북마크 (${items.length})`;
		bookmarkTreeEl.appendChild(title);

		const list = document.createElement('div');
		items.forEach(node => {
			if (node.url) {
				const item = createBookmarkRowElement(node);
				list.appendChild(item);
			}
		});
		bookmarkTreeEl.appendChild(list);
	}

	function renderBookmarkStats() {
		let totalBookmarks = 0;
		let totalFolders = 0;

		function countNodes(nodes) {
			nodes.forEach(node => {
				if (node.children) {
					totalFolders++;
					countNodes(node.children);
				} else if (node.url) {
					totalBookmarks++;
				}
			});
		}

		if (bookmarkDataTree) {
			countNodes(bookmarkDataTree);
		}

		bookmarkTreeEl.innerHTML = `
			<div class="bm-section-title">북마크 통계</div>
			<div class="bm-stat-card">
				<div class="bm-stat-row">
					<span>총 북마크 수:</span>
					<span class="bm-stat-value">${totalBookmarks}개</span>
				</div>
				<div class="bm-stat-row">
					<span>총 폴더 수:</span>
					<span class="bm-stat-value">${totalFolders}개</span>
				</div>
				<div class="bm-stat-row">
					<span>펼쳐진 폴더:</span>
					<span class="bm-stat-value">${expandedFolderIds.size}개</span>
				</div>
			</div>
		`;
	}

	function copyVisibleBookmarks() {
		const visibleRows = bookmarkTreeEl.querySelectorAll('.bm-bookmark-row');
		if (visibleRows.length === 0) {
			showToast('복사할 북마크가 없습니다.', 'warning');
			return;
		}

		const links = [];
		visibleRows.forEach(row => {
			const url = row.dataset.url;
			const titleEl = row.querySelector('.bm-title');
			const title = titleEl ? titleEl.textContent : url;
			if (url) {
				links.push(`- [${title}](${url})`);
			}
		});

		navigator.clipboard.writeText(links.join('\n')).then(() => {
			showToast(`${links.length}개 북마크 링크가 복사되었습니다!`, 'success');
		}).catch(err => {
			console.error(err);
			showToast('클립보드 복사 실패', 'danger');
		});
	}

	// =========================================================
	// Mock Data Matching Screenshot
	// =========================================================

	function getMockBookmarksTree() {
		return [{
			id: '0',
			title: 'Root',
			children: [
				{
					id: 'mock-that',
					title: 'That',
					children: []
				},
				{
					id: 'mock-social',
					title: 'Social',
					children: [
						{ id: 'm1', title: '딴지 자유게시판', url: 'https://www.ddanzi.com' },
						{ id: 'm2', title: '다모앙 | DAMOANG', url: 'https://damoang.net' },
						{ id: 'm3', title: '클리앙', url: 'https://www.clien.net' },
						{ id: 'm4', title: '오늘의유머 -', url: 'http://www.todayhumor.co.kr' },
						{ id: 'm5', title: 'Facebook', url: 'https://www.facebook.com' },
						{ id: 'm6', title: '홈 / X', url: 'https://x.com' },
						{ id: 'm7', title: 'Threads', url: 'https://www.threads.net' },
						{
							id: 'mock-dash',
							title: '---',
							children: [
								{ id: 'm8', title: '티비몬 | 최신영...', url: 'https://tvmon.com' },
								{ id: 'm9', title: '티비핫', url: 'https://tvhot.com' },
								{ id: 'm10', title: '토렌트탑-TORR...', url: 'https://torrenttop.com' },
								{ id: 'm11', title: '왓챠피디아 - 영화, ...', url: 'https://pedia.watcha.com' },
								{ id: 'm12', title: 'Hermes', url: 'https://www.hermes.com' }
							]
						},
						{ id: 'm13', title: 'You', url: 'https://www.youtube.com' },
						{ id: 'm14', title: 'Mail', url: 'https://mail.google.com' },
						{ id: 'm15', title: 'Calendar', url: 'https://calendar.google.com' }
					]
				}
			]
		}];
	}
});
