import frappe

@frappe.whitelist()
def get_requests(status="All"):
    """
    Fetch minimal request info for incharge view.
    """
    filters = {}
    if status and status.lower() != "all":
        filters["status"] = status

    requests = frappe.get_all(
        "Request Management",
        filters=filters,
        fields=[
            "name as request_id",
            "status",
            "creation"
        ],
        order_by="creation desc"
    )
    return requests


@frappe.whitelist()
def update_request_status(request_id, status):
    """
    Approve or Reject a request.
    """
    if not request_id or not status:
        frappe.throw("Both request_id and status are required.")

    # Get the document safely
    doc = frappe.get_doc("Request Management", request_id)
    
    # Update status
    doc.status = status
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    # Return confirmation
    return {"message": f"Request {request_id} updated to {status}"}
