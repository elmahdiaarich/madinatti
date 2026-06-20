const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendResetPasswordEmail = async (
  to,
  resetLink
) => {

  await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to,

    subject: 'Réinitialisation mot de passe',

    html: `
  <div style="
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    padding: 40px 20px;
  ">

    <div style="
      max-width: 500px;
      margin: auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    ">

      <div style="text-align:center; margin-bottom:20px;">
        <img
          src="https://i.postimg.cc/50S0yBCR/logo-jpg.jpg"
          alt="Madinatti"
          style="height:40px;"
        />
      </div>

      <h1 style="
        color:#111827;
        text-align:center;
        margin-bottom:10px;
      ">
        Réinitialisation du mot de passe
      </h1>

      <p style="
        color:#4b5563;
        font-size:15px;
        line-height:1.7;
        text-align:center;
      ">
        Nous avons reçu une demande de réinitialisation
        de votre mot de passe pour votre compte Madinatti.
      </p>

      <p style="
        color:#4b5563;
        font-size:15px;
        line-height:1.7;
        text-align:center;
        margin-top:15px;
      ">
        Cliquez sur le bouton ci-dessous pour choisir
        un nouveau mot de passe sécurisé.
      </p>

      <div style="text-align:center; margin:35px 0;">

        <a
          href="${resetLink}"
          style="
            background:#16a34a;
            color:white;
            padding:14px 28px;
            text-decoration:none;
            border-radius:10px;
            font-weight:bold;
            display:inline-block;
          "
        >
          Réinitialiser mon mot de passe
        </a>

      </div>

      <p style="
        color:#6b7280;
        font-size:14px;
        line-height:1.6;
      ">
        Ce lien expirera dans <strong>1 heure</strong>.
      </p>

      <p style="
        color:#6b7280;
        font-size:14px;
        line-height:1.6;
      ">
        Si vous n’êtes pas à l’origine de cette demande,
        vous pouvez ignorer cet email en toute sécurité.
      </p>

      <hr style="
        border:none;
        border-top:1px solid #e5e7eb;
        margin:30px 0;
      " />

      <p style="
        text-align:center;
        color:#9ca3af;
        font-size:12px;
      ">
        © 2026 Madinatti — Tous droits réservés
      </p>

    </div>

  </div>
`
  })

}

async function sendReportContactEmail({ to, ownerName, listingTitle, adminMessage }) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `[Madinatti] Signalement concernant votre annonce`,
    html: `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 20px;">
    <div style="max-width:500px;margin:auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://i.postimg.cc/50S0yBCR/logo-jpg.jpg" alt="Madinatti" style="height:40px;" />
      </div>
      <h2 style="color:#111827;margin-bottom:8px;">Message de l&apos;équipe Madinatti</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.7;">Bonjour <strong>${ownerName}</strong>,</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.7;">
        Votre annonce <strong>"${listingTitle}"</strong> a été signalée. Notre équipe vous contacte :
      </p>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;color:#92400e;font-size:14px;line-height:1.6;">
        ${adminMessage}
      </div>
      <p style="color:#6b7280;font-size:13px;">
        Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, répondez directement à cet email.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
      <p style="text-align:center;color:#9ca3af;font-size:12px;">© 2026 Madinatti — Tous droits réservés</p>
    </div>
  </div>`,
  })
}

module.exports = {
  sendResetPasswordEmail,
  sendReportContactEmail,
}
