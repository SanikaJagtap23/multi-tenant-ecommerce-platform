import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../../features/cart/cartSlice";
import { clearPaymentState } from "../../features/payment/paymentSlice";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import {
  FiLock, FiArrowLeft, FiCheck, FiCreditCard,
  FiSmartphone, FiDatabase, FiGlobe, FiAlertCircle,
} from "react-icons/fi";
import "./PaymentPage.css";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtCard = (v) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
};

const cardBrand = (n) => {
  const s = n.replace(/\s/g, "");
  if (/^4/.test(s))        return { name: "Visa",       bg: "#1a1f71" };
  if (/^5[1-5]|^2/.test(s)) return { name: "Mastercard", bg: "#eb001b" };
  if (/^6/.test(s))        return { name: "RuPay",      bg: "#006a4e" };
  if (/^3[47]/.test(s))    return { name: "AmEx",       bg: "#2e77bc" };
  return null;
};

// Test card outcomes (last 4 digits drive the result)
const cardOutcome = (number) => {
  const n = number.replace(/\s/g, "");
  if (n === "4000000000000002") return { ok: false, msg: "Your card was declined. Please use a different card." };
  if (n === "4000000000009995") return { ok: false, msg: "Insufficient funds on this card." };
  if (n === "4100000000000019") return { ok: false, msg: "This card has been reported lost or stolen." };
  if (n.length === 16)          return { ok: true };
  return { ok: false, msg: "Invalid card number (must be 16 digits)." };
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function CardForm({ onPay, busy }) {
  const [f, setF] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const brand = cardBrand(f.number);

  return (
    <form className="pf" onSubmit={(e) => { e.preventDefault(); onPay(cardOutcome(f.number)); }}>

      {/* Live card preview */}
      <div className="pf-card-preview" style={{ background: brand?.bg || "#1e293b" }}>
        <div className="pf-card-preview__row1">
          <div className="pf-card-preview__chip" />
          {brand && <span className="pf-card-preview__brand">{brand.name}</span>}
        </div>
        <div className="pf-card-preview__number">{f.number || "•••• •••• •••• ••••"}</div>
        <div className="pf-card-preview__row3">
          <div>
            <div className="pf-card-preview__sublabel">Card Holder</div>
            <div className="pf-card-preview__subval">{f.name || "YOUR NAME"}</div>
          </div>
          <div>
            <div className="pf-card-preview__sublabel">Expires</div>
            <div className="pf-card-preview__subval">{f.expiry || "MM/YY"}</div>
          </div>
        </div>
      </div>

      <div className="pf-field pf-field--full">
        <label>Card Number</label>
        <input
          placeholder="1234  5678  9012  3456"
          value={f.number}
          onChange={(e) => setF(p => ({ ...p, number: fmtCard(e.target.value) }))}
          maxLength={19} required autoComplete="cc-number"
        />
      </div>
      <div className="pf-row">
        <div className="pf-field">
          <label>Expiry</label>
          <input
            placeholder="MM/YY"
            value={f.expiry}
            onChange={(e) => setF(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))}
            maxLength={5} required autoComplete="cc-exp"
          />
        </div>
        <div className="pf-field">
          <label>CVV</label>
          <input
            type="password" placeholder="•••"
            value={f.cvv}
            onChange={(e) => setF(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            maxLength={4} required autoComplete="cc-csc"
          />
        </div>
      </div>
      <div className="pf-field pf-field--full">
        <label>Cardholder Name</label>
        <input
          placeholder="Name as on card"
          value={f.name}
          onChange={(e) => setF(p => ({ ...p, name: e.target.value.toUpperCase() }))}
          required autoComplete="cc-name"
        />
      </div>

      <div className="pf-test-hint">
        <strong>Test cards</strong>
        <div className="pf-test-hint__grid">
          <span>4111 1111 1111 1111</span><span className="pf-badge pf-badge--ok">Success</span>
          <span>4000 0000 0000 0002</span><span className="pf-badge pf-badge--fail">Decline</span>
          <span>4000 0000 0000 9995</span><span className="pf-badge pf-badge--fail">Insuff. funds</span>
        </div>
      </div>

      <button type="submit" disabled={busy} className="pf-pay-btn">
        <FiLock size={14} /> Pay Now
      </button>
    </form>
  );
}

function UpiForm({ onPay, busy }) {
  const [upiId,    setUpiId]    = useState("");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selected, setSelected] = useState("");

  const APPS = [
    { id: "gpay",    label: "GPay",    emoji: "🟦", handle: "@oksbi" },
    { id: "phonepe", label: "PhonePe", emoji: "🟣", handle: "@ybl" },
    { id: "paytm",   label: "Paytm",   emoji: "🔵", handle: "@paytm" },
    { id: "bhim",    label: "BHIM",    emoji: "🟤", handle: "@upi" },
  ];

  const verify = async () => {
    if (!upiId.includes("@")) return;
    setChecking(true);
    await new Promise(r => setTimeout(r, 1300));
    setChecking(false);
    setVerified(true);
  };

  const selectApp = (app) => {
    setSelected(app.id);
    setUpiId(`yourname${app.handle}`);
    setVerified(false);
  };

  return (
    <form className="pf" onSubmit={(e) => { e.preventDefault(); onPay({ ok: true }); }}>
      <div className="pf-upi-apps">
        {APPS.map(app => (
          <button
            key={app.id} type="button"
            className={`pf-upi-app${selected === app.id ? " pf-upi-app--selected" : ""}`}
            onClick={() => selectApp(app)}
          >
            <span className="pf-upi-app__icon">{app.emoji}</span>
            <span>{app.label}</span>
          </button>
        ))}
      </div>

      <p className="pf-divider">— or enter UPI ID —</p>

      <div className="pf-field pf-field--full">
        <label>UPI ID</label>
        <div className="pf-upi-row">
          <input
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => { setUpiId(e.target.value); setVerified(false); }}
            required
          />
          <button
            type="button"
            className={`pf-verify-btn${verified ? " pf-verify-btn--ok" : ""}`}
            onClick={verify}
            disabled={checking || !upiId.includes("@")}
          >
            {checking ? "…" : verified ? <FiCheck size={13} /> : "Verify"}
          </button>
        </div>
        {verified && <p className="pf-verified">✓ UPI ID verified successfully</p>}
      </div>

      <button type="submit" disabled={busy || !verified} className="pf-pay-btn">
        <FiLock size={14} /> Pay via UPI
      </button>
    </form>
  );
}

