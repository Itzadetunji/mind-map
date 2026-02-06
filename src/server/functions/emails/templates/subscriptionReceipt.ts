export interface SubscriptionReceiptTemplateProps {
	name?: string | null;
	planName: string;
	amount: number;
	currency: string;
	intervalLabel: string;
	startedAt: string;
	nextBillingDate?: string | null;
	subscriptionId: string;
}

const formatCurrency = (amount: number, currency: string) => {
	const safeAmount = Number.isFinite(amount) ? amount : 0;
	const safeCurrency = currency ? currency.toUpperCase() : "USD";

	try {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: safeCurrency,
		}).format(safeAmount);
	} catch {
		return `${safeCurrency} ${(safeAmount).toFixed(2)}`;
	}
};

const formatDate = (dateValue?: string | null) => {
	if (!dateValue) return "-";
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export const subscriptionReceiptTemplate = (
	props: SubscriptionReceiptTemplateProps,
) => {
	const amountText = formatCurrency(props.amount, props.currency);
	const startedAtText = formatDate(props.startedAt);
	const nextBillingText = formatDate(props.nextBillingDate);
	const customerName = props.name?.trim() || "there";

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
		<title>Subscription Receipt</title>
		<style>
			body {
				margin: 0;
				padding: 0;
				font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
				background-color: #f5f7fb;
				color: #0f172a;
			}
			.container {
				max-width: 600px;
				margin: 0 auto;
				background: #ffffff;
				border-radius: 16px;
				overflow: hidden;
				box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
			}
			.header {
				padding: 24px 32px;
				background: linear-gradient(135deg, #0077b6, #023e8a);
				color: #ffffff;
			}
			.header h1 {
				margin: 0;
				font-size: 22px;
				font-weight: 700;
			}
			.content {
				padding: 28px 32px;
			}
			.content h2 {
				margin: 0 0 12px;
				font-size: 20px;
				font-weight: 600;
			}
			.receipt {
				background: #f8fafc;
				border-radius: 12px;
				padding: 16px;
				border: 1px solid #e2e8f0;
				margin-top: 16px;
			}
			.row {
				display: flex;
				justify-content: space-between;
				padding: 6px 0;
				font-size: 14px;
				color: #475569;
			}
			.row strong {
				color: #0f172a;
			}
			.footer {
				padding: 18px 32px 28px;
				font-size: 13px;
				color: #64748b;
			}
		</style>
	</head>
	<body>
		<div style="padding: 32px 16px;">
			<div class="container">
				<div class="header">
					<h1>Protomap Subscription Receipt</h1>
				</div>
				<div class="content">
					<h2>Thanks, ${customerName}!</h2>
					<p>Your ${props.planName} subscription is now active. Here is your receipt:</p>
					<div class="receipt">
						<div class="row">
							<span>Plan</span>
							<strong>${props.planName}</strong>
						</div>
						<div class="row">
							<span>Amount</span>
							<strong>${amountText}</strong>
						</div>
						<div class="row">
							<span>Billing</span>
							<strong>${props.intervalLabel}</strong>
						</div>
						<div class="row">
							<span>Started</span>
							<strong>${startedAtText}</strong>
						</div>
						<div class="row">
							<span>Next billing</span>
							<strong>${nextBillingText}</strong>
						</div>
						<div class="row">
							<span>Subscription ID</span>
							<strong>${props.subscriptionId}</strong>
						</div>
					</div>
				</div>
				<div class="footer">
					Need help? Reply to this email and we will assist you.
				</div>
			</div>
		</div>
	</body>
</html>`;
};
