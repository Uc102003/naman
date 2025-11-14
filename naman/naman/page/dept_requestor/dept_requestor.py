import frappe

@frappe.whitelist()
def get_dashboard_data():
    """Return dashboard summary counts from Request Management doctype."""
    total = frappe.db.count("Request Management")
    approved = frappe.db.count("Request Management", {"status": "Approved"})
    pending = frappe.db.count("Request Management", {"status": "Pending"})
    rejected = frappe.db.count("Request Management", {"status": "Rejected"})

    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected
    }


@frappe.whitelist()
def get_requests(status="all"):
    """
    Fetch request records from the Request Management doctype.

    Args:
        status (str): 'all', 'Approved', 'Pending', or 'Rejected'

    Returns:
        list: Array of dicts with request_id, status, creation
    """
    filters = {}
    if status.lower() != "all":
        filters["status"] = status

    # ✅ Query the Request Management doctype safely
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
def create_new_request(request_title=None, department=None, status="Pending"):
    """
    Creates a new record in Request Management doctype.

    Args:
        request_title (str): Title or short description of the request
        department (str): Requesting department
        status (str): Default 'Pending'

    Returns:
        dict: Created document info
    """
    if not request_title or not department:
        frappe.throw("Both Request Title and Department are required.")

    # ✅ Create new doc in Request Management
    doc = frappe.get_doc({
        "doctype": "Request Management",
        "request_title": request_title,
        "department": department,
        "status": status
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"message": "Request created successfully", "request_id": doc.name}
