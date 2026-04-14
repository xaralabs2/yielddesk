import { describe, it, expect } from "vitest";
import { computeRentalYield, computeCumulativeRent, computeStrategicIRR } from "./portfolio-engine";

describe("computeRentalYield", () => {
  it("returns yield percentage for valid inputs", () => {
    const result = computeRentalYield({
      annualRentNgn: 6_000_000,
      valueNgn: 100_000_000,
    } as any);
    expect(result).toBe(6.0);
  });

  it("returns null when annualRentNgn is zero", () => {
    const result = computeRentalYield({
      annualRentNgn: 0,
      valueNgn: 100_000_000,
    } as any);
    expect(result).toBeNull();
  });

  it("returns null when annualRentNgn is undefined", () => {
    const result = computeRentalYield({
      valueNgn: 100_000_000,
    } as any);
    expect(result).toBeNull();
  });

  it("returns null when valueNgn is zero", () => {
    const result = computeRentalYield({
      annualRentNgn: 5_000_000,
      valueNgn: 0,
    } as any);
    expect(result).toBeNull();
  });

  it("rounds to 2 decimal places", () => {
    const result = computeRentalYield({
      annualRentNgn: 7_333_333,
      valueNgn: 100_000_000,
    } as any);
    expect(result).toBe(7.33);
  });
});

describe("computeCumulativeRent", () => {
  it("returns cumulative rent based on annual rent and time elapsed", () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeCumulativeRent({
      annualRentNgn: 6_000_000,
      entryDate: twoYearsAgo,
      cumulativeRentNgn: 0,
    } as any);
    expect(result).toBeGreaterThan(11_000_000);
    expect(result).toBeLessThan(13_000_000);
  });

  it("returns 0 when entry date is in the future", () => {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeCumulativeRent({
      annualRentNgn: 6_000_000,
      entryDate: futureDate,
      cumulativeRentNgn: 0,
    } as any);
    expect(result).toBe(0);
  });

  it("returns stored cumulative rent when annual rent is missing", () => {
    const result = computeCumulativeRent({
      annualRentNgn: null,
      entryDate: "2020-01-01",
      cumulativeRentNgn: 5_000_000,
    } as any);
    expect(result).toBe(5_000_000);
  });

  it("returns 0 when no data available", () => {
    const result = computeCumulativeRent({
      cumulativeRentNgn: null,
    } as any);
    expect(result).toBe(0);
  });
});

describe("computeStrategicIRR", () => {
  it("calculates positive IRR for appreciating asset", () => {
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeStrategicIRR(
      {
        entryDate: threeYearsAgo,
        entryValueNgn: 50_000_000,
        valueNgn: 50_000_000,
        annualRentNgn: 3_000_000,
        cumulativeRentNgn: 0,
      } as any,
      70_000_000,
    );
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("returns null when entry date is missing", () => {
    const result = computeStrategicIRR(
      {
        entryValueNgn: 50_000_000,
        valueNgn: 50_000_000,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      70_000_000,
    );
    expect(result).toBeNull();
  });

  it("returns null when entry value is zero", () => {
    const result = computeStrategicIRR(
      {
        entryDate: "2020-01-01",
        entryValueNgn: 0,
        valueNgn: 0,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      50_000_000,
    );
    expect(result).toBeNull();
  });

  it("returns null for very recent entries", () => {
    const yesterday = new Date(Date.now() - 1000).toISOString();
    const result = computeStrategicIRR(
      {
        entryDate: yesterday,
        entryValueNgn: 50_000_000,
        valueNgn: 50_000_000,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      55_000_000,
    );
    expect(result).toBeNull();
  });

  it("uses valueNgn as entry value when entryValueNgn is null", () => {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeStrategicIRR(
      {
        entryDate: oneYearAgo,
        entryValueNgn: null,
        valueNgn: 50_000_000,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      60_000_000,
    );
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("includes cumulative rent in total return calculation", () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const withoutRent = computeStrategicIRR(
      {
        entryDate: twoYearsAgo,
        entryValueNgn: 50_000_000,
        valueNgn: 50_000_000,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      60_000_000,
    );
    const withRent = computeStrategicIRR(
      {
        entryDate: twoYearsAgo,
        entryValueNgn: 50_000_000,
        valueNgn: 50_000_000,
        annualRentNgn: 5_000_000,
        cumulativeRentNgn: 0,
      } as any,
      60_000_000,
    );
    expect(withRent!).toBeGreaterThan(withoutRent!);
  });

  it("returns a rounded value to 2 decimal places", () => {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeStrategicIRR(
      {
        entryDate: oneYearAgo,
        entryValueNgn: 100_000_000,
        valueNgn: 100_000_000,
        annualRentNgn: 0,
        cumulativeRentNgn: 0,
      } as any,
      115_000_000,
    );
    expect(result).not.toBeNull();
    const str = result!.toString();
    const decimals = str.includes(".") ? str.split(".")[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
