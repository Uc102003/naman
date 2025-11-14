frappe.pages['it_users'].on_page_load = function (wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '🌐 SANT NIRANKARI MISSION',
		single_column: true
	});

	// ✅ Navbar
	const navbar = $(`
		<div class="navbar">
			<div class="navbar-left">
				<a href="#" class="nav-link active" data-section="home">🏠 Home</a>
				<a href="#" class="nav-link" data-section="received">📥 Received Requests</a>
				<!--<a href="#" class="nav-link" data-section="assigned">🧾 Assigned Requests</a>--!>
				<!--<a href="#" class="nav-link" data-section="completed">✅ Completed</a>--!>
			</div>
		</div>
	`);
	page.body.append(navbar);

	// ✅ Main Content Area
	const content = $(`<div id="content-area" class="content-area">
		<h2>Welcome to the IT Users Dashboard</h2>
		<p>Select a section from the navigation bar above.</p>
	</div>`);
	page.body.append(content);

	// ✅ Handle Navbar Clicks
	$(document).on("click", ".nav-link", function (e) {
		e.preventDefault();
		$(".nav-link").removeClass("active");
		$(this).addClass("active");

		const section = $(this).data("section");
		loadSection(section);
	});

	// ✅ Section Loader
	function loadSection(section) {
		const area = $("#content-area");
		area.empty();

		if (section === "home") {
			area.html(`<h2>Welcome to the IT Users Page</h2>
				<p>Here you can manage received, assigned, and completed requests.</p>`);
		} else {
			let title = "";
			let method = "";

			if (section === "received") {
				title = "📥 Received Requests";
				method = "naman.naman.page.it_users.it_users.get_received_requests";
			} else if (section === "assigned") {
				title = "🧾 Assigned Requests";
				method = "naman.naman.page.it_users.it_users.get_assigned_requests";
			} else if (section === "completed") {
				title = "✅ Completed Requests";
				method = "naman.naman.page.it_users.it_users.get_completed_requests";
			}

			area.html(`<h2>${title}</h2>
				<div id="requests-table" class="table-container"><p>Loading...</p></div>`);

			frappe.call({
				method: method,
				callback: function (r) {
					if (r.message && r.message.length > 0) {
						renderTable(r.message, section);
					} else {
						$("#requests-table").html("<p>No data found.</p>");
					}
				},
				error: function () {
					$("#requests-table").html("<p class='error-text'>Error loading data.</p>");
				}
			});
		}
	}

	// ✅ Render Table
	function renderTable(data, section) {
		let html = `<table class="custom-table">
			<thead>
				<tr>
					<th>Request ID</th>
					<th>Creation</th>
					${section === "assigned" ? "<th>Action</th>" : ""}
				</tr>
			</thead><tbody>`;

		data.forEach(row => {
			html += `<tr>
				<td><a href="/app/request-management/${row.request_id}" target="_blank">${row.request_id}</a></td>
				<td>${frappe.datetime.str_to_user(row.creation)}</td>
				${section === "assigned"
					? `<td><button class="btn-complete" data-id="${row.request_id}">Mark Completed</button></td>`
					: ""}
			</tr>`;
		});

		html += "</tbody></table>";
		$("#requests-table").html(html);
	}

	// ✅ Mark as Completed
	$(document).on("click", ".btn-complete", function () {
		const request_id = $(this).data("id");
		frappe.call({
			method: "naman.naman.page.it_users.it_users.update_request_status",
			args: { request_id, new_status: "Completed" },
			callback: function (r) {
				frappe.msgprint(r.message.message);
				loadSection("assigned");
			}
		});
	});
};
