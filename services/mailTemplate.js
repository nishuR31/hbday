export const birthdayTemplate = (name, email) => `
  <div style="
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(
      to bottom,
      #6d28d9 0%,     /* Purple (top) */
      #0b0b0f 50%,    /* Black (middle) */
      #7c3aed 100%    /* Violet (bottom) */
    );
    color: #f5f3ff;
    padding: 60px 20px;
    text-align: center;
  ">

    <!-- Brand -->
    <div style="margin-bottom: 38px;">
      <div style="
        display: inline-block;
        padding: 14px 28px;
        border-radius: 18px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(196,181,253,0.35);
        font-size: 20px;
        letter-spacing: 3px;
        font-weight: 700;
        color: #ede9fe;
        box-shadow: 0 12px 40px rgba(124,58,237,0.45);
      ">
        HBday
      </div>
    </div>

    <!-- Card -->
    <div style="
      max-width: 620px;
      margin: auto;
      padding: 48px 42px;
      border-radius: 22px;
      background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
      border: 1px solid rgba(196,181,253,0.25);
      box-shadow: 0 25px 70px rgba(76,29,149,0.5);
    ">

      <h1 style="
        font-size: 32px;
        margin-bottom: 16px;
        font-weight: 650;
        color: #ddd6fe;
      ">
        Happy Birthday, ${name}
      </h1>

      <p style="
        font-size: 13px;
        opacity: 0.6;
        margin-bottom: 32px;
      ">
        ${email}
      </p>

      <p style="
        font-size: 18px;
        line-height: 1.7;
        color: #f3e8ff;
      ">
        “Another year is not just time added — it is strength gained,
        lessons earned, and a future shaped with intention.
        Keep rising.”
      </p>

      <div style="
        margin-top: 46px;
        font-size: 12px;
        opacity: 0.45;
        letter-spacing: 1px;
      ">
        HBday • Royal Birthday Notification Service
      </div>

    </div>
  </div>
`;

