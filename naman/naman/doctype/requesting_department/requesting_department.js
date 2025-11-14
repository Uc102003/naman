// Copyright (c) 2025, Hidayatali and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Requesting Department", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Requesting Department', {
    onload: function(frm) {
        frm.set_query("incharge_name", function() {
            return {
                filters: {
                    enabled: 1,
                    user_type: "System User",
                    full_name: ["!=", "Administrator"]
                }
            };
        });
    },

    incharge_name: function(frm) {
        if (frm.doc.incharge_name) {
            frappe.db.get_value('User', frm.doc.incharge_name, ['name', 'mobile_no'])
                .then(function(r) {
                    //console.log("User record fetched:", r);  // This logs to the browser console
                    const user = r.message;
                    try {
                        if (user) {
                            // Ensure your fieldnames are correct here
                            frm.set_value('email', user.name); // Use actual fieldname
                            frm.set_value('mobile', user.mobile_no); // Use actual fieldname
                        }
                    } catch (e) {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("Error setting user details: {0}", [e.message])
                        });
                    }
                });
        }
    }
});
