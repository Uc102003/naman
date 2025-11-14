import frappe

@frappe.whitelist()
def get_received_requests():
    """Fetch requests that were approved by the incharge."""
    requests = frappe.get_all(
        "Request Management",
        filters={"status": "Approved"},
        fields=["name as request_id", "creation"],
        order_by="creation desc"
    )
    return requests


@frappe.whitelist()
def get_assigned_requests():
    """Fetch requests that are assigned to IT users (status = Assigned)."""
    requests = frappe.get_all(
        "Request Management",
        filters={"status": "Assigned"},
        fields=["name as request_id"        , "creation"],
        order_by="creation desc"
    )
    return requests


@frappe.whitelist()
def get_completed_requests():
    """Fetch requests that are marked as completed."""
    requests = frappe.get_all(
        "Request Management",
        filters={"status": "Completed"},
        fields=["name as request_id", "creation"],
        order_by="creation desc"
    )
    return requests


@frappe.whitelist()
def update_request_status(request_id, new_status):
    """Update the request status (Assigned ➜ Completed)."""
    if not request_id or not new_status:
        frappe.throw("Both Request ID and New Status are required.")
    
    doc = frappe.get_doc("Request Management", request_id)
    doc.status = new_status
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {"message": f"Request {request_id} updated to {new_status}"}
