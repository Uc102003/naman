frappe.ui.form.on('Request Management', {
    refresh(frm) {
        // 🔹 Remove existing headers to prevent duplication
        frm.page.wrapper.find('.custom-req-header').remove();

        // 🔹 Create the fixed navbar/header
        const headerHTML = `
            <div class="custom-req-header fixed-top-navbar">
                <div class="navbar-content">
                    <h3>🌐 SANT NIRANKARI MISSION</h3>
                    <p>Welcome, manage your IT requests below.</p>
                    <div class="header-buttons">
                        <button class="btn btn-primary" id="new-request-btn">➕ Create New Request</button>
                        <button class="btn btn-secondary" id="view-requests-btn">📋 View All Requests</button>
                    </div>
                </div>
            </div>
        `;

        // 🔹 Add the header at the very top of the Doctype wrapper
        frm.page.wrapper.prepend(headerHTML);

        // 🔹 Add spacing to prevent overlap with fixed navbar
        frm.page.wrapper.find('.layout-main-section').css('margin-top', '130px');

        // 🔹 Button functionalities
        $('#new-request-btn').off('click').on('click', function () {
            frappe.new_doc('Request Management');
        });

        $('#view-requests-btn').off('click').on('click', function () {
            frappe.set_route('List', 'Request Management');
        });

        // 🔹 Page background and section styling
        $('.layout-main-section').css({
            'background': 'linear-gradient(to bottom right, #f7f9fc, #eaf0ff)',
            'padding': '15px',
            'border-radius': '10px'
        });

        $('.form-section, .form-dashboard').css({
            'background': 'white',
            'border-radius': '12px',
            'padding': '20px',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.08)',
            'margin-top': '15px'
        });

        // 🔹 Style the grid/table
        setTimeout(() => {
            const $grid = frm.fields_dict.request_item?.grid || null;
            if ($grid) {
                const $gridWrapper = $($grid.wrapper);

                // Table header
                $gridWrapper.find('.grid-heading-row').css({
                    'background': 'linear-gradient(90deg, #007bff, #0056b3)',
                    'color': 'white',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'border-radius': '8px 8px 0 0'
                });

                $gridWrapper.find('.grid-heading-row th').css({
                    'padding': '10px'
                });

                // Row hover effect
                $gridWrapper.find('.grid-row').css({
                    'transition': '0.2s ease',
                    'border-bottom': '1px solid #dee2e6'
                });

                $gridWrapper.find('.grid-row').hover(
                    function () { $(this).css('background', '#f1f5ff'); },
                    function () { $(this).css('background', 'white'); }
                );

                // Add Row button
                $gridWrapper.find('.grid-add-row').css({
                    'background': '#007bff',
                    'color': 'white',
                    'border-radius': '8px',
                    'font-weight': '600',
                    'padding': '6px 14px',
                    'margin-top': '8px'
                });
            }
        }, 600);
    }
});
