frappe.pages['dispatch'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Dispatch',
		single_column: true
	});

	// Initialize the dispatch page
	new DispatchManager(page);
}

class DispatchManager {
	constructor(page) {
		this.page = page;
		this.setup_page();
		this.check_url_params();
	}

	setup_page() {
		this.make();
		this.setup_actions();
	}

	make() {
		this.body = $(`
			<div class="dispatch-container">
				<div class="scan-section">
					<div class="scan-box">
						<div class="scan-animation"></div>
						<div id="dispatch-status"></div>
						<div class="scan-options">
							<button class="btn btn-primary btn-scan" id="scan-button">
								<svg class="icon icon-lg">
									<use href="#icon-scan"></use>
								</svg>
								${__('Scan QR Code')}
							</button>
							<div class="or-divider">${__('OR')}</div>
							<div class="manual-input">
								<div class="input-group">
									<input type="text" 
										class="form-control"
										placeholder="${__('Enter Delivery Note ID')}"
										id="delivery-note-input">
									<button class="btn btn-primary" id="process-button">
										${__('Process')}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="recent-dispatches">
					<div class="dispatch-history"></div>
				</div>
			</div>
		`).appendTo(this.page.main);

		this.setup_dispatch_history();
		this.bind_events();
	}

	setup_actions() {
		this.page.add_action_icon("scan", () => this.show_scanner(), 
			"Scan QR Code", true);
	}

	bind_events() {
		$('#scan-button').on('click', () => this.show_scanner());
		$('#process-button').on('click', () => this.process_delivery_note());
		$('#delivery-note-input').on('keypress', (e) => {
			if (e.which === 13) this.process_delivery_note();
		});
	}

	async show_scanner() {
		const scanner = new frappe.ui.Scanner({
			dialog: true,
			multiple: false,
			on_scan: (data) => {
				const delivery_note = data.decodedText;
				this.process_delivery_note(delivery_note);
				scanner.dialog.hide();
			}
		});
	}

	handle_scan_result(data) {
		// Clean up the scanned data
		const delivery_note = data.trim();
		this.process_delivery_note(delivery_note);
	}

	async process_delivery_note(delivery_note) {
		delivery_note = delivery_note || $('#delivery-note-input').val();
		if (!delivery_note) {
			frappe.show_alert({
				message: __('Please enter a Delivery Note ID'),
				indicator: 'orange'
			});
			return;
		}

		try {
			const r = await frappe.call({
				method: 'aqiq_dispatch.aqiq_dispatch.page.dispatch.dispatch.update_dispatch_status',
				args: { delivery_note: delivery_note }
			});

			if (r.message && r.message.success) {
				this.show_success(delivery_note);
				$('#delivery-note-input').val('');
				this.refresh_dispatch_history();
			} else {
				frappe.show_alert({
					message: r.message.message || __('Error processing delivery note'),
					indicator: 'red'
				});
			}
		} catch (err) {
			frappe.show_alert({
				message: __('Error processing delivery note: {0}', [err.message]),
				indicator: 'red'
			});
		}
	}

	show_success(delivery_note) {
		// Clear any existing messages first
		$('#dispatch-status').empty();
		
		// Add the success message with enhanced styling
		$('#dispatch-status').html(`
			<div class="success-message-container">
				<div class="success-animation">
					<div class="success-checkmark">
						<i class="fa fa-check-circle"></i>
					</div>
					<div class="success-text">
						<div class="success-title">${__('Successfully Dispatched!')}</div>
						<div class="success-detail">
							${__('Delivery Note')}: <strong>${delivery_note}</strong>
						</div>
					</div>
				</div>
			</div>
		`);

		// Add the styling
		frappe.dom.set_style(`
			.success-message-container {
				background: var(--alert-bg-success);
				border: 1px solid var(--alert-border-success);
				border-radius: var(--border-radius-md);
				padding: 1.5rem;
				margin: 1rem 0;
				animation: slideDown 0.3s ease-out;
			}

			.success-animation {
				display: flex;
				align-items: center;
				gap: 1rem;
			}

			.success-checkmark {
				color: var(--alert-text-success);
				font-size: 2rem;
				animation: scaleCheck 0.5s ease-out;
			}

			.success-text {
				flex: 1;
			}

			.success-title {
				color: var(--alert-text-success);
				font-size: 1.1rem;
				font-weight: 600;
				margin-bottom: 0.3rem;
			}

			.success-detail {
				color: var(--text-muted);
				font-size: 0.9rem;
			}

			@keyframes slideDown {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			@keyframes scaleCheck {
				from {
					transform: scale(0);
				}
				to {
					transform: scale(1);
				}
			}
		`);

		// Remove the message after 10 seconds (10000ms)
		setTimeout(() => {
			$('#dispatch-status').fadeOut('slow', function() {
				$(this).empty().show();
			});
		}, 10000);  // Increased to 10 seconds
	}

	setup_dispatch_history() {
		this.dispatch_history = new frappe.DataTable(
			this.body.find('.dispatch-history')[0], {
				columns: [
					{ name: 'Delivery Note', width: 200 },
					{ name: 'Status', width: 120 },
					{ name: 'Dispatch Time', width: 160 },
					{ name: 'Dispatched By', width: 160 }
				],
				data: [],
				layout: 'fluid'
			}
		);

		this.refresh_dispatch_history();
	}

	async refresh_dispatch_history() {
		const r = await frappe.call({
			method: 'aqiq_dispatch.aqiq_dispatch.page.dispatch.dispatch.get_recent_dispatches'
		});

		if (r.message) {
			this.dispatch_history.refresh(r.message);
		}
	}

