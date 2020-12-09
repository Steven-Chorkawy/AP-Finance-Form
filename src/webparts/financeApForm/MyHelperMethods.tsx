
export const FormatCurrency = (n: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

export const SumAccounts = (accounts): string => {
    if (!accounts) {
        return FormatCurrency(0);
    }
    return FormatCurrency(accounts.reduce((a, b) => a + (b['AmountIncludingTaxes'] || 0), 0));
};