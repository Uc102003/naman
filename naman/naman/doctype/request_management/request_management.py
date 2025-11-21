# Copyright (c) 2025
# For license information, please see license.txt

import frappe
import re
from frappe.model.document import Document
from frappe.utils.pdf import get_pdf
from frappe.utils import now


class RequestManagement(Document):

    # ================================================================
    # BEFORE INSERT
    # ================================================================
    def before_insert(self):
        if not self.status:
            self.status = "Draft"

        # For scheduler
        self.request_created_time = now()

        # Handle Guest user
        if frappe.session.user == "Guest":
            if not getattr(self, "email", None):
                self.email = "guest@noreply.com"

    # ================================================================
    # AFTER INSERT
    # ================================================================
    def after_insert(self):
        if self.docstatus == 0 and self.status == "Draft":
            self.notify_requester_draft()

    # ================================================================
    # ON SUBMIT
    # ================================================================
    def on_submit(self):
        frappe.log_error(message="on_submit triggered", title="On Submit Debug")
        try:
            self.notify_incharge()
        except Exception as e:
            frappe.log_error(message=f"notify_incharge failed: {e}", title="Notify Incharge Error")

    # ================================================================
    # ON CANCEL
    # ================================================================
    def on_cancel(self):
        self.status = "Rejected"
        self.notify_rejected()

    # ================================================================
    # SAFE SENDMAIL WRAPPER
    # ================================================================
    def _safe_sendmail(self, recipients, subject, message, attachments=None):
        if not recipients:
            return

        try:
            frappe.sendmail(
                recipients=recipients,
                subject=subject,
                message=message,
                attachments=attachments
            )
        except Exception as e:
            frappe.errprint(f"[Email Error] {e}")

    # ================================================================
    # REQUESTER EMAILS
    # ================================================================
    def notify_requester_draft(self):
        if getattr(self, "email", None):
            self._safe_sendmail(
                [self.email],
                "Request Received (Draft)",
                f"""
                Hello,<br>
                Your request <b>{self.name}</b> has been created as Draft.<br>
                It will auto-submit after 48 hours.
                """
            )

    def notify_requester(self):
        if getattr(self, "email", None):
            self._safe_sendmail(
                [self.email],
                "Request Approved",
                f"Your request (ID: {self.name}) has been approved."
            )

    def notify_rejected(self):
        if getattr(self, "email", None):
            self._safe_sendmail(
                [self.email],
                "Request Rejected",
                f"Your request (ID: {self.name}) has been rejected."
            )

    # ================================================================
    # INCHARGE EMAIL
    # ================================================================
    def notify_incharge(self):
        incharge_email = getattr(self, "incharge_email", None)

        if not incharge_email:
            frappe.errprint("[DEBUG] No incharge email assigned.")
            return

        doc_url = frappe.utils.get_url(f"/app/request-management/{self.name}")

        html = f"""
        <div>
            <h3>New Request Submitted</h3>
            <p>Dear {self.incharge_name},</p>
            <p>A new request (ID: {self.name}) has been submitted by {self.requested_by_name}.</p>
            <p><a href="{doc_url}">Open Request</a></p>
        </div>
        """

        attachments = None
        try:
            pdf = get_pdf(frappe.get_print("Request Management", self.name, print_format="RM"))
            attachments = [{"fname": f"{self.name}_RM.pdf", "fcontent": pdf}]
        except Exception as e:
            frappe.errprint(f"[DEBUG] PDF creation failed: {e}")

        self._safe_sendmail([incharge_email], "New Request Submitted", html, attachments)


# ===================================================================
# HELPER: CLEAN ROLE NAMES
# ===================================================================
def clean_role(role):
    return re.sub(r'[^\x20-\x7E]', '', role).strip().lower()


# ===================================================================
# FIXED: RETURN REAL EMAILS OF USERS WITH THE ROLE
# ===================================================================
def get_users_by_role(role_name="IT Users"):
    user_rows = frappe.get_all(
        "Has Role",
        filters={"role": role_name},
        fields=["parent as user"]
    )

    final_emails = []

    for row in user_rows:
        username = row.user

        # Skip invalid entries
        if not username or username.startswith("\u2060"):
            continue

        # Get actual email from User
        email = frappe.db.get_value("User", username, "email")

        if email and "@" in email:
            final_emails.append(email)

    frappe.errprint(f"[DEBUG] IT emails resolved: {final_emails}")
    return final_emails


