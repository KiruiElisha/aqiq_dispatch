app_name = "aqiq_dispatch"
app_title = "AQIQ Dispatch"
app_publisher = "elisha@aqiqsolutions.com"
app_description = "Updates delivery Note with Status"
app_email = "elisha@aqiqsolutions.com"
app_license = "mit"

# Fixtures
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    "Delivery Note-custom_dispatch_status",
                    "Delivery Note-custom_dispatch_time",
                    "Delivery Note-custom_dispatched_by",
                    "Quotation-custom_warehouse"
                ]
            ]
        ]
    },
    {
        "doctype": "Property Setter",
        "filters": [
            [
                "doc_type",
                "in",
                ["Delivery Note", "Quotation"]
            ]
        ]
    }
]

# Custom fields to be created
custom_fields = {
    "Delivery Note": [
        {
            "fieldname": "custom_dispatch_status",
            "fieldtype": "Select",
            "label": "Dispatch Status",
            "options": "\nPending\nDispatched",
            "default": "Pending",
            "insert_after": "status",
            "translatable": 0,
            "bold": 1
        },
        {
            "fieldname": "custom_dispatch_time",
            "fieldtype": "Datetime",
            "label": "Dispatch Time",
            "insert_after": "custom_dispatch_status",
            "read_only": 1,
            "allow_on_submit": 1,
            "translatable": 0
        },
        {
            "fieldname": "custom_dispatched_by",
            "fieldtype": "Link",
            "label": "Dispatched By",
            "options": "User",
            "insert_after": "custom_dispatch_time",
            "read_only": 1,
            "allow_on_submit": 1,
            "translatable": 0
        }
    ],
    "Quotation": [
        {
            "fieldname": "custom_warehouse",
            "fieldtype": "Link",
            "label": "Warehouse",
            "options": "Warehouse",
            "insert_after": "order_type",
            "translatable": 0
        }
    ]
}

# DocType JS
doctype_js = {
    "Quotation": "public/js/quotation.js"
}

# Permissions for roles
has_permission = {
    "Delivery Note": "aqiq_dispatch.aqiq_dispatch.doctype.delivery_note.has_permission"
}

