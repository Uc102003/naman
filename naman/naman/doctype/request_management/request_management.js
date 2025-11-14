// Copyright (c) 2025, Hidayatali and contributors
// For license information, please see license.txt


frappe.ui.form.on("Request Management", {
    refresh(frm) {
        // Only run for new records and if fields are empty
        if (frm.is_new()) {
            frappe.db.get_value("User", frappe.session.user, ["name", "mobile_no", "full_name"])
                .then(response => {
                    try {
                        const user = response.message;
                        if (user) {
                            if (frm.doc.email == null && user.name) {
                                frm.set_value("requested_by_name", user.full_name);
                            }
                            if (frm.doc.mobile_no == null && user.mobile_no) {
                                frm.set_value("mobile", user.mobile_no);
                            }
                            if (frm.doc.full_name == null && user.full_name) {
                                frm.set_value("email", user.name);
                            }
                        } else {
                            frappe.msgprint({
                                title: __("Warning"),
                                indicator: "orange",
                                message: __("No details found for user: {0}", [frappe.session.user])
                            });
                        }
                    } catch (e) {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("Error setting user details: {0}", [e.message])
                        });
                    }
                })
                .catch(err => {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to fetch user details: {0}", [err.message])
                    });
                });
        }
    }
});

frappe.ui.form.on('Request Management', {
    refresh: function(frm) {
        frm.page.hide_menu();
        // Hide the print button for all users
        $(`[data-original-title="${__("Print")}"]`).hide(); 
        $(".layout-side-section").hide();
        
        // Check if the document is new or in Draft state
        if (frm.doc.docstatus == 0) {
            frm.add_custom_button(('Submit'), function() {
                frappe.confirm('Are you sure you want to submit this request?', function() {
                    frappe.call({
                        method: 'naman.naman.doctype.request_management.request_management.submit_request',
                        args: {
                            docname: frm.doc.name
                        },
                        callback: function(r) {
                            if (r.message && r.message.status === 'success') {
                                frappe.msgprint(__('Request submitted successfully'));
                                frm.reload_doc();
                            }
                        },
                        error: function(r) {
                            frappe.msgprint({
                                title: __('Error'),
                                indicator: 'red',
                                message: __('Failed to submit request: ') + (r.exc || 'Unknown error')
                            });
                        }
                    });
                });
            });
        } 
        else if (frm.doc.docstatus === 1 && frm.doc.status != "Approved" && frappe.user.has_role("\u2060Dept Incharge")) {
            // Add Approve button
            frm.add_custom_button(('Approve'), function() {
                frappe.prompt(
                    [
                        {
                            fieldname: 'remark',
                            fieldtype: 'Small Text',
                            label: __('Remark'),
                            reqd: 1
                        }
                    ],
                    function(values) {
                        frappe.confirm('Are you sure you want to approve this request?', function() {
                            frappe.call({
                                method: 'naman.naman.doctype.request_management.request_management.approve_request',
                                args: {
                                    docname: frm.doc.name,
                                    remark: values.remark
                                },
                                callback: function(r) {
                                    if (r.message && r.message.status === 'success') {
                                        frappe.msgprint(__('Request approved successfully'));
                                        frm.reload_doc();
                                    }
                                },
                                error: function(r) {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        indicator: 'red',
                                        message: __('Failed to approve request: ') + (r.exc || 'Unknown error')
                                    });
                                }
                            });
                        });
                    },
                    __('Enter Remark'),
                    __('Submit')
                );
            });

            // Add Reject button
            frm.add_custom_button(('Reject'), function() {
                frappe.prompt(
                    [
                        {
                            fieldname: 'remark',
                            fieldtype: 'Small Text',
                            label: __('Remark'),
                            reqd: 1
                        }
                    ],
                    function(values) {
                        frappe.confirm('Are you sure you want to reject this request?', function() {
                            frappe.call({
                                method: 'naman.naman.doctype.request_management.request_management.reject_request',
                                args: {
                                    docname: frm.doc.name,
                                    remark: values.remark
                                },
                                callback: function(r) {
                                    if (r.message && r.message.status === 'success') {
                                        frappe.msgprint(__('Request Rejected Successfully'));
                                        frm.reload_doc();
                                    }
                                },
                                error: function(r) {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        indicator: 'red',
                                        message: __('Failed to reject request: ') + (r.exc || 'Unknown error')
                                    });
                                }
                            });
                        });
                    },
                    __('Enter Remark'),
                    __('Submit')
                );
            });
        } 
        else if (frm.doc.docstatus === 1 && frm.doc.status == "Approved") {
            // Add Reject button
            frm.add_custom_button(('Reject'), function() {
                frappe.prompt(
                    [
                        {
                            fieldname: 'remark',
                            fieldtype: 'Small Text',
                            label: __('Remark'),
                            reqd: 1 // Makes the remark field mandatory
                        }
                    ],
                    function(values) {
                        frappe.confirm('Are you sure you want to reject this request?', function() {
                            frappe.call({
                                method: 'naman.naman.doctype.request_management.request_management.reject_request',
                                args: {
                                    docname: frm.doc.name,
                                    remark: values.remark
                                },
                                callback: function(r) {
                                    if (r.message && r.message.status === 'success') {
                                        frappe.msgprint(__('Request rejected successfully'));
                                        frm.reload_doc();
                                    }
                                },
                                error: function(r) {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        indicator: 'red',
                                        message: __('Failed to reject request: ') + (r.exc || 'Unknown error')
                                    });
                                }
                            });
                        });
                    },
                    __('Enter Remark'),
                    __('Submit')
                );
            });
        }
    },
    status: function(frm) {
        if (frm.is_dirty() || frm.doc.__islocal) return;
        frm.trigger('refresh');
    }
});

frappe.ui.form.on('Request Item', {
    from_date: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.from_date) {
            
            if (frappe.datetime.str_to_obj(row.from_date) < frappe.datetime.str_to_obj(frappe.datetime.get_today())){
                frappe.msgprint(__('From Date cannot be earlier than current Date'));
                frappe.model.set_value(cdt, cdn, 'from_date', null);
            }
        }
    },
    to_date: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.to_date && row.from_date) {
            if (row.to_date < row.from_date) {
                frappe.msgprint(__('To Date cannot be earlier than From Date'));
                frappe.model.set_value(cdt, cdn, 'to_date', null);
            }
        }
    },
    qty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.qty > 100) {
            frappe.msgprint(__('Quantity cannot exceed 100'));
            frappe.model.set_value(cdt, cdn, 'qty', null);
        }
    },
    remark: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.remark && row.remark.length > 1000) {
            frappe.msgprint(__('Remark cannot exceed 1000 characters'));
            frappe.model.set_value(cdt, cdn, 'remark', row.remark.substring(0, 1000));
        }
    }
}); 