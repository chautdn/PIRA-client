// Vietnamese banks
export const VIETNAMESE_BANKS = [
  { code: "VCB", name: "Vietcombank", accountLength: [13, 16] },
  { code: "TCB", name: "Techcombank", accountLength: [12, 19] },
  { code: "BIDV", name: "BIDV", accountLength: [12, 14] },
  { code: "VTB", name: "Vietinbank", accountLength: [12, 16] },
  { code: "ACB", name: "ACB", accountLength: [10, 15] },
  { code: "MB", name: "MB Bank", accountLength: [12, 13] },
  { code: "TPB", name: "TPBank", accountLength: [10, 12] },
  { code: "STB", name: "Sacombank", accountLength: [13, 16] },
  { code: "VPB", name: "VPBank", accountLength: [12, 13] },
  { code: "AGR", name: "Agribank", accountLength: [13, 14] },
  { code: "EIB", name: "Eximbank", accountLength: [12, 16] },
  { code: "MSB", name: "MSB", accountLength: [12, 13] },
  { code: "SCB", name: "SCB", accountLength: [12, 13] },
  { code: "SHB", name: "SHB", accountLength: [12, 13] },
  { code: "OCB", name: "OCB", accountLength: [12, 14] },
];

// Limits
export const LIMITS = {
  MIN: 10000, // 10K VND
  MAX: 50000000, // 50M VND per transaction
  DAILY: 100000000, // 100M VND per day
};

// Status display
export const WITHDRAWAL_STATUS = {
  pending: { label: "Pending", color: "yellow", icon: "Clock" },
  processing: { label: "Processing", color: "blue", icon: "Loader" },
  completed: { label: "Completed", color: "green", icon: "CheckCircle" },
  rejected: { label: "Rejected", color: "red", icon: "XCircle" },
  cancelled: { label: "Cancelled", color: "gray", icon: "XCircle" },
};

// Validation
export const validateBankAccount = (bankCode, accountNumber) => {
  const bank = VIETNAMESE_BANKS.find((b) => b.code === bankCode);
  if (!bank) return { valid: false, error: "Invalid bank" };

  const clean = accountNumber.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(clean))
    return { valid: false, error: "Only digits allowed" };

  const [min, max] = bank.accountLength;
  if (clean.length < min || clean.length > max) {
    return { valid: false, error: `Must be ${min}-${max} digits` };
  }

  return { valid: true, clean };
};

export const validateAmount = (amount, balance, dailyTotal) => {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return { valid: false, error: "Invalid amount" };
  if (num < LIMITS.MIN)
    return { valid: false, error: `Min: ${formatCurrency(LIMITS.MIN)}` };
  if (num > LIMITS.MAX)
    return {
      valid: false,
      error: `Max per transaction: ${formatCurrency(LIMITS.MAX)}`,
    };
  if (num > balance) return { valid: false, error: "Insufficient balance" };
  if (dailyTotal + num > LIMITS.DAILY) {
    return {
      valid: false,
      error: `Daily limit exceeded (${formatCurrency(LIMITS.DAILY)})`,
    };
  }
  return { valid: true };
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0 VND";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
