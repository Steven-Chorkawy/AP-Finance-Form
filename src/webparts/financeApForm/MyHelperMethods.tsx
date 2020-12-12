
export const FormatCurrency = (n: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

export const SumAccounts = (accounts): string => {
    if (!accounts) {
        return FormatCurrency(0);
    }
    return FormatCurrency(accounts.reduce((a, b) => a + (b['AmountIncludingTaxes'] || 0), 0));
};


//#region Form Validation. 
export const AccountsArrayLengthValidator = (value) => {
    console.log('AccountsArrayLengthValidator');
    console.log(value);
    return (value && value.length ? "" : "Please add at least one record.");
}
//#endregion
