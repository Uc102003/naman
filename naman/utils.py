import frappe
from frappe.utils import add_to_date, now_datetime
 
def update_status_after_period():
    # find documents in Draft older than 48 hours
    time_limit = add_to_date(now_datetime(), minutes=-5)
 
    records = frappe.get_all(
        "Request Management",
        filters={
            "status": "Draft",
            "creation": ("<", time_limit)
        },
        pluck="name"
    )
    print(f"The time_limit is {time_limit} and found {len(records)} records to update.")
    for docname in records:
        doc = frappe.get_doc("Request Management", docname)
        doc.status = "Pending"
        doc.save(ignore_permissions=True)
        doc.db_set("status", "Pending")
        frappe.db.commit()   # commit each update
        print(f"Found {doc.name} and creation date is {doc.creation}.")
 