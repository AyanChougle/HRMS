/**
 * DIALLO HRMS — INDIAN STATUTORY & PAYROLL ENGINE (PHASE 3)
 * Full calculation engine for EPF, ESIC, State PT, Section 192 TDS, and Gratuity Act 1972
 */

const StatutoryEngine = {
  // Statutory Wage Ceilings & Rates
  CONFIG: {
    EPF_WAGE_CEILING: 15000,       // ₹15,000 / month PF statutory wage ceiling
    EPF_EE_RATE: 0.12,            // 12% Employee EPF
    EPF_ER_RATE: 0.0367,          // 3.67% Employer EPF share
    EPS_ER_RATE: 0.0833,          // 8.33% Employer EPS (Pension Fund)
    EPF_ADMIN_RATE: 0.005,        // 0.5% Admin charges
    EDLI_RATE: 0.005,             // 0.5% EDLI insurance

    ESIC_WAGE_CEILING: 21000,      // ₹21,000 / month gross wage ceiling
    ESIC_EE_RATE: 0.0075,         // 0.75% Employee ESIC
    ESIC_ER_RATE: 0.0325,         // 3.25% Employer ESIC

    GRATUITY_FACTOR: 15 / 26      // 15 days out of 26 working days per year
  },

  // Calculate State-wise Professional Tax (PT)
  calculateProfessionalTax(monthlyGross, state = 'Maharashtra', monthIndex = new Date().getMonth()) {
    const gross = Number(monthlyGross) || 0;
    const normalizedState = (state || 'Maharashtra').toLowerCase();

    if (normalizedState.includes('maharashtra') || normalizedState.includes('mumbai') || normalizedState.includes('pune')) {
      if (gross > 10000) {
        // In Maharashtra, Feb is ₹300, remaining months ₹200
        return monthIndex === 1 ? 300 : 200;
      } else if (gross > 7500) {
        return 175;
      }
      return 0;
    }

    if (normalizedState.includes('karnataka') || normalizedState.includes('bengaluru') || normalizedState.includes('bangalore')) {
      return gross >= 15000 ? 200 : 0;
    }

    if (normalizedState.includes('telangana') || normalizedState.includes('hyderabad')) {
      if (gross > 20000) return 200;
      if (gross > 15000) return 150;
      return 0;
    }

    if (normalizedState.includes('delhi') || normalizedState.includes('gurugram') || normalizedState.includes('noida') || normalizedState.includes('haryana')) {
      return 0; // No Professional Tax in Delhi / Haryana
    }

    // Default general PT
    return gross > 15000 ? 200 : 0;
  },

  // Break down Gross Salary into CTC Components (Indian Wage Code compliant: Basic >= 50%)
  calculateSalaryStructure(monthlyGross, isMetro = true, state = 'Maharashtra') {
    const gross = Math.max(0, Number(monthlyGross) || 0);

    // 1. Earnings Breakdown
    const basic = Math.round(gross * 0.50); // 50% of Gross as Basic
    const hraRate = isMetro ? 0.50 : 0.40;  // 50% for Metro (Mumbai/Blr/Delhi), 40% non-metro
    const hra = Math.round(basic * hraRate);
    const conveyance = Math.min(1600, Math.round(gross * 0.05)); // Standard conveyance allowance
    const medicalAllowance = Math.min(1250, Math.round(gross * 0.03));
    const specialAllowance = Math.max(0, gross - (basic + hra + conveyance + medicalAllowance));

    // 2. EPF Calculations (Employee & Employer)
    const pfWages = Math.min(basic, this.CONFIG.EPF_WAGE_CEILING);
    const epfEmployee = Math.round(pfWages * this.CONFIG.EPF_EE_RATE);
    const epfEmployer = Math.round(pfWages * this.CONFIG.EPF_ER_RATE);
    const epsEmployer = Math.round(pfWages * this.CONFIG.EPS_ER_RATE);
    const epfTotalEmployer = epfEmployer + epsEmployer;

    // 3. ESIC Calculations (Applicable if Gross <= ₹21,000)
    let esicEmployee = 0;
    let esicEmployer = 0;
    if (gross <= this.CONFIG.ESIC_WAGE_CEILING && gross > 0) {
      esicEmployee = Math.ceil(gross * this.CONFIG.ESIC_EE_RATE);
      esicEmployer = Math.ceil(gross * this.CONFIG.ESIC_ER_RATE);
    }

    // 4. Professional Tax (PT)
    const pt = this.calculateProfessionalTax(gross, state);

    // 5. Projected Monthly TDS (Section 192) under New Regime (Section 115BAC)
    const annualGross = gross * 12;
    const stdDeduction = 75000; // FY 2024-26 Standard Deduction
    const taxableIncome = Math.max(0, annualGross - stdDeduction);
    let annualTds = 0;

    // New Tax Regime Slabs (FY 2024-26)
    if (taxableIncome <= 300000) {
      annualTds = 0;
    } else if (taxableIncome <= 700000) {
      annualTds = (taxableIncome - 300000) * 0.05;
      if (taxableIncome <= 700000) annualTds = 0; // Section 87A rebate
    } else if (taxableIncome <= 1000000) {
      annualTds = 20000 + (taxableIncome - 700000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      annualTds = 50000 + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      annualTds = 80000 + (taxableIncome - 1200000) * 0.20;
    } else {
      annualTds = 140000 + (taxableIncome - 1500000) * 0.30;
    }

    // Add 4% Health & Education Cess
    annualTds = Math.round(annualTds * 1.04);
    const monthlyTds = Math.round(annualTds / 12);

    // 6. Deductions Total & Net Payout
    const totalDeductions = epfEmployee + esicEmployee + pt + monthlyTds;
    const netSalary = Math.max(0, gross - totalDeductions);

    // 7. Employer Cost (CTC)
    const gratuityMonthlyProvision = Math.round((basic * 15) / (26 * 12));
    const monthlyCtc = gross + epfTotalEmployer + esicEmployer + gratuityMonthlyProvision;

    return {
      gross,
      monthlyCtc,
      annualCtc: monthlyCtc * 12,
      earnings: {
        basic,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,
        totalEarnings: gross
      },
      deductions: {
        epfEmployee,
        esicEmployee,
        professionalTax: pt,
        tds: monthlyTds,
        totalDeductions
      },
      employerContributions: {
        epfEmployer,
        epsEmployer,
        epfTotalEmployer,
        esicEmployer,
        gratuityMonthlyProvision,
        totalEmployerCost: epfTotalEmployer + esicEmployer + gratuityMonthlyProvision
      },
      netSalary
    };
  },

  // Gratuity Liability Calculation under Payment of Gratuity Act 1972
  calculateGratuity(lastDrawnBasic, yearsOfService) {
    const basic = Number(lastDrawnBasic) || 0;
    const years = Number(yearsOfService) || 0;
    if (years < 5) {
      return { eligible: false, amount: 0, reason: 'Minimum 5 continuous years required under Payment of Gratuity Act 1972' };
    }
    const gratuity = Math.round((15 * basic * years) / 26);
    return {
      eligible: true,
      amount: Math.min(2000000, gratuity), // Capped at statutory ₹20 Lakhs
      formula: `(15 * ₹${basic.toLocaleString('en-IN')} * ${years}) / 26`
    };
  },

  // Convert number to Indian Currency Words (e.g. 52,400 -> Fifty Two Thousand Four Hundred Rupees Only)
  amountToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      let str = '';
      if (n > 9999999) {
        str += inWords(Math.floor(n / 10000000)) + ' Crore ';
        n %= 10000000;
      }
      if (n > 99999) {
        str += inWords(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
      }
      if (n > 999) {
        str += inWords(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      if (n > 99) {
        str += inWords(Math.floor(n / 100)) + ' Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n];
        else {
          str += b[Math.floor(n / 10)];
          if (n % 10 > 0) str += ' ' + a[n % 10];
        }
      }
      return str.trim();
    };

    const amount = Math.round(Number(num) || 0);
    if (amount === 0) return 'Zero Rupees Only';
    return inWords(amount) + ' Rupees Only';
  }
};

window.StatutoryEngine = StatutoryEngine;