# ===================================================================
# FIXED IT TEAM NOTIFICATION
# ===================================================================
def notify_it_item_Custom(doc):
    it_users_email = get_users_by_role("IT Users")

    frappe.errprint(f"[DEBUG] Final IT email list: {it_users_email}")

    if not it_users_email:
        frappe.errprint("[DEBUG] No IT users found. Skipping IT mail.")
        return

    doc_url = frappe.utils.get_url(f"/app/request-management/{doc.name}")

    html = f"""
    <div>
        <h3>Request Forwarded to IT</h3>
        <p>Dear IT Team,</p>
        <p>Request (ID: {doc.name}) has been approved by {doc.incharge_name}.</p>
        <p><a href="{doc_url}">View Request</a></p>
    </div>
    """

    attachments = None
    try:
        pdf = get_pdf(frappe.get_print("Request Management", doc.name, print_format="RM"))
        attachments = [{"fname": f"{doc.name}_RM.pdf", "fcontent": pdf}]
    except Exception as e:
        frappe.errprint(f"[DEBUG] PDF generation failed: {e}")

    try:
        frappe.sendmail(
            recipients=it_users_email,
            subject="Request Approved → Forwarded to IT",
            message=html,
            attachments=attachments
        )
        frappe.errprint("[DEBUG] IT email sent.")
    except Exception as e:
        frappe.errprint(f"[DEBUG] Failed sending IT email: {e}")


# ===================================================================
# CUSTOM BUTTON: SUBMIT
# ===================================================================
@frappe.whitelist()
def submit_request(docname):
    doc = frappe.get_doc("Request Management", docname)

    if doc.docstatus != 0:
        frappe.throw("Request can only be submitted from Draft.")

    doc.status = "Pending"
    doc.save(ignore_permissions=True)
    doc.submit()
    frappe.db.commit()

    return {"status": "success", "message": "Request submitted successfully"}


# ===================================================================
# CUSTOM BUTTON: APPROVE
# ===================================================================
@frappe.whitelist()
def approve_request(docname, remark):
    try:
        doc = frappe.get_doc("Request Management", docname)

        if doc.status != "Pending":
            frappe.throw("Request can only be approved from Pending state.")

        # Insert Workflow Action
        frappe.get_doc({
            "doctype": "Workflow Action",
            "reference_doctype": "Request Management",
            "reference_name": docname,
            "workflow_state": "Approved"
        }).insert(ignore_permissions=True)

        # Add comment
        frappe.get_doc({
            "doctype": "Comment",
            "comment_type": "Comment",
            "reference_doctype": doc.doctype,
            "reference_name": doc.name,
            "content": remark,
            "comment_by": frappe.session.user
        }).insert(ignore_permissions=True)

        # Update DB first
        frappe.db.set_value("Request Management", docname, "workflow_state", "Approved")
        frappe.db.set_value("Request Management", docname, "status", "Approved")
        frappe.db.commit()

        # Notify IT
        notify_it_item_Custom(doc)

        # Notify requester
        try:
            doc.notify_requester()
        except:
            pass

        return {"status": "success", "message": "Request approved successfully"}

    except Exception as e:
        frappe.log_error(f"Error approving request {docname}: {str(e)}")
        frappe.throw(f"Failed to approve request: {str(e)}")


# ===================================================================
# CUSTOM BUTTON: REJECT
# ===================================================================
@frappe.whitelist()
def reject_request(docname, remark):
    try:
        doc = frappe.get_doc("Request Management", docname)

        if doc.docstatus != 1:
            frappe.throw("Request must be submitted before it can be rejected.")

        # Workflow Action
        frappe.get_doc({
            "doctype": "Workflow Action",
            "reference_doctype": "Request Management",
            "reference_name": docname,
            "workflow_state": "Rejected"
        }).insert(ignore_permissions=True)

        # Comment
        frappe.get_doc({
            "doctype": "Comment",
            "comment_type": "Comment",
            "reference_doctype": doc.doctype,
            "reference_name": doc.name,
            "content": remark,
            "comment_by": frappe.session.user
        }).insert(ignore_permissions=True)

        # Update fields
        frappe.db.set_value("Request Management", docname, "workflow_state", "Rejected")
        frappe.db.set_value("Request Management", docname, "status", "Rejected")
        frappe.db.set_value("Request Management", docname, "docstatus", 2)
        frappe.db.commit()

        try:
            doc.notify_rejected()
        except:
            pass

        return {"status": "success", "message": "Request rejected"}

    except Exception as e:
        frappe.log_error(f"Reject error {docname}: {str(e)}")
        frappe.throw(f"Reject failed: {str(e)}")
