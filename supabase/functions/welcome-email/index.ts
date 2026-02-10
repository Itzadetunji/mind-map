import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend@6.9.1";

type AuthUserRecord = {
  id: string;
  email: string | null;
  raw_user_meta_data?: {
    full_name?: string;
    [name: string]: unknown;
  };
  user_metadata?: {
    full_name?: string;
    [name: string]: unknown;
  };
  [name: string]: unknown;
};

type HookPayload = {
  record?: AuthUserRecord | null;
  new?: AuthUserRecord | null;
  user?: AuthUserRecord | null;
  [name: string]: unknown;
};

const RESEND_API_KEY = Deno.env.get("PROTOMAP_RESEND_API_KEY") ?? "";
const FROM_EMAIL = "ProtoMap <hello@protomap.art>";
const SUBJECT =  "Welcome to ProtoMap!";

const resend = new Resend(RESEND_API_KEY);

const extractRecord = (payload: HookPayload): AuthUserRecord | null => {
  if (payload && typeof payload === "object") {
    const direct = payload as AuthUserRecord;
    if (direct.id && direct.email) {
      return direct;
    }
  }

  return (
    (payload.record as AuthUserRecord | null) ??
    (payload.new as AuthUserRecord | null) ??
    (payload.user as AuthUserRecord | null) ??
    null
  );
};

