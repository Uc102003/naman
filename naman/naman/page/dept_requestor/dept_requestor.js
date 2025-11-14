frappe.pages['dept_requestor'].on_page_load = function (wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '🌐 SANT NIRANKARI MISSION',
		single_column: true
	});

	// ✅ Navbar with Create Button
	const navbar = $(`
		<div class="navbar">
			<div class="navbar-left">
				<a href="#" class="nav-link active" data-section="home">🏠 Home</a>
				<a href="#" class="nav-link" data-section="requests">📋 Requests</a>
			</div>
			<div class="navbar-right">
				<button id="create-request-btn" class="btn-create">➕ Create New Request</button>
			</div>
		</div>
	`);
	page.body.append(navbar);

	// ✅ Content Area
	const content_area = $(`
		<div id="content-area" class="content-area">
			<h2>Welcome to the Home Page</h2>
			<p>Select a section from the navigation bar above to continue.</p>
		</div>
	`);
	page.body.append(content_area);

	// ✅ Navigation Clicks
	$(document).on('click', '.nav-link', function (e) {
		e.preventDefault();
		const section = $(this).data('section');
		$('.nav-link').removeClass('active');
		$(this).addClass('active');
		loadSection(section);
	});

	// ✅ Create New Request Button Click
	$(document).on('click', '#create-request-btn', function () {
		frappe.new_doc('Request Management');
	});

	// ✅ Section Loader
	function loadSection(section) {
		const area = $('#content-area');
		area.empty();

		if (section === 'home') {
			area.html(`
				<h2>Welcome to the Home Page</h2>
				<p>This is the Department Requestor workspace dashboard.</p>
			`);
		} else if (section === 'requests') {
			area.html(`
				<h2>All Requests</h2>

				<div class="filter-bar">
					<label for="statusFilter"><b>Filter by Status:</b></label>
					<select id="statusFilter">
						<option value="all">All</option>
						<option value="Approved">Approved</option>
						<option value="Pending">Pending</option>
						<option value="Rejected">Rejected</option>
					</select>
				</div>

				<div id="requests-table" class="table-container">
					<div class="loading-text">Loading requests...</div>
				</div>
			`);
			loadRequests("all");

			// Filter listener
			$(document).on('change', '#statusFilter', function () {
				const status = $(this).val();
				loadRequests(status);
			});
		}
	}

	// ✅ Fetch Requests from Python
	function loadRequests(status) {
		frappe.call({
			method: "naman.naman.page.dept_requestor.dept_requestor.get_requests",
			args: { status: status },
			callback: function (r) {
				if (r.message && r.message.length > 0) {
					renderRequestsTable(r.message);
				} else {
					$('#requests-table').html("<p>No requests found.</p>");
				}
			},
			error: function (err) {
				console.error(err);
				$('#requests-table').html("<p class='error-text'>Error loading data.</p>");
			}
		});
	}

	// ✅ Render Requests Table with Sorting and Clickable ID
	function renderRequestsTable(requests) {
		let html = `
			<table class="custom-table" id="sortableTable">
				<thead>
					<tr>
						<th data-key="request_id">Request ID ⬍</th>
						<th data-key="status">Status ⬍</th>
						<th data-key="creation">Creation ⬍</th>
					</tr>
				</thead>
				<tbody>
		`;

		requests.forEach(req => {
			html += `
				<tr>
					<td>
						<a href="/app/request-management/${req.request_id}" 
						   class="request-link"
						   target="_blank">
						   ${req.request_id || '-'}
						</a>
					</td>
					<td><span class="status-badge ${req.status?.toLowerCase() || 'unknown'}">${req.status || '-'}</span></td>
					<td>${frappe.datetime.str_to_user(req.creation) || '-'}</td>
				</tr>
			`;
		});

		html += `</tbody></table>`;
		$('#requests-table').html(html);
		enableTableSorting();
	}

	// ✅ Enable Column Sorting
	function enableTableSorting() {
		const table = document.getElementById('sortableTable');
		const headers = table.querySelectorAll('th');

		headers.forEach(header => {
			header.addEventListener('click', () => {
				const key = header.getAttribute('data-key');
				sortTable(table, key, header);
			});
		});
	}

	let sortDirections = {}; // Track sort direction

	function sortTable(table, key, header) {
		const rows = Array.from(table.querySelector('tbody').rows);
		const ascending = !sortDirections[key];
		sortDirections[key] = ascending;

		rows.sort((a, b) => {
			const valA = a.querySelector(`td:nth-child(${getColumnIndex(key)})`).innerText.trim();
			const valB = b.querySelector(`td:nth-child(${getColumnIndex(key)})`).innerText.trim();

			if (key === 'creation') {
				return ascending
					? new Date(valA) - new Date(valB)
					: new Date(valB) - new Date(valA);
			}
			return ascending
				? valA.localeCompare(valB)
				: valB.localeCompare(valA);
		});

		const tbody = table.querySelector('tbody');
		tbody.innerHTML = '';
		rows.forEach(r => tbody.appendChild(r));

		table.querySelectorAll('th').forEach(th => th.innerText = th.innerText.replace('↑', '').replace('↓', ''));
		header.innerText = header.innerText.split(' ')[0] + (ascending ? ' ↑' : ' ↓');
	}

	function getColumnIndex(key) {
		switch (key) {
			case 'request_id': return 1;
			case 'status': return 2;
			case 'creation': return 3;
			default: return 1;
		}
	}
};
