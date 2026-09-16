"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatAed } from "@/lib/utils";

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-950">{label}</label>
      <div className="relative">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-sand-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function InvestmentCalculatorForm() {
  const [purchasePrice, setPurchasePrice] = useState(2000000);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [interestRatePct, setInterestRatePct] = useState(4.5);
  const [termYears, setTermYears] = useState(25);
  const [monthlyRent, setMonthlyRent] = useState(9000);
  const [annualServiceChargeAed, setAnnualServiceChargeAed] = useState(15000);
  const [vacancyPct, setVacancyPct] = useState(5);

  const result = useMemo(() => {
    const downPayment = purchasePrice * (downPaymentPct / 100);
    const loanAmount = purchasePrice - downPayment;
    const monthlyRate = interestRatePct / 100 / 12;
    const numPayments = termYears * 12;

    const monthlyMortgage =
      monthlyRate === 0
        ? loanAmount / numPayments
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));

    const effectiveMonthlyRent = monthlyRent * (1 - vacancyPct / 100);
    const annualGrossRent = monthlyRent * 12;
    const annualNetRent = effectiveMonthlyRent * 12 - annualServiceChargeAed;
    const annualCashFlow = annualNetRent - monthlyMortgage * 12;

    const grossYieldPct = (annualGrossRent / purchasePrice) * 100;
    const netYieldPct = (annualNetRent / purchasePrice) * 100;
    const cashOnCashPct = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    return {
      downPayment,
      loanAmount,
      monthlyMortgage,
      annualCashFlow,
      monthlyCashFlow: annualCashFlow / 12,
      grossYieldPct,
      netYieldPct,
      cashOnCashPct,
    };
  }, [purchasePrice, downPaymentPct, interestRatePct, termYears, monthlyRent, annualServiceChargeAed, vacancyPct]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-6">
        <Field label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} suffix="AED" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Down payment" value={downPaymentPct} onChange={setDownPaymentPct} suffix="%" />
          <Field label="Interest rate" value={interestRatePct} onChange={setInterestRatePct} suffix="%" />
        </div>
        <Field label="Mortgage term" value={termYears} onChange={setTermYears} suffix="years" />
        <Field label="Expected monthly rent" value={monthlyRent} onChange={setMonthlyRent} suffix="AED" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Annual service charge" value={annualServiceChargeAed} onChange={setAnnualServiceChargeAed} suffix="AED" />
          <Field label="Vacancy rate" value={vacancyPct} onChange={setVacancyPct} suffix="%" />
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-500">Down payment</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{formatAed(result.downPayment, { compact: true })}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-500">Monthly mortgage payment</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{formatAed(result.monthlyMortgage)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sand-500">Gross yield</p>
            <p className="mt-1 text-lg font-semibold text-ink-950">{result.grossYieldPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-sand-500">Net yield</p>
            <p className="mt-1 text-lg font-semibold text-ink-950">{result.netYieldPct.toFixed(1)}%</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-500">Cash-on-cash return</p>
          <p className={`mt-1 text-xl font-semibold ${result.cashOnCashPct >= 0 ? "text-success" : "text-danger"}`}>
            {result.cashOnCashPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-500">Monthly cash flow</p>
          <p className={`mt-1 text-xl font-semibold ${result.monthlyCashFlow >= 0 ? "text-success" : "text-danger"}`}>
            {formatAed(result.monthlyCashFlow)}
          </p>
        </div>
      </Card>
    </div>
  );
}
