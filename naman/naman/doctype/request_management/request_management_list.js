// Copyright (c) 2025, Hidayatali and contributors
// For license information, please see license.txt

frappe.listview_settings['Request Management'] = {
    setup: function(listview) {
        $(".layout-side-section").hide();
    },
    refresh: function(listview) {
        $(".layout-side-section").hide();
    }
};