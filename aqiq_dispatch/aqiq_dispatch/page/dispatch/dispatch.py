import frappe
from frappe import _
from datetime import datetime, timedelta

@frappe.whitelist()
def update_dispatch_status(delivery_note):
    try:
        doc = frappe.get_doc("Delivery Note", delivery_note)
        
        if doc.docstatus != 1:
            return {
                'success': False,
                'message': _("Delivery Note must be submitted first")
            }
            
        if doc.custom_dispatch_status == "Dispatched":
            # Format the dispatch time nicely
            dispatch_time = frappe.utils.format_datetime(doc.custom_dispatch_time, "medium")
            return {
                'success': False,
                'message': _("Delivery Note was already dispatched on {0} by {1}").format(
                    dispatch_time,
                    doc.custom_dispatched_by
                )
            }

        # Update dispatch status without modifying the document
        frappe.db.set_value(
            "Delivery Note", 
            delivery_note,
            {
                "custom_dispatch_status": "Dispatched",
                "custom_dispatch_time": frappe.utils.now(),
                "custom_dispatched_by": frappe.session.user
            },
            update_modified=False
        )
        
        frappe.db.commit()

        # Get updated values for response
        updated_doc = frappe.get_doc("Delivery Note", delivery_note)
        
        return {
            'success': True,
            'delivery_note': updated_doc.name,
            'status': updated_doc.custom_dispatch_status,
            'dispatch_time': frappe.utils.format_datetime(updated_doc.custom_dispatch_time, "medium"),
            'dispatched_by': updated_doc.custom_dispatched_by,
            'message': _("Delivery Note dispatched successfully")
        }
            
    except Exception as e:
        frappe.log_error(f"Error updating dispatch status: {str(e)}")
        return {
            'success': False,
            'message': str(e)
        }

@frappe.whitelist()
def get_recent_dispatches():
    """Get dispatches from last 24 hours"""
    dispatches = frappe.get_all(
        "Delivery Note",
        filters={
            "custom_dispatch_time": [">=", datetime.now() - timedelta(days=1)]
        },
        fields=[
            "name",
            "custom_dispatch_status",
            "custom_dispatch_time",
            "custom_dispatched_by"
        ],
        order_by="custom_dispatch_time desc",
        limit=20
    )
    
    return [[
        d.name,
        d.custom_dispatch_status,
        frappe.utils.format_datetime(d.custom_dispatch_time, "medium"),
        d.custom_dispatched_by
    ] for d in dispatches] 