function NetBankingForm({ onPay, busy }) {
  const [bank, setBank] = useState("");

  const BANKS = [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
    "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda",
    "Canara Bank", "Union Bank of India", "Yes Bank", "IndusInd Bank",
    "IDFC First Bank", "Federal Bank", "South Indian Bank", "Karnataka Bank",
  ];

  return (
    <form className="pf" onSubmit={(e) => { e.preventDefault(); onPay({ ok: true }); }}>
      <div className="pf-field pf-field--full">
        <label>Select Your Bank</label>
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          required className="pf-select"
        >
          <option value="">— Choose a bank —</option>
          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {bank && (
        <div className="pf-bank-notice">
          <FiAlertCircle size={14} />
          You will be securely redirected to <strong>{bank}</strong> for authentication.
        </div>
      )}

      <button type="submit" disabled={busy || !bank} className="pf-pay-btn">
        <FiLock size={14} /> Proceed to Bank
      </button>
    </form>
  );
}

function WalletForm({ onPay, busy, total }) {
  const [wallet, setWallet] = useState("");

  const WALLETS = [
    { id: "paytm",    name: "Paytm Wallet",   balance: 2500, emoji: "💙" },
    { id: "phonepe",  name: "PhonePe Wallet",  balance: 1800, emoji: "💜" },
    { id: "amazon",   name: "Amazon Pay",      balance: 750,  emoji: "🟠" },
    { id: "mobikwik", name: "Mobikwik",        balance: 500,  emoji: "🔴" },
    { id: "freecharge",name:"Freecharge",      balance: 300,  emoji: "🟢" },
  ];

  const selected = WALLETS.find(w => w.id === wallet);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selected && selected.balance < total) {
      onPay({ ok: false, msg: `Insufficient balance in ${selected.name}. Available: ₹${selected.balance.toLocaleString()}.` });
    } else {
      onPay({ ok: true });
    }
  };

  return (
    <form className="pf" onSubmit={handleSubmit}>
      <div className="pf-wallet-list">
        {WALLETS.map(w => (
          <label
            key={w.id}
            className={`pf-wallet-opt${wallet === w.id ? " pf-wallet-opt--on" : ""}${w.balance < total ? " pf-wallet-opt--low" : ""}`}
          >
            <input type="radio" name="wallet" value={w.id} checked={wallet === w.id} onChange={() => setWallet(w.id)} />
            <span className="pf-wallet-opt__icon">{w.emoji}</span>
            <div className="pf-wallet-opt__body">
              <span className="pf-wallet-opt__name">{w.name}</span>
              <span className={`pf-wallet-opt__bal${w.balance < total ? " pf-wallet-opt__bal--low" : ""}`}>
                Balance: ₹{w.balance.toLocaleString()}
                {w.balance < total && " (low)"}
              </span>
            </div>
            <div className={`pf-wallet-opt__dot${wallet === w.id ? " pf-wallet-opt__dot--on" : ""}`} />
          </label>
        ))}
      </div>

      <button type="submit" disabled={busy || !wallet} className="pf-pay-btn">
        <FiLock size={14} /> Pay from Wallet
      </button>
    </form>
  );
}

