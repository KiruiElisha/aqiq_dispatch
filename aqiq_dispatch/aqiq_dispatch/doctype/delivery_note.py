import frappe
from frappe import _

def validate(doc, method):
    """Validate dispatch status"""
    if doc.docstatus == 0:  # Only for draft
        doc.custom_dispatch_status = "Pending"
        doc.custom_dispatch_time = None
        doc.custom_dispatched_by = None

def on_submit(doc, method):
    """Set initial dispatch status on submit"""
    doc.custom_dispatch_status = "Pending"
    doc.db_set('custom_dispatch_status', 'Pending')

def has_permission(doc, ptype, user):
    """Additional permission checks"""
    if ptype == "write" and doc.docstatus == 1:
        # Allow updating dispatch status even after submit
        return True
    return False 