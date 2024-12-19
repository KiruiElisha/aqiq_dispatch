frappe.ui.form.on('Quotation', {
    custom_warehouse: function(frm) {
        if (!frm.doc.custom_warehouse) return;
        
        // Update warehouse for all items
        frm.doc.items.forEach(item => {
            frappe.model.set_value(item.doctype, item.name, 'warehouse', frm.doc.custom_warehouse);
        });
        
        // Refresh the items table
        frm.refresh_field('items');
        
        // Show a notification
        frappe.show_alert({
            message: __('Warehouse updated for all items'),
            indicator: 'green'
        }, 3);
    }
}); 