// ─── Processing overlay ───────────────────────────────────────────────────────

const STEPS = ["Initiating payment…", "Verifying details…", "Processing transaction…", "Confirming payment…"];

function ProcessingOverlay({ step }) {
  return (
    <div className="pf-processing">
      <div className="pf-processing__ring">
        <div className="pf-processing__ring-inner" />
        <FiLock className="pf-processing__lock" size={22} />
      </div>
      <p className="pf-processing__label">{STEPS[Math.min(step, STEPS.length - 1)]}</p>
      <div className="pf-processing__dots">
        {STEPS.map((_, i) => (
          <div key={i} className={`pf-processing__dot${i <= step ? " pf-processing__dot--on" : ""}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const state      = location.state;

  const [processing, setProcessing] = useState(false);
  const [procStep,   setProcStep]   = useState(0);
  const stepTimer = useRef(null);

  useEffect(() => {
    if (!state?.intentId) navigate("/cart", { replace: true });
    return () => clearTimeout(stepTimer.current);
  }, [state, navigate]);

  if (!state?.intentId) return null;

  const { intentId, total, paymentMethod } = state;

  const METHOD_LABELS = {
    card:       { icon: FiCreditCard,  label: "Credit / Debit Card" },
    upi:        { icon: FiSmartphone,  label: "UPI Payment" },
    netbanking: { icon: FiDatabase,    label: "Net Banking" },
    wallet:     { icon: FiGlobe,       label: "Wallet" },
  };
  const { icon: MIcon, label: mLabel } = METHOD_LABELS[paymentMethod] || METHOD_LABELS.card;

  // Runs processing animation then calls API
  const handlePay = async (outcome) => {
    setProcessing(true);
    setProcStep(0);

    // Animate through steps
    for (let i = 1; i < STEPS.length; i++) {
      await new Promise(r => { stepTimer.current = setTimeout(r, 650); });
      setProcStep(i);
    }
    await new Promise(r => { stepTimer.current = setTimeout(r, 500); });

    try {
      if (outcome.ok) {
        const { data } = await axiosInstance.post(`/payments/confirm/${intentId}`);
        dispatch(clearCart());
        dispatch(clearPaymentState());
        navigate("/payment/result", {
          replace: true,
          state: { success: true, orders: data.orders },
        });
      } else {
        await axiosInstance.post(`/payments/fail/${intentId}`, { reason: outcome.msg });
        dispatch(clearPaymentState());
        navigate("/payment/result", {
          replace: true,
          state: { success: false, error: outcome.msg },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="ppage">
      <div className="ppage-container">

        <button className="ppage-back" onClick={() => navigate(-1)} disabled={processing}>
          <FiArrowLeft size={15} /> Back to checkout
        </button>

        <div className="ppage-layout">

          {/* Left: payment form */}
          <div className="ppage-main">
            <div className="ppage-card">
              <div className="ppage-card-head">
                <MIcon size={20} />
                <h2 className="ppage-card-title">{mLabel}</h2>
              </div>

              {processing ? (
                <ProcessingOverlay step={procStep} />
              ) : paymentMethod === "card" ? (
                <CardForm onPay={handlePay} busy={processing} />
              ) : paymentMethod === "upi" ? (
                <UpiForm onPay={handlePay} busy={processing} />
              ) : paymentMethod === "netbanking" ? (
                <NetBankingForm onPay={handlePay} busy={processing} />
              ) : (
                <WalletForm onPay={handlePay} busy={processing} total={total} />
              )}
            </div>
          </div>

          {/* Right: summary */}
          <div className="ppage-sidebar">
            <div className="ppage-summary">
              <h3 className="ppage-summary__title">Order Summary</h3>
              <div className="ppage-summary__total">
                <span>Total Amount</span>
                <strong>₹{total?.toLocaleString()}</strong>
              </div>
              <ul className="ppage-summary__trust">
                <li><FiCheck size={12} /> 256-bit SSL encrypted</li>
                <li><FiCheck size={12} /> PCI-DSS compliant gateway</li>
                <li><FiCheck size={12} /> Instant order confirmation</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
