frappe.pages['dept_incharge'].on_page_load = function (wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '🌐 SANT NIRANKARI MISSION',
		single_column: true
	});

	// Load external CSS
	frappe.require("/assets/naman/css/dept_requestor.css");

	// ----------------------------
	// ✅ NAVBAR SETUP
	// ----------------------------
	const navbar = $(`
		<div class="navbar">
			<div class="navbar-left">
				<a href="#" class="nav-link active" data-section="home">🏠 Home</a>
				<a href="#" class="nav-link" data-section="requests">📋 Requests</a>
			</div>
			<div class="navbar-right">
				<a href="#" class="nav-link" data-section="review_requests" id="review-requests-btn">🔎 Review Requests</a>
			</div>
		</div>
	`);
	page.body.append(navbar);

	// ----------------------------
	// CONTENT AREA
	// ----------------------------
	const content_area = $(`
		<div id="content-area" class="content-area">
			<h2>Welcome, Department Incharge</h2>
			<p>Use this page to view and review all department requests.</p>
		</div>
	`);
	page.body.append(content_area);

	// ----------------------------
	// NAVIGATION CLICK HANDLER
	// ----------------------------
	$(document).on('click', '.nav-link', function (e) {
		e.preventDefault();
		$('.nav-link').removeClass('active');
		$(this).addClass('active');
		loadSection($(this).data('section'));
	});

	// ----------------------------
	// LOAD DEFAULT SECTION
	// ----------------------------
	loadSection('home');

	// ----------------------------
	// SECTION LOADER
	// ----------------------------
	function loadSection(section) {
		const area = $('#content-area');
		area.empty();

		// HOME SECTION
		if (section === 'home') {
			area.html(`
				<h2>Welcome, Department Incharge</h2>
				<p>Manage and review all department requests here.</p>
			`);
		}

		// REQUESTS SECTION (all requests)
		else if (section === 'requests') {
			area.html(`
				<h2>All Requests</h2>
				<div class="filter-bar">
					<label for="statusFilter"><b>Filter by Status:</b></label>
					<select id="statusFilter">
						<option value="All">All</option>
						<option value="Pending">Pending</option>
						<option value="Approved">Approved</option>
						<option value="Rejected">Rejected</option>
					</select>
				</div>

				<div class="table-container">
					<table class="custom-table" id="requestsTable">
						<thead>
							<tr>
								<th>Request ID</th>
								<th>Status</th>
								<th>Creation</th>
							</tr>
						</thead>
						<tbody>
							<tr><td colspan="3" class="loading-text">Loading requests...</td></tr>
						</tbody>
					</table>
				</div>
			`);
			loadRequests('All');
		}

		// REVIEW REQUESTS SECTION (only pending)
		else if (section === 'review_requests') {
			area.html(`
				<h2>Pending Requests for Review</h2>
				<div class="table-container">
					<table class="custom-table" id="reviewRequestsTable">
						<thead>
							<tr>
								<th>Request ID</th>
								<th>Status</th>
								<th>Creation</th>
							</tr>
						</thead>
						<tbody>
							<tr><td colspan="3" class="loading-text">Loading pending requests...</td></tr>
						</tbody>
					</table>
				</div>
			`);
			loadReviewRequests(); // pending only
		}
	}

	// ----------------------------
	// LOAD ALL REQUESTS
	// ----------------------------
	function loadRequests(status = 'All') {
		const tbody = $('#requestsTable tbody');
		tbody.html('<tr><td colspan="3" class="loading-text">Loading requests...</td></tr>');

		frappe.call({
			method: "naman.naman.page.dept_incharge.dept_incharge.get_requests",
			args: { status: status },
			callback: function (r) {
				const rows = r.message || [];
				if (!rows.length) {
					tbody.html('<tr><td colspan="3" class="loading-text">No requests found.</td></tr>');
					return;
				}

				let html = '';
				rows.forEach(req => {
					html += `
						<tr>
							<td><a href="/app/request-management/${req.request_id}" target="_self">${req.request_id}</a></td>
							<td><span class="status-badge ${(req.status || 'unknown').toLowerCase()}">${req.status || '-'}</span></td>
							<td>${frappe.datetime.str_to_user(req.creation)}</td>
						</tr>
					`;
				});
				tbody.html(html);
			},
			error: function () {
				tbody.html('<tr><td colspan="3" class="error-text">Error loading requests.</td></tr>');
			}
		});
	}

	// ----------------------------
	// LOAD ONLY PENDING REQUESTS
	// ----------------------------
	function loadReviewRequests() {
		const tbody = $('#reviewRequestsTable tbody');
		tbody.html('<tr><td colspan="3" class="loading-text">Loading pending requests...</td></tr>');

		frappe.call({
			method: "naman.naman.page.dept_incharge.dept_incharge.get_requests",
			args: { status: 'Pending' },
			callback: function (r) {
				const rows = r.message || [];
				if (!rows.length) {
					tbody.html('<tr><td colspan="3" class="loading-text">✅ No pending requests to review.</td></tr>');
					return;
				}

				let html = '';
				rows.forEach(req => {
					html += `
						<tr>
							<td><a href="/app/request-management/${req.request_id}" target="_self">${req.request_id}</a></td>
							<td><span class="status-badge pending">${req.status}</span></td>
							<td>${frappe.datetime.str_to_user(req.creation)}</td>
						</tr>
					`;
				});
				tbody.html(html);
			},
			error: function () {
				tbody.html('<tr><td colspan="3" class="error-text">Error loading pending requests.</td></tr>');
			}
		});
	}

	// ----------------------------
	// STATUS FILTER EVENT
	// ----------------------------
	$(document).on('change', '#statusFilter', function () {
		loadRequests($(this).val());
	});
};
