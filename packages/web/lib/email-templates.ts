const LOGO_URL = "https://res.cloudinary.com/esim4u/image/upload/v1780838460/esim4u-logo_jetmv6.png";
const BRAND_ORANGE = "#FF5722";
const SUPPORT_EMAIL = "support@esim4u.uk";
const DASHBOARD_URL = "https://esim4u.uk/dashboard";

export function getOTPEmailTemplate(otp: string, name: string): string {
  const digits = otp.split("");
  const digitCells = digits
    .map(
      (digit) =>
        `<td style="width:56px;height:68px;background-color:#ffffff;border-radius:12px;text-align:center;font-size:36px;font-weight:700;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;border:2px solid #e8e8e8;">${digit}</td>`
    )
    .join(`<td style="width:10px;"></td>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify your email - eSIM4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">

<!-- Logo Section -->
<tr>
<td align="center" style="padding:40px 40px 30px 40px;background-color:#ffffff;">
<img src="${LOGO_URL}" alt="eSIM4U" width="240" style="display:block;max-width:240px;height:auto;" />
</td>
</tr>

<!-- Greeting Section -->
<tr>
<td style="padding:0 40px 8px 40px;">
<h1 style="margin:0;font-size:26px;font-weight:700;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hello ${name},</h1>
</td>
</tr>

<!-- Message Body -->
<tr>
<td style="padding:12px 40px 8px 40px;">
<p style="margin:0 0 8px 0;font-size:16px;color:#4a4a4a;line-height:1.6;">Thank you for showing interest in eSIM4U.</p>
<p style="margin:0;font-size:16px;color:#4a4a4a;line-height:1.6;">We're excited to have you with us! Here is your <span style="color:${BRAND_ORANGE};font-weight:600;">One-Time Password (OTP)</span> to join and get started.</p>
</td>
</tr>

<!-- YOUR OTP CODE Label -->
<tr>
<td align="center" style="padding:32px 40px 16px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="vertical-align:middle;padding-right:10px;">
<div style="width:30px;height:1px;background-color:#e0e0e0;display:inline-block;"></div>
<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${BRAND_ORANGE};vertical-align:middle;margin-left:4px;"></span>
</td>
<td style="vertical-align:middle;">
<span style="font-size:13px;font-weight:700;color:${BRAND_ORANGE};letter-spacing:2px;text-transform:uppercase;">YOUR OTP CODE</span>
</td>
<td style="vertical-align:middle;padding-left:10px;">
<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${BRAND_ORANGE};vertical-align:middle;margin-right:4px;"></span>
<div style="width:30px;height:1px;background-color:#e0e0e0;display:inline-block;"></div>
</td>
</tr>
</table>
</td>
</tr>

<!-- OTP Digits -->
<tr>
<td align="center" style="padding:0 40px 24px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
${digitCells}
</tr>
</table>
</td>
</tr>

<!-- Timer Notice -->
<tr>
<td align="center" style="padding:0 40px 32px 40px;">
<p style="margin:0;font-size:14px;color:#666666;line-height:1.5;">This OTP is valid for the <strong>next <span style="color:${BRAND_ORANGE};">5 minutes</span></strong>.</p>
</td>
</tr>

<!-- Security Warning Box -->
<tr>
<td style="padding:0 40px 24px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FDECEC;border-radius:10px;overflow:hidden;">
<tr>
<td style="padding:18px 24px;">
<p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.4;">For your security, please do not share this OTP with anyone.</p>
<p style="margin:0;font-size:14px;color:#666666;line-height:1.4;">Our team will never ask you for this code.</p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Divider -->
<tr>
<td style="padding:0 40px;">
<div style="height:1px;background-color:#eeeeee;"></div>
</td>
</tr>

<!-- Didn't Request Section -->
<tr>
<td style="padding:24px 40px 8px 40px;">
<p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.4;">Didn't request this?</p>
<p style="margin:0;font-size:14px;color:#666666;line-height:1.5;">If you didn't request this OTP, you can safely ignore this email.<br/>If you need any help, please contact our support team.</p>
</td>
</tr>

<!-- Support Email -->
<tr>
<td style="padding:12px 40px 40px 40px;">
<a href="mailto:${SUPPORT_EMAIL}" style="font-size:14px;color:${BRAND_ORANGE};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function getVerificationSuccessTemplate(
  name: string,
  dateTime?: string,
  deviceName?: string
): string {
  const loginDate = dateTime || new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  const device = deviceName || "Unknown Device";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login Successful - eSIM4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">

<!-- Logo Section -->
<tr>
<td align="center" style="padding:40px 40px 30px 40px;background-color:#ffffff;">
<img src="${LOGO_URL}" alt="eSIM4U" width="240" style="display:block;max-width:240px;height:auto;" />
</td>
</tr>

<!-- Checkmark Icon -->
<tr>
<td align="center" style="padding:0 40px 8px 40px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="width:72px;height:72px;" arcsize="50%" fillcolor="#4CAF50" stroke="f">
<v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
<center style="color:#ffffff;font-size:36px;font-weight:bold;">&#10003;</center>
</v:textbox>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<div style="display:inline-block;width:72px;height:72px;border-radius:50%;background-color:#4CAF50;text-align:center;line-height:72px;">
<span style="font-size:36px;color:#ffffff;font-weight:bold;">&#10003;</span>
</div>
<!--<![endif]-->
</td>
</tr>

<!-- Login Successful Heading -->
<tr>
<td align="center" style="padding:16px 40px 8px 40px;">
<h1 style="margin:0;font-size:28px;font-weight:700;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Login Successful!</h1>
</td>
</tr>

<!-- Greeting Text -->
<tr>
<td align="center" style="padding:8px 40px 32px 40px;">
<p style="margin:0 0 4px 0;font-size:16px;color:#4a4a4a;line-height:1.6;">Hi <span style="color:${BRAND_ORANGE};font-weight:600;">${name.toUpperCase()}</span>,</p>
<p style="margin:0;font-size:16px;color:#4a4a4a;line-height:1.6;">You have successfully logged in to your eSIM4U account.<br/>We're glad to have you back!</p>
</td>
</tr>

<!-- Login Details Box -->
<tr>
<td style="padding:0 40px 32px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFF8F0;border-radius:12px;border:1px solid #FFE0B2;overflow:hidden;">
<tr>
<td style="padding:24px 28px 20px 28px;">
<!-- Login Details Header -->
<div style="margin-bottom:20px;font-size:16px;font-weight:700;color:#1a1a1a;">Login Details</div>

<!-- Date & Time Row -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
<tr>
<td style="vertical-align:middle;width:110px;">
<span style="font-size:14px;color:#666666;">Date &amp; Time</span>
</td>
<td style="vertical-align:middle;width:16px;">
<span style="font-size:14px;color:#999999;">:</span>
</td>
<td style="vertical-align:middle;">
<span style="font-size:14px;font-weight:700;color:#1a1a1a;">${loginDate}</span>
</td>
</tr>
</table>

<!-- Device Row -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="vertical-align:middle;width:110px;">
<span style="font-size:14px;color:#666666;">Device</span>
</td>
<td style="vertical-align:middle;width:16px;">
<span style="font-size:14px;color:#999999;">:</span>
</td>
<td style="vertical-align:middle;">
<span style="font-size:14px;font-weight:700;color:#1a1a1a;">${device}</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>

<!-- Security Warning Text -->
<tr>
<td align="center" style="padding:0 40px 32px 40px;">
<p style="margin:0;font-size:15px;color:#666666;line-height:1.6;text-align:center;">If this wasn't you, please secure your account<br/>and <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_ORANGE};font-weight:600;text-decoration:none;">contact our support team</a> immediately.</p>
</td>
</tr>

<!-- Go to Dashboard Button -->
<tr>
<td align="center" style="padding:0 40px 40px 40px;">
<a href="${DASHBOARD_URL}" target="_blank" style="display:inline-block;background-color:${BRAND_ORANGE};color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:10px;min-width:200px;text-align:center;">Go to My Dashboard</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export interface OrderReadyTemplateData {
  name: string;
  orderReference: string;
  planName: string;
  country?: string;
  dataAmount?: string;
  validity?: string;
  amountText: string;
  smdpAddress?: string | null;
  activationCode?: string | null;
  iccid?: string | null;
  isTopup?: boolean;
  hasQr?: boolean;
}

function detailRow(label: string, value: string): string {
  return `<tr>
<td style="vertical-align:top;padding:6px 0;width:150px;"><span style="font-size:14px;color:#666666;">${label}</span></td>
<td style="vertical-align:top;padding:6px 0;width:12px;"><span style="font-size:14px;color:#999999;">:</span></td>
<td style="vertical-align:top;padding:6px 0;"><span style="font-size:14px;font-weight:700;color:#1a1a1a;word-break:break-all;">${value}</span></td>
</tr>`;
}

/** Branded eSIM4U order confirmation — sent by us, never referencing MontyeSIM. */
export function getOrderReadyTemplate(d: OrderReadyTemplateData): string {
  const heading = d.isTopup ? "Your eSIM has been recharged" : "Your eSIM is ready";
  const intro = d.isTopup
    ? "Your new plan has been added to your existing eSIM. There's nothing to reinstall — it's active on the same eSIM you already have."
    : "Thank you for your order. Your eSIM has been issued and is ready to install. Scan the QR code below or enter the details manually.";

  const orderRows = [
    detailRow("Order Reference", d.orderReference),
    detailRow("Plan", d.planName),
    d.country ? detailRow("Destination", d.country) : "",
    d.dataAmount ? detailRow("Data", d.dataAmount) : "",
    d.validity ? detailRow("Validity", d.validity) : "",
    detailRow("Amount Paid", d.amountText),
  ]
    .filter(Boolean)
    .join("");

  // Activation block (only for a fresh eSIM, not a recharge).
  const activationBlock =
    !d.isTopup && (d.hasQr || d.activationCode || d.smdpAddress)
      ? `<tr>
<td style="padding:0 40px 8px 40px;">
<div style="font-size:13px;font-weight:700;color:${BRAND_ORANGE};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Install your eSIM</div>
</td>
</tr>
${
  d.hasQr
    ? `<tr>
<td align="center" style="padding:0 40px 20px 40px;">
<img src="cid:esim-qr" alt="eSIM QR code" width="220" style="display:block;width:220px;height:220px;border:1px solid #eeeeee;border-radius:12px;padding:10px;background:#ffffff;" />
<p style="margin:12px 0 0 0;font-size:13px;color:#666666;">Scan this QR code with your phone's camera to install. It's also attached to this email.</p>
</td>
</tr>`
    : ""
}
<tr>
<td style="padding:0 40px 24px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFF8F0;border-radius:12px;border:1px solid #FFE0B2;">
<tr><td style="padding:20px 24px;">
<div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:14px;">Manual installation details</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${d.smdpAddress ? detailRow("SM-DP+ Address", d.smdpAddress) : ""}
${d.activationCode ? detailRow("Activation Code", d.activationCode) : ""}
${d.iccid ? detailRow("ICCID", d.iccid) : ""}
</table>
</td></tr>
</table>
</td>
</tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${heading} - eSIM4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">

<!-- Logo -->
<tr>
<td align="center" style="padding:40px 40px 24px 40px;">
<img src="${LOGO_URL}" alt="eSIM4U" width="220" style="display:block;max-width:220px;height:auto;" />
</td>
</tr>

<!-- Heading -->
<tr>
<td align="center" style="padding:0 40px 6px 40px;">
<h1 style="margin:0;font-size:26px;font-weight:700;color:#1a1a1a;">${heading}</h1>
</td>
</tr>

<!-- Greeting + intro -->
<tr>
<td align="center" style="padding:8px 40px 28px 40px;">
<p style="margin:0 0 6px 0;font-size:16px;color:#4a4a4a;line-height:1.6;">Hi <span style="color:${BRAND_ORANGE};font-weight:600;">${d.name}</span>,</p>
<p style="margin:0;font-size:15px;color:#4a4a4a;line-height:1.6;">${intro}</p>
</td>
</tr>

${activationBlock}

<!-- Order / invoice -->
<tr>
<td style="padding:0 40px 8px 40px;">
<div style="font-size:13px;font-weight:700;color:${BRAND_ORANGE};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Order summary</div>
</td>
</tr>
<tr>
<td style="padding:0 40px 28px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafafa;border-radius:12px;border:1px solid #eeeeee;">
<tr><td style="padding:20px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${orderRows}
</table>
</td></tr>
</table>
</td>
</tr>

<!-- Manage button -->
<tr>
<td align="center" style="padding:0 40px 32px 40px;">
<a href="${DASHBOARD_URL}/esims" target="_blank" style="display:inline-block;background-color:${BRAND_ORANGE};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:15px 44px;border-radius:10px;text-align:center;">Manage My eSIM</a>
</td>
</tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><div style="height:1px;background-color:#eeeeee;"></div></td></tr>

<!-- Support -->
<tr>
<td align="center" style="padding:24px 40px 40px 40px;">
<p style="margin:0 0 4px 0;font-size:14px;color:#666666;line-height:1.6;">Need help? We're here for you.</p>
<a href="mailto:${SUPPORT_EMAIL}" style="font-size:14px;color:${BRAND_ORANGE};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}