const getFirstName = (record: AuthUserRecord): string => {
  const fullName =
    record.raw_user_meta_data?.full_name ??
    record.user_metadata?.full_name ??
    "";

  const normalized = fullName.trim();
  if (!normalized) {
    return "there";
  }

  return normalized.split(/\s+/)[0];
};

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: HookPayload;
  try {
    payload = (await req.json()) as HookPayload;
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  const record = extractRecord(payload);
  if (!record) {
    return new Response(
      JSON.stringify({ error: "Missing user record" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!record.email) {
    return new Response(
      JSON.stringify({ error: "Missing email", record: { id: record.id } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Resend API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const firstName = getFirstName(record);
  const html = template(firstName);
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: record.email,
      subject: SUBJECT,
      html,
    });

    return new Response(
      JSON.stringify({ ok: true, emailId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to send welcome email:", message);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


const template = (firstName:string) => `          
<!doctype html>
<html
	xmlns:v="urn:schemas-microsoft-com:vml"
	xmlns:o="urn:schemas-microsoft-com:office:office"
>
	<head>
		<meta charset="UTF-8" />
		<meta
			http-equiv="Content-Type"
			content="text/html; charset=utf-8"
		/>
		<!--[if !mso]><!-- -->
		<meta
			http-equiv="X-UA-Compatible"
			content="IE=edge"
		/>
		<!--<![endif]-->
		<meta
			name="viewport"
			content="width=device-width, initial-scale=1.0"
		/>
		<meta
			name="format-detection"
			content="telephone=no, date=no, address=no, email=no"
		/>
		<meta name="x-apple-disable-message-reformatting" />
		<title>Welcome Email</title>
		<!-- Made with Postcards Email Builder by Designmodo -->
		<style>
			html,
			body {
				margin: 0 !important;
				padding: 0 !important;
				min-height: 100% !important;
				width: 100% !important;
				-webkit-font-smoothing: antialiased;
			}
			* {
				-ms-text-size-adjust: 100%;
			}
			#outlook a {
				padding: 0;
			}
			.ReadMsgBody,
			.ExternalClass {
				width: 100%;
			}
			.ExternalClass,
			.ExternalClass p,
			.ExternalClass td,
			.ExternalClass div,
			.ExternalClass span,
			.ExternalClass font {
				line-height: 100%;
			}
			table,
			td,
			th {
				mso-table-lspace: 0 !important;
				mso-table-rspace: 0 !important;
				border-collapse: collapse;
			}
			u + .body table,
			u + .body td,
			u + .body th {
				will-change: transform;
			}
			body,
			td,
			th,
			p,
			div,
			li,
			a,
			span {
				-webkit-text-size-adjust: 100%;
				-ms-text-size-adjust: 100%;
				mso-line-height-rule: exactly;
			}
			img {
				border: 0;
				outline: 0;
				line-height: 100%;
				text-decoration: none;
				-ms-interpolation-mode: bicubic;
			}
			a[x-apple-data-detectors] {
				color: inherit !important;
				text-decoration: none !important;
			}
			.body .pc-project-body {
				background-color: transparent !important;
			}
			@media (min-width: 621px) {
				.pc-lg-hide {
					display: none;
				}
				.pc-lg-bg-img-hide {
					background-image: none !important;
				}
			}
		</style>
		<style>
			@media (max-width: 620px) {
				.pc-project-body {
					min-width: 0 !important;
				}
				.pc-project-container,
				.pc-component {
					width: 100% !important;
				}
				.pc-sm-bg-img-hide {
					background-image: none !important;
				}
				.pc-w620-itemsVSpacings-30 {
					padding-top: 15px !important;
					padding-bottom: 15px !important;
				}
				.pc-w620-itemsHSpacings-0 {
					padding-left: 0 !important;
					padding-right: 0 !important;
				}
				.pc-w620-itemsVSpacings-14 {
					padding-top: 7px !important;
					padding-bottom: 7px !important;
				}
				.pc-w620-padding-0-0-0-0 {
					padding: 0 !important;
				}
				.pc-w620-padding-0-0-24-0 {
					padding: 0 0 24px !important;
				}
				.pc-w620-padding-0-0-20-0 {
					padding: 0 0 20px !important;
				}
				.pc-w620-font-size-20px {
					font-size: 20px !important;
				}
				.pc-w620-font-size-14px {
					font-size: 14px !important;
				}
				.pc-w620-padding-32-25-32-25 {
					padding: 32px 25px !important;
				}
				table.pc-w620-spacing-0-0-0-0 {
					margin: 0 !important;
				}
				td.pc-w620-spacing-0-0-0-0,
				th.pc-w620-spacing-0-0-0-0 {
					margin: 0 !important;
					padding: 0 !important;
				}
				.pc-g-ib {
					display: inline-block !important;
				}
				.pc-g-b {
					display: block !important;
				}
				.pc-g-rb {
					display: block !important;
					width: auto !important;
				}
				.pc-g-wf {
					width: 100% !important;
				}
				.pc-g-rpt {
					padding-top: 0 !important;
				}
				.pc-g-rpr {
					padding-right: 0 !important;
				}
				.pc-g-rpb {
					padding-bottom: 0 !important;
				}
				.pc-g-rpl {
					padding-left: 0 !important;
				}
				.pc-sm-hide {
					display: none !important;
				}
			}
		</style>
		<!--[if mso
			]><style type="text/css">
				.pc-font-alt {
					font-family: Arial, Helvetica, sans-serif !important;
				}
			</style><!
		[endif]-->
		<!--[if gte mso 9
			]><xml
				><o:OfficeDocumentSettings
					><o:AllowPNG /><o:PixelsPerInch
						>96</o:PixelsPerInch
					></o:OfficeDocumentSettings
				></xml
			><!
		[endif]-->
	</head>
	<body
		class="body pc-font-alt"
		style="
			width: 100% !important;
			min-height: 100% !important;
			margin: 0 !important;
			padding: 0 !important;
			mso-line-height-rule: exactly;
			-webkit-font-smoothing: antialiased;
			-webkit-text-size-adjust: 100%;
			-ms-text-size-adjust: 100%;
			font-variant-ligatures: normal;
			text-rendering: optimizeLegibility;
			-moz-osx-font-smoothing: grayscale;
			background-color: #f4f4f4;
			font-feature-settings: &quot;calt&quot;;
		"
		bgcolor="#f4f4f4"
	>
		<table
			class="pc-project-body"
			style="
				table-layout: fixed;
				width: 100%;
				min-width: 600px;
				background-color: #f4f4f4;
			"
			bgcolor="#f4f4f4"
			border="0"
			cellspacing="0"
			cellpadding="0"
			role="presentation"
		>
			<tr>
				<td
					align="center"
					valign="top"
					style="width: auto"
				>
					<table
						class="pc-project-container"
						align="center"
						border="0"
						cellpadding="0"
						cellspacing="0"
						role="presentation"
					>
						<tr>
							<td
								style="padding: 20px 0"
								align="left"
								valign="top"
							>
								<table
									class="pc-component"
									style="width: 600px; max-width: 600px"
									width="600"
									align="center"
									border="0"
									cellspacing="0"
									cellpadding="0"
									role="presentation"
								>
									<tr>
										<td
											class="pc-w620-spacing-0-0-0-0"
											width="100%"
											border="0"
											cellspacing="0"
											cellpadding="0"
											role="presentation"
										>
											<table
												width="100%"
												align="center"
												border="0"
												cellspacing="0"
												cellpadding="0"
												role="presentation"
											>
												<tr>
													<td
														valign="top"
														class="pc-w620-padding-32-25-32-25"
														style="
															padding: 40px 20px;
															height: unset;
															background-color: #fff;
														"
														bgcolor="#ffffff"
													>
														<table
															style="
																border-collapse: separate;
																border-spacing: 0;
															"
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	style="padding: 0 0 32px"
																	valign="top"
																>
																	<table
																		class="pc-width-fill pc-g-b"
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tbody class="pc-g-b">
																			<tr class="pc-g-b pc-g-wf">
																				<td
																					class="pc-g-rb pc-g-rpt pc-g-rpb pc-g-wf pc-w620-itemsVSpacings-30"
																					align="left"
																					valign="top"
																					style="
																						width: 100%;
																						padding-top: 0;
																						padding-bottom: 0;
																					"
																				>
																					<table
																						style="width: 100%"
																						border="0"
																						cellpadding="0"
																						cellspacing="0"
																						role="presentation"
																					>
																						<tr>
																							<td
																								align="center"
																								valign="middle"
																							>
																								<table
																									width="100%"
																									border="0"
																									cellpadding="0"
																									cellspacing="0"
																									role="presentation"
																								>
																									<tr>
																										<td
																											align="center"
																											valign="top"
																										>
																											<table
																												align="center"
																												border="0"
																												cellpadding="0"
																												cellspacing="0"
																												role="presentation"
																											>
																												<tr>
																													<td
																														align="left"
																														style="
																															padding: 0 0 12px;
																														"
																													>
																														<table
																															align="left"
																															border="0"
																															cellpadding="0"
																															cellspacing="0"
																															role="presentation"
																														>
																															<tr>
																																<td
																																	style="
																																		width: unset;
																																	"
																																	valign="top"
																																>
																																	<table
																																		class="pc-width-hug pc-g-b"
																																		align="center"
																																		border="0"
																																		cellpadding="0"
																																		cellspacing="0"
																																		role="presentation"
																																	>
																																		<tbody
																																			class="pc-g-b"
																																		>
																																			<tr
																																				class="pc-g-b"
																																			>
																																				<td
																																					class="pc-g-rb pc-g-rpt pc-w620-itemsVSpacings-14"
																																					valign="middle"
																																					style="
																																						width: 50%;
																																						padding-top: 0;
																																						padding-bottom: 0;
																																					"
																																				>
																																					<table
																																						style="
																																							width: 100%;
																																						"
																																						border="0"
																																						cellpadding="0"
																																						cellspacing="0"
																																						role="presentation"
																																					>
																																						<tr>
																																							<td
																																								align="center"
																																								valign="middle"
																																							>
																																								<table
																																									width="100%"
																																									border="0"
																																									cellpadding="0"
																																									cellspacing="0"
																																									role="presentation"
																																								>
																																									<tr>
																																										<td
																																											align="center"
																																											valign="top"
																																											style="
																																												line-height: 1px;
																																												font-size: 1px;
																																											"
																																										>
																																											<table
																																												width="100%"
																																												border="0"
																																												cellpadding="0"
																																												cellspacing="0"
																																												role="presentation"
																																											>
																																												<tr>
																																													<td
																																														align="center"
																																														valign="top"
																																													>
																																														<a
																																															class="pc-font-alt"
																																															href="https://postcards.email/"
																																															target="_blank"
																																															style="
																																																text-decoration: none;
																																																display: inline-block;
																																																vertical-align: top;
																																															"
																																															><img
																																																src="https://cloudfilesdm.com/postcards/logo-white-27ca01f8.png"
																																																style="
																																																	display: block;
																																																	outline: 0;
																																																	line-height: 100%;
																																																	-ms-interpolation-mode: bicubic;
																																																	width: 32px;
																																																	height: 32px;
																																																	border: 0;
																																																"
																																																width="32"
																																																height="32"
																																																alt=""
																																														/></a>
																																													</td>
																																												</tr>
																																											</table>
																																										</td>
																																									</tr>
																																								</table>
																																							</td>
																																						</tr>
																																					</table>
																																				</td>
																																				<td
																																					class="pc-w620-itemsHSpacings-0"
																																					valign="middle"
																																					style="
																																						padding-right: 7px;
																																						padding-left: 7px;
																																					"
																																				></td>
																																				<td
																																					class="pc-g-rb pc-g-rpb pc-w620-itemsVSpacings-14"
																																					valign="middle"
																																					style="
																																						width: 50%;
																																						padding-top: 0;
																																						padding-bottom: 0;
																																					"
																																				>
																																					<table
																																						style="
																																							width: 100%;
																																						"
																																						border="0"
																																						cellpadding="0"
																																						cellspacing="0"
																																						role="presentation"
																																					>
																																						<tr>
																																							<td
																																								align="center"
																																								valign="middle"
																																							>
																																								<table
																																									width="100%"
																																									border="0"
																																									cellpadding="0"
																																									cellspacing="0"
																																									role="presentation"
																																								>
																																									<tr>
																																										<td
																																											align="center"
																																											valign="top"
																																										>
																																											<table
																																												border="0"
																																												cellpadding="0"
																																												cellspacing="0"
																																												role="presentation"
																																												align="center"
																																											>
																																												<tr>
																																													<td
																																														valign="top"
																																														align="center"
																																													>
																																														<div
																																															class="pc-font-alt"
																																															style="
																																																text-decoration: none;
																																															"
																																														>
																																															<div
																																																style="
																																																	font-size: 28px;
																																																	line-height: 131%;
																																																	text-align: left;
																																																	text-align-last: left;
																																																	color: #151617;
																																																	font-family:
																																																		&quot;Helvetica&quot;,
																																																		Arial,
																																																		serif;
																																																	letter-spacing: -0.2px;
																																																	font-style: normal;
																																																"
																																															>
																																																<div
																																																	style="
																																																		font-family:
																																																			&quot;Helvetica&quot;,
																																																			Arial,
																																																			serif;
																																																	"
																																																>
																																																	<span
																																																		style="
																																																			font-family:
																																																				&quot;Helvetica&quot;,
																																																				Arial,
																																																				serif;
																																																			font-size: 28px;
																																																			line-height: 131%;
																																																			font-weight: 400;
																																																		"
																																																		>Protomap</span
																																																	>
																																																</div>
																																															</div>
																																														</div>
																																													</td>
																																												</tr>
																																											</table>
																																										</td>
																																									</tr>
																																								</table>
																																							</td>
																																						</tr>
																																					</table>
																																				</td>
																																			</tr>
																																		</tbody>
																																	</table>
																																</td>
																															</tr>
																														</table>
																													</td>
																												</tr>
																											</table>
																										</td>
																									</tr>
																									<tr>
																										<td
																											align="center"
																											valign="top"
																										>
																											<table
																												width="100%"
																												align="center"
																												border="0"
																												cellpadding="0"
																												cellspacing="0"
																												role="presentation"
																											>
																												<tr>
																													<td valign="top">
																														<table
																															border="0"
																															cellpadding="0"
																															cellspacing="0"
																															role="presentation"
																															width="100%"
																															align="center"
																														>
																															<tr>
																																<td
																																	valign="top"
																																	align="center"
																																>
																																	<div
																																		class="pc-font-alt"
																																		style="
																																			text-decoration: none;
																																		"
																																	>
																																		<div
																																			style="
																																				font-size: 15px;
																																				line-height: 140%;
																																				text-align: center;
																																				text-align-last: center;
																																				color: #333;
																																				font-family:
																																					&quot;Helvetica&quot;,
																																					Arial,
																																					serif;
																																				font-style: normal;
																																				letter-spacing: -0.2px;
																																			"
																																		>
																																			<div
																																				style="
																																					font-family:
																																						&quot;Helvetica&quot;,
																																						Arial,
																																						serif;
																																				"
																																			>
																																				<span
																																					style="
																																						font-family:
																																							&quot;Helvetica&quot;,
																																							Arial,
																																							serif;
																																						font-weight: 400;
																																						font-size: 15px;
																																						line-height: 140%;
																																					"
																																					>Turn
																																					random
																																					ideas
																																					into
																																					clear
																																					app
																																					plans</span
																																				>
																																			</div>
																																		</div>
																																	</div>
																																</td>
																															</tr>
																														</table>
																													</td>
																												</tr>
																											</table>
																										</td>
																									</tr>
																								</table>
																							</td>
																						</tr>
																					</table>
																				</td>
																			</tr>
																		</tbody>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	style="padding: 0 0 48px"
																>
																	<table
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="
																					line-height: 1px;
																					font-size: 1px;
																					border-bottom: 1px solid #d9d9d9;
																				"
																			>
																				&nbsp;
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	align="left"
																>
																	<table
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																		width="100%"
																		align="left"
																	>
																		<tr>
																			<td
																				class="pc-w620-padding-0-0-0-0"
																				valign="top"
																				bgcolor="#FFFFFF"
																				style="
																					height: unset;
																					padding: 0 24px;
																					background-color: #fff;
																				"
																			>
																				<table
																					width="100%"
																					border="0"
																					cellpadding="0"
																					cellspacing="0"
																					role="presentation"
																				>
																					<tr>
																						<td>
																							<table
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										class="pc-w620-padding-0-0-24-0"
																										valign="top"
																										style="
																											height: unset;
																											padding: 0 0 32px;
																										"
																									>
																										<table
																											width="100%"
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																										>
																											<tr>
																												<td>
																													<table
																														border="0"
																														cellpadding="0"
																														cellspacing="0"
																														role="presentation"
																														width="100%"
																													>
																														<tr>
																															<td
																																valign="top"
																																class="pc-w620-padding-0-0-20-0"
																																align="left"
																																style="
																																	padding: 0 0
																																		24px;
																																	height: auto;
																																"
																															>
																																<div
																																	class="pc-font-alt"
																																	style="
																																		text-decoration: none;
																																	"
																																>
																																	<div
																																		class="pc-w620-font-size-20px"
																																		style="
																																			font-size: 24px;
																																			line-height: 140%;
																																			text-align: left;
																																			text-align-last: left;
																																			color: #151617;
																																			font-family:
																																				&quot;Helvetica&quot;,
																																				Arial,
																																				serif;
																																			font-style: normal;
																																			letter-spacing: -0.2px;
																																		"
																																	>
																																		<div
																																			style="
																																				font-family:
																																					&quot;Helvetica&quot;,
																																					Arial,
																																					serif;
																																			"
																																		>
																																			<span
																																				style="
																																					font-family:
																																						&quot;Helvetica&quot;,
																																						Arial,
																																						serif;
																																					font-weight: 400;
																																					font-size: 24px;
																																					line-height: 140%;
																																				"
																																				class="pc-w620-font-size-20px"
																																				>Welcome
																																				aboard,
																																				${firstName}!
																																				🎉&nbsp;</span
																																			>
																																		</div>
																																	</div>
																																</div>
																															</td>
																														</tr>
																													</table>
																												</td>
																											</tr>
																											<tr>
																												<td>
																													<table
																														width="100%"
																														border="0"
																														cellpadding="0"
																														cellspacing="0"
																														role="presentation"
																													>
																														<tr>
																															<td
																																align="left"
																																valign="top"
																															>
																																<table
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																	width="100%"
																																	align="left"
																																>
																																	<tr>
																																		<td
																																			valign="top"
																																			align="left"
																																		>
																																			<div
																																				class="pc-font-alt"
																																				style="
																																					text-decoration: none;
																																				"
																																			>
																																				<div
																																					class="pc-w620-font-size-14px"
																																					style="
																																						font-size: 16px;
																																						line-height: 140%;
																																						text-align: left;
																																						text-align-last: left;
																																						color: #333;
																																						font-family:
																																							&quot;Helvetica&quot;,
																																							Arial,
																																							serif;
																																						font-style: normal;
																																						letter-spacing: -0.2px;
																																					"
																																				>
																																					<div
																																						style="
																																							font-family:
																																								&quot;Helvetica&quot;,
																																								Arial,
																																								serif;
																																						"
																																					>
																																						<span
																																							style="
																																								font-family:
																																									&quot;Helvetica&quot;,
																																									Arial,
																																									serif;
																																								font-weight: 400;
																																								font-size: 16px;
																																								line-height: 140%;
																																							"
																																							class="pc-w620-font-size-14px"
																																							>Your
																																							account
																																							has
																																							been
																																							successfully
																																							created
																																							and
																																							you're
																																							ready
																																							to
																																							start
																																							building
																																							your
																																							MVP.
																																							We're
																																							excited
																																							to
																																							have
																																							you
																																							here!</span
																																						>
																																					</div>
																																				</div>
																																			</div>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																													</table>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										valign="top"
																										align="left"
																										style="padding: 40px 0"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													bgcolor="#fafafa"
																													style="
																														height: unset;
																														padding: 32px 24px;
																														border-radius: 8px
																															8px 8px 8px;
																														background-color: #fafafa;
																													"
																												>
																													<table
																														width="100%"
																														border="0"
																														cellpadding="0"
																														cellspacing="0"
																														role="presentation"
																													>
																														<tr>
																															<td>
																																<table
																																	width="100%"
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			align="left"
																																			valign="top"
																																		>
																																			<table
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																				width="100%"
																																				align="left"
																																			>
																																				<tr>
																																					<td
																																						valign="top"
																																						align="left"
																																						style="
																																							padding: 0
																																								0
																																								24px;
																																							height: auto;
																																						"
																																					>
																																						<div
																																							class="pc-font-alt"
																																							style="
																																								text-decoration: none;
																																							"
																																						>
																																							<div
																																								style="
																																									font-size: 18px;
																																									line-height: 140%;
																																									text-align: left;
																																									text-align-last: left;
																																									color: #333;
																																									font-family:
																																										&quot;Helvetica&quot;,
																																										Arial,
																																										serif;
																																									font-style: normal;
																																									letter-spacing: -0.2px;
																																								"
																																							>
																																								<div
																																									style="
																																										font-family:
																																											&quot;Helvetica&quot;,
																																											Arial,
																																											serif;
																																									"
																																								>
																																									<span
																																										style="
																																											font-family:
																																												&quot;Helvetica&quot;,
																																												Arial,
																																												serif;
																																											font-weight: 700;
																																											font-size: 18px;
																																											line-height: 140%;
																																										"
																																										>Get
																																										Started
																																										in
																																										3
																																										Steps</span
																																									>
																																								</div>
																																							</div>
																																						</div>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																														<tr>
																															<td>
																																<table
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			valign="top"
																																			style="
																																				height: unset;
																																				padding: 0
																																					0 20px;
																																			"
																																		>
																																			<table
																																				width="100%"
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																			>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 12px
																																														16px
																																														12px
																																														0;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 20px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #151011;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															letter-spacing: -0.2px;
																																															font-style: normal;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-size:20px;line-height:140%;font-weight:700"
																																																>1.</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 0
																																														0
																																														4px;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 16px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:16px;line-height:140%"
																																																>Create
																																																Your
																																																First
																																																Idea</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 14px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="
																																																font-family:
																																																	&quot;Helvetica&quot;,
																																																	Arial,
																																																	serif;
																																															"
																																														>
																																															<span
																																																style="
																																																	font-family:
																																																		&quot;Helvetica&quot;,
																																																		Arial,
																																																		serif;
																																																	font-weight: 400;
																																																	font-size: 14px;
																																																	line-height: 140%;
																																																"
																																																>Start
																																																by
																																																generating
																																																an
																																																idea
																																																analysis
																																																for
																																																your
																																																MVP,
																																																we
																																																would
																																																help
																																																you
																																																validate
																																																that
																																																idea
																																																visually</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																														<tr>
																															<td>
																																<table
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			valign="top"
																																			style="
																																				height: unset;
																																				padding: 0
																																					0 20px;
																																			"
																																		>
																																			<table
																																				width="100%"
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																			>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 12px
																																														16px
																																														12px
																																														0;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 20px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #151011;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															letter-spacing: -0.2px;
																																															font-style: normal;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-size:20px;line-height:140%;font-weight:700"
																																																>2.</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 0
																																														0
																																														4px;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 16px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:16px;line-height:140%"
																																																>Generate
																																																Your
																																																Prototype</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 14px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="
																																																font-family:
																																																	&quot;Helvetica&quot;,
																																																	Arial,
																																																	serif;
																																															"
																																														>
																																															<span
																																																style="
																																																	font-family:
																																																		&quot;Helvetica&quot;,
																																																		Arial,
																																																		serif;
																																																	font-weight: 400;
																																																	font-size: 14px;
																																																	line-height: 140%;
																																																"
																																																>Use
																																																our
																																																AI-powered
																																																tools
																																																to
																																																generate
																																																workout
																																																the
																																																workflow
																																																for
																																																your
																																																app
																																																and
																																																how
																																																everything
																																																connectes
																																																together</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																														<tr>
																															<td>
																																<table
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			valign="top"
																																			style="
																																				height: unset;
																																			"
																																		>
																																			<table
																																				width="100%"
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																			>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 12px
																																														16px
																																														12px
																																														0;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 20px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #151011;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:600;font-size:20px;line-height:140%"
																																																>3.</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																												style="
																																													padding: 0
																																														0
																																														4px;
																																													height: auto;
																																												"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 16px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																														>
																																															<span
																																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:16px;line-height:140%"
																																																>Ship
																																																It</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																				<tr>
																																					<td>
																																						<table
																																							width="100%"
																																							border="0"
																																							cellpadding="0"
																																							cellspacing="0"
																																							role="presentation"
																																						>
																																							<tr>
																																								<td
																																									align="left"
																																									valign="top"
																																								>
																																									<table
																																										border="0"
																																										cellpadding="0"
																																										cellspacing="0"
																																										role="presentation"
																																										width="100%"
																																										align="left"
																																									>
																																										<tr>
																																											<td
																																												valign="top"
																																												align="left"
																																											>
																																												<div
																																													class="pc-font-alt"
																																													style="
																																														text-decoration: none;
																																													"
																																												>
																																													<div
																																														style="
																																															font-size: 14px;
																																															line-height: 140%;
																																															text-align: left;
																																															text-align-last: left;
																																															color: #333;
																																															font-family:
																																																&quot;Helvetica&quot;,
																																																Arial,
																																																serif;
																																															font-style: normal;
																																															letter-spacing: -0.2px;
																																														"
																																													>
																																														<div
																																															style="
																																																font-family:
																																																	&quot;Helvetica&quot;,
																																																	Arial,
																																																	serif;
																																															"
																																														>
																																															<span
																																																style="
																																																	font-family:
																																																		&quot;Helvetica&quot;,
																																																		Arial,
																																																		serif;
																																																	font-weight: 400;
																																																	font-size: 14px;
																																																	line-height: 140%;
																																																"
																																																>Export
																																																it
																																																out
																																																to
																																																Readme
																																																or
																																																PRD
																																																for
																																																Cursor
																																																or
																																																Claude
																																																Code
																																																to
																																																write
																																																the
																																																code
																																																for
																																																you</span
																																															>
																																														</div>
																																													</div>
																																												</div>
																																											</td>
																																										</tr>
																																									</table>
																																								</td>
																																							</tr>
																																						</table>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																													</table>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															align="left"
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td valign="top">
																	<table
																		class="pc-width-fill pc-g-b"
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tbody class="pc-g-b">
																			<tr class="pc-g-b pc-g-wf">
																				<td
																					class="pc-g-rb pc-g-rpt pc-g-rpb pc-g-wf pc-w620-itemsVSpacings-30"
																					align="center"
																					valign="middle"
																					style="
																						width: 100%;
																						padding-top: 0;
																						padding-bottom: 0;
																					"
																				>
																					<table
																						style="width: 100%"
																						border="0"
																						cellpadding="0"
																						cellspacing="0"
																						role="presentation"
																					>
																						<tr>
																							<td
																								align="center"
																								valign="middle"
																							>
																								<table
																									width="100%"
																									border="0"
																									cellpadding="0"
																									cellspacing="0"
																									role="presentation"
																								>
																									<tr>
																										<td
																											align="center"
																											valign="top"
																										>
																											<table
																												width="100%"
																												border="0"
																												cellpadding="0"
																												cellspacing="0"
																												role="presentation"
																												style="min-width: 100%"
																											>
																												<tr>
																													<th
																														valign="top"
																														align="center"
																														style="
																															text-align: center;
																															font-weight: normal;
																														"
																													>
																														<!--[if mso
																															]><table
																																border="0"
																																cellpadding="0"
																																cellspacing="0"
																																role="presentation"
																																align="center"
																																style="
																																	border-collapse: separate;
																																	border-spacing: 0;
																																	margin-right: auto;
																																	margin-left: auto;
																																"
																															>
																																<tr>
																																	<td
																																		valign="middle"
																																		align="center"
																																		style="
																																			border-radius: 8px;
																																			background-color: #151011;
																																			text-align: center;
																																			color: #fff;
																																			padding: 12px
																																				20px;
																																			mso-padding-left-alt: 0;
																																			margin-left: 20px;
																																		"
																																		bgcolor="#151011"
																																	>
																																		<a
																																			class="pc-font-alt"
																																			style="
																																				display: inline-block;
																																				text-decoration: none;
																																				text-align: center;
																																			"
																																			href="https://protomap.art/projects"
																																			target="_blank"
																																			><span
																																				style="
																																					font-size: 16px;
																																					line-height: 120%;
																																					color: #fff;
																																					font-family:
																																						&quot;Helvetica&quot;,
																																						Arial,
																																						serif;
																																					letter-spacing: -0.2px;
																																					font-style: normal;
																																					display: inline-block;
																																					vertical-align: top;
																																				"
																																				><span
																																					style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;display:inline-block"
																																					><span
																																						style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-size:16px;line-height:120%;font-weight:700"
																																						>Go
																																						to
																																						Dashboard</span
																																					></span
																																				></span
																																			></a
																																		>
																																	</td>
																																</tr>
																															</table><!
																														[endif]--><!--[if !mso]><!-- --><a
																															style="
																																display: inline-block;
																																box-sizing: border-box;
																																border-radius: 8px;
																																background-color: #151011;
																																padding: 12px
																																	20px;
																																vertical-align: top;
																																text-align: center;
																																text-align-last: center;
																																text-decoration: none;
																																-webkit-text-size-adjust: none;
																															"
																															href="https://protomap.art/projects"
																															target="_blank"
																															><span
																																style="
																																	font-size: 16px;
																																	line-height: 120%;
																																	color: #fff;
																																	font-family:
																																		&quot;Helvetica&quot;,
																																		Arial, serif;
																																	letter-spacing: -0.2px;
																																	font-style: normal;
																																	display: inline-block;
																																	vertical-align: top;
																																"
																																><span
																																	style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;display:inline-block"
																																	><span
																																		style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-size:16px;line-height:120%;font-weight:700"
																																		>Go to
																																		Dashboard</span
																																	></span
																																></span
																															></a
																														><!--<![endif]-->
																													</th>
																												</tr>
																											</table>
																										</td>
																									</tr>
																								</table>
																							</td>
																						</tr>
																					</table>
																				</td>
																			</tr>
																		</tbody>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	style="padding: 40px 0 0"
																>
																	<table
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="
																					line-height: 1px;
																					font-size: 1px;
																					border-bottom: 1px solid #d9d9d9;
																				"
																			>
																				&nbsp;
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	align="left"
																	style="padding: 20px 0 0"
																>
																	<table
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																		width="100%"
																		align="left"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="height: unset; padding: 40px 0 0"
																			>
																				<table
																					width="100%"
																					border="0"
																					cellpadding="0"
																					cellspacing="0"
																					role="presentation"
																				>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										align="left"
																										valign="top"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													align="left"
																													style="
																														padding: 0 0 24px;
																														height: auto;
																													"
																												>
																													<div
																														class="pc-font-alt"
																														style="
																															text-decoration: none;
																														"
																													>
																														<div
																															style="
																																font-size: 15px;
																																line-height: 140%;
																																text-align: left;
																																text-align-last: left;
																																color: #333;
																																font-family:
																																	&quot;Helvetica&quot;,
																																	Arial, serif;
																																font-style: normal;
																																letter-spacing: -0.2px;
																															"
																														>
																															<div
																																style="
																																	font-family:
																																		&quot;Helvetica&quot;,
																																		Arial, serif;
																																"
																															>
																																<span
																																	style="
																																		font-family:
																																			&quot;Helvetica&quot;,
																																			Arial,
																																			serif;
																																		font-weight: 700;
																																		font-size: 15px;
																																		line-height: 140%;
																																		text-transform: uppercase;
																																	"
																																	>WE LOVE
																																	FEEDBACK&nbsp;</span
																																><span
																																	style="
																																		font-family:
																																			&quot;Helvetica&quot;,
																																			Arial,
																																			serif;
																																		font-size: 15px;
																																		line-height: 140%;
																																		font-weight: 700;
																																	"
																																	>🫡</span
																																>
																															</div>
																														</div>
																													</div>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										align="left"
																										valign="top"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													align="left"
																													style="
																														padding: 0 0 32px;
																														height: auto;
																													"
																												>
																													<div
																														class="pc-font-alt"
																														style="
																															text-decoration: none;
																														"
																													>
																														<div
																															style="
																																font-size: 15px;
																																line-height: 140%;
																																text-align: left;
																																text-align-last: left;
																																color: #333;
																																font-family:
																																	&quot;Helvetica&quot;,
																																	Arial, serif;
																																font-style: normal;
																																letter-spacing: -0.2px;
																															"
																														>
																															<div
																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																															>
																																<span
																																	style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																	>Protomap is
																																	just getting
																																	started, and
																																	we're shaping
																																	it with you in
																																	mind. To make
																																	it genuinely
																																	exceptional,
																																	we need your
																																	unfiltered
																																	thoughts.
																																	Share what you
																																	love, what
																																	frustrates
																																	you, and
																																	everything in
																																	between</span
																																>
																															</div>
																														</div>
																													</div>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										valign="top"
																										align="left"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													style="
																														height: unset;
																														padding: 0 0 20px;
																													"
																												>
																													<table
																														width="100%"
																														border="0"
																														cellpadding="0"
																														cellspacing="0"
																														role="presentation"
																													>
																														<tr>
																															<td>
																																<table
																																	width="100%"
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			align="left"
																																			valign="top"
																																		>
																																			<table
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																				width="100%"
																																				align="left"
																																			>
																																				<tr>
																																					<td
																																						valign="top"
																																						align="left"
																																						style="
																																							padding: 0
																																								0
																																								4px;
																																							height: auto;
																																						"
																																					>
																																						<div
																																							class="pc-font-alt"
																																							style="
																																								text-decoration: none;
																																							"
																																						>
																																							<div
																																								style="
																																									font-size: 15px;
																																									line-height: 140%;
																																									text-align: left;
																																									text-align-last: left;
																																									color: #333;
																																									font-family:
																																										&quot;Helvetica&quot;,
																																										Arial,
																																										serif;
																																									font-style: normal;
																																									letter-spacing: -0.2px;
																																								"
																																							>
																																								<div
																																									style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																								>
																																									<span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:15px;line-height:140%"
																																										>Message
																																										on
																																										X</span
																																									>
																																								</div>
																																							</div>
																																						</div>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																														<tr>
																															<td>
																																<table
																																	width="100%"
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			align="left"
																																			valign="top"
																																		>
																																			<table
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																				width="100%"
																																				align="left"
																																			>
																																				<tr>
																																					<td
																																						valign="top"
																																						align="left"
																																					>
																																						<div
																																							class="pc-font-alt"
																																							style="
																																								text-decoration: none;
																																							"
																																						>
																																							<div
																																								style="
																																									font-size: 15px;
																																									line-height: 140%;
																																									text-align: left;
																																									text-align-last: left;
																																									color: #333;
																																									font-family:
																																										&quot;Helvetica&quot;,
																																										Arial,
																																										serif;
																																									font-style: normal;
																																									letter-spacing: -0.2px;
																																								"
																																							>
																																								<div
																																									style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																								>
																																									<span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																										>DM&nbsp;</span
																																									><a
																																										href="https://x.com/itzadetunji1"
																																										target="_blank"
																																										rel="noreferrer"
																																										style="text-decoration:none;color:inherit;color:rgb(51,51,51);font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																										><span
																																											style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%;text-decoration:underline"
																																											>@Adetunji</span
																																										></a
																																									><span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																										>&nbsp;directly
																																										on
																																										X.</span
																																									>
																																								</div>
																																							</div>
																																						</div>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																													</table>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										valign="top"
																										align="left"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													style="
																														height: unset;
																														padding: 0 0 20px;
																													"
																												>
																													<table
																														width="100%"
																														border="0"
																														cellpadding="0"
																														cellspacing="0"
																														role="presentation"
																													>
																														<tr>
																															<td>
																																<table
																																	width="100%"
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			align="left"
																																			valign="top"
																																		>
																																			<table
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																				width="100%"
																																				align="left"
																																			>
																																				<tr>
																																					<td
																																						valign="top"
																																						align="left"
																																						style="
																																							padding: 0
																																								0
																																								4px;
																																							height: auto;
																																						"
																																					>
																																						<div
																																							class="pc-font-alt"
																																							style="
																																								text-decoration: none;
																																							"
																																						>
																																							<div
																																								style="
																																									font-size: 15px;
																																									line-height: 140%;
																																									text-align: left;
																																									text-align-last: left;
																																									color: #333;
																																									font-family:
																																										&quot;Helvetica&quot;,
																																										Arial,
																																										serif;
																																									font-style: normal;
																																									letter-spacing: -0.2px;
																																								"
																																							>
																																								<div
																																									style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																								>
																																									<span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:15px;line-height:140%"
																																										>Message
																																										on
																																										X</span
																																									>
																																								</div>
																																							</div>
																																						</div>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																														<tr>
																															<td>
																																<table
																																	width="100%"
																																	border="0"
																																	cellpadding="0"
																																	cellspacing="0"
																																	role="presentation"
																																>
																																	<tr>
																																		<td
																																			align="left"
																																			valign="top"
																																		>
																																			<table
																																				border="0"
																																				cellpadding="0"
																																				cellspacing="0"
																																				role="presentation"
																																				width="100%"
																																				align="left"
																																			>
																																				<tr>
																																					<td
																																						valign="top"
																																						align="left"
																																					>
																																						<div
																																							class="pc-font-alt"
																																							style="
																																								text-decoration: none;
																																							"
																																						>
																																							<div
																																								style="
																																									font-size: 15px;
																																									line-height: 140%;
																																									text-align: left;
																																									text-align-last: left;
																																									color: #333;
																																									font-family:
																																										&quot;Helvetica&quot;,
																																										Arial,
																																										serif;
																																									font-style: normal;
																																									letter-spacing: -0.2px;
																																								"
																																							>
																																								<div
																																									style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																								>
																																									<span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																										>Send
																																										us
																																										an
																																										email
																																										at&nbsp;</span
																																									><a
																																										href="mailto:hello@protomap.art"
																																										target="_blank"
																																										rel="noreferrer"
																																										style="text-decoration:none;color:inherit;color:rgb(51,51,51);font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																										><span
																																											style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%;text-decoration:underline"
																																											>hello</span
																																										></a
																																									><a
																																										href="mailto:hello@protomap.art"
																																										target="_blank"
																																										rel="noreferrer"
																																										style="text-decoration:none;color:inherit;color:rgb(51,51,51);font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																										><span
																																											style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%;text-decoration:underline"
																																											>@</span
																																										></a
																																									><a
																																										href="mailto:hello@protomap.art"
																																										target="_blank"
																																										rel="noreferrer"
																																										style="text-decoration:none;color:inherit;color:rgb(51,51,51);font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																																										><span
																																											style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%;text-decoration:underline"
																																											>protomap.art</span
																																										></a
																																									><span
																																										style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																										>&nbsp;anytime.</span
																																									>
																																								</div>
																																							</div>
																																						</div>
																																					</td>
																																				</tr>
																																			</table>
																																		</td>
																																	</tr>
																																</table>
																															</td>
																														</tr>
																													</table>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	style="padding: 40px 0 0"
																>
																	<table
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="
																					line-height: 1px;
																					font-size: 1px;
																					border-bottom: 1px solid #d9d9d9;
																				"
																			>
																				&nbsp;
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	align="left"
																	style="padding: 20px 0"
																>
																	<table
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																		width="100%"
																		align="left"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="height: unset; padding: 40px 0 0"
																			>
																				<table
																					width="100%"
																					border="0"
																					cellpadding="0"
																					cellspacing="0"
																					role="presentation"
																				>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										align="left"
																										valign="top"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													align="left"
																												>
																													<div
																														class="pc-font-alt"
																														style="
																															text-decoration: none;
																														"
																													>
																														<div
																															style="
																																font-size: 15px;
																																line-height: 140%;
																																text-align: left;
																																text-align-last: left;
																																color: #333;
																																font-family:
																																	&quot;Helvetica&quot;,
																																	Arial, serif;
																																font-style: normal;
																																letter-spacing: -0.2px;
																															"
																														>
																															<div
																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																															>
																																<span
																																	style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:400;font-size:15px;line-height:140%"
																																	>Excited to
																																	see what you
																																	create!</span
																																>
																															</div>
																														</div>
																													</div>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																					<tr>
																						<td>
																							<table
																								width="100%"
																								border="0"
																								cellpadding="0"
																								cellspacing="0"
																								role="presentation"
																							>
																								<tr>
																									<td
																										align="left"
																										valign="top"
																										style="
																											padding: 24px 0 0;
																											height: auto;
																										"
																									>
																										<table
																											border="0"
																											cellpadding="0"
																											cellspacing="0"
																											role="presentation"
																											width="100%"
																											align="left"
																										>
																											<tr>
																												<td
																													valign="top"
																													align="left"
																													style="
																														padding: 16px 0 0;
																														height: auto;
																													"
																												>
																													<div
																														class="pc-font-alt"
																														style="
																															text-decoration: none;
																														"
																													>
																														<div
																															style="
																																font-size: 15px;
																																line-height: 140%;
																																text-align: left;
																																text-align-last: left;
																																color: #333;
																																font-family:
																																	&quot;Helvetica&quot;,
																																	Arial, serif;
																																font-style: normal;
																																letter-spacing: -0.2px;
																															"
																														>
																															<div
																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																															>
																																<span
																																	style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:700;font-size:15px;line-height:140%"
																																	>Adetunji</span
																																>
																															</div>
																															<div
																																style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif"
																															>
																																<span
																																	style="font-family:'Helvetica',&nbsp;&nbsp;Arial,&nbsp;&nbsp;serif;font-weight:300;font-size:15px;line-height:140%"
																																	>Protomap</span
																																>
																															</div>
																														</div>
																													</div>
																												</td>
																											</tr>
																										</table>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
														<table
															width="100%"
															border="0"
															cellpadding="0"
															cellspacing="0"
															role="presentation"
														>
															<tr>
																<td
																	valign="top"
																	style="padding: 40px 0 0"
																>
																	<table
																		width="100%"
																		border="0"
																		cellpadding="0"
																		cellspacing="0"
																		role="presentation"
																	>
																		<tr>
																			<td
																				valign="top"
																				style="
																					line-height: 1px;
																					font-size: 1px;
																					border-bottom: 1px solid #d9d9d9;
																				"
																			>
																				&nbsp;
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
													</td>
												</tr>
											</table>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;