	handle_scanner_error(err) {
		console.error('Scanner Error:', err);
		frappe.show_alert({
			message: __('Error during scanning. Please try again or use manual entry.'),
			indicator: 'red'
		});
	}

	get_camera_instructions() {
		const browser = this.detect_browser();
		let instructions = '';

		switch (browser) {
			case 'chrome':
				instructions = `
					<p>To enable camera access in Chrome:</p>
					<ol>
						<li>Click the camera icon in the address bar</li>
						<li>Select "Always allow"</li>
						<li>Click "Done"</li>
						<li>Refresh the page</li>
					</ol>
				`;
				break;
			case 'firefox':
				instructions = `
					<p>To enable camera access in Firefox:</p>
					<ol>
						<li>Click the camera icon in the address bar</li>
						<li>Click "Allow and Remember"</li>
						<li>Refresh the page</li>
					</ol>
				`;
				break;
			case 'safari':
				instructions = `
					<p>To enable camera access in Safari:</p>
					<ol>
						<li>Open Safari Preferences</li>
						<li>Go to Websites > Camera</li>
						<li>Find this website and select "Allow"</li>
						<li>Refresh the page</li>
					</ol>
				`;
				break;
			default:
				instructions = `
					<p>To enable camera access:</p>
					<ol>
						<li>Look for camera permissions in your browser settings</li>
						<li>Allow camera access for this website</li>
						<li>Refresh the page</li>
					</ol>
				`;
		}

		return instructions;
	}

	detect_browser() {
		const userAgent = navigator.userAgent.toLowerCase();
		
		if (userAgent.includes('chrome')) return 'chrome';
		if (userAgent.includes('firefox')) return 'firefox';
		if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
		return 'other';
	}

	check_url_params() {
		const urlParams = new URLSearchParams(window.location.search);
		const delivery_note = urlParams.get('delivery_note');
		
		if (delivery_note) {
			// Auto-process the delivery note from QR code
			this.process_delivery_note(delivery_note);
			// Clear URL parameters after processing
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}
}

// Add page styling
frappe.dom.set_style(`
	.dispatch-container {
		padding: 2rem;
		background: var(--fg-color);
		min-height: calc(100vh - 140px);
	}

	.scan-section {
		max-width: 600px;
		margin: 0 auto;
		padding: 2.5rem;
		background: linear-gradient(145deg, var(--card-bg) 0%, var(--fg-color) 100%);
		border-radius: 20px;
		box-shadow: var(--card-shadow);
		position: relative;
		overflow: hidden;
	}

	.scan-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%);
	}

	.scan-box {
		position: relative;
		text-align: center;
		padding: 1rem;
	}

	.scan-animation {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--primary), transparent);
		animation: scan 2s ease-in-out infinite;
		opacity: 0.7;
	}

	.scan-options {
		margin-top: 3rem;
	}

	.btn-scan {
		padding: 1rem 2.5rem;
		font-size: 1.1rem;
		background: linear-gradient(145deg, var(--primary) 0%, var(--primary-dark) 100%);
		border: none;
		border-radius: 50px;
		color: white;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.2);
	}

	.btn-scan:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
	}

	.or-divider {
		margin: 2rem 0;
		display: flex;
		align-items: center;
		text-transform: uppercase;
		font-size: 0.8rem;
		color: var(--text-muted);
		letter-spacing: 1px;
	}

	.or-divider::before,
	.or-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border-color);
		margin: 0 1rem;
	}

	.manual-input {
		max-width: 400px;
		margin: 0 auto;
		position: relative;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
		background: var(--card-bg);
		padding: 0.5rem;
		border-radius: 12px;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.form-control {
		border-radius: 8px;
		border: 1px solid var(--border-color);
		padding: 0.8rem 1rem;
		transition: all 0.3s ease;
	}

	.form-control:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
	}

	#process-button {
		border-radius: 8px;
		padding: 0.8rem 1.5rem;
		background: var(--primary);
		color: white;
		border: none;
		transition: all 0.3s ease;
	}

	#process-button:hover {
		background: var(--primary-dark);
	}

	.success-animation {
		margin: 2rem 0;
		animation: slideDown 0.5s ease-out;
	}

	.success-checkmark {
		font-size: 3.5rem;
		color: var(--green-500);
		animation: scale-up 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
		margin-bottom: 1rem;
	}

	.success-message {
		color: var(--text-color);
		font-size: 1.2rem;
		font-weight: 500;
		opacity: 0;
		animation: fadeIn 0.5s ease-out forwards 0.2s;
	}

	.recent-dispatches {
		margin-top: 3rem;
		padding: 2rem;
		background: var(--card-bg);
		border-radius: 16px;
		box-shadow: var(--card-shadow);
	}

	@keyframes scan {
		0%, 100% {
			top: 0;
			opacity: 0;
		}
		50% {
			top: 100%;
			opacity: 1;
		}
	}

	@keyframes scale-up {
		from {
			transform: scale(0) rotate(-180deg);
		}
		to {
			transform: scale(1) rotate(0);
		}
	}

	@keyframes slideDown {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Dark mode enhancements */
	[data-theme="dark"] .scan-section {
		background: linear-gradient(145deg, var(--gray-900) 0%, var(--gray-800) 100%);
	}

	[data-theme="dark"] .input-group {
		background: var(--gray-900);
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.dispatch-container {
			padding: 1rem;
		}

		.scan-section {
			padding: 1.5rem;
			margin: 0.5rem;
		}

		.btn-scan {
			width: 100%;
			padding: 1rem;
		}

		.input-group {
			flex-direction: column;
		}

		#process-button {
			width: 100%;
		}
	}